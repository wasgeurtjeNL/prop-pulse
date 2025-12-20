#!/usr/bin/env python3
"""
Property Scraper - Scrapes property listings and converts them to PSM Phuket format.

Usage:
    python scrape_property.py <url> [--preview] [--import]
    
Examples:
    python scrape_property.py "https://example.com/property/villa" --preview
    python scrape_property.py "https://example.com/property/villa" --import
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file in parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# PSM Phuket API configuration
PSM_PHUKET_API_URL = os.getenv('PSM_PHUKET_API_URL', 'http://localhost:3000')
PSM_PHUKET_API_KEY = os.getenv('PSM_PHUKET_IMPORT_API_KEY', '')

# Mapping of common amenities to Lucide icons
AMENITY_ICONS = {
    "swimming pool": "waves",
    "pool": "waves",
    "garden": "flower2",
    "parking": "car",
    "garage": "car",
    "covered car park": "car",
    "balcony": "door-open",
    "terrace": "sun",
    "terace": "sun",
    "kitchen": "cooking-pot",
    "fully equipped kitchen": "cooking-pot",
    "living room": "sofa",
    "bedroom": "bed-double",
    "bathroom": "bath",
    "air conditioning": "air-vent",
    "central cooling": "air-vent",
    "central heating": "flame",
    "gym": "dumbbell",
    "fitness": "dumbbell",
    "security": "shield",
    "cctv": "cctv",
    "elevator": "arrow-up-down",
    "wifi": "wifi",
    "internet": "wifi",
    "sea view": "waves",
    "mountain view": "mountain",
    "sunset view": "sunset",
    "bbq": "flame",
    "barbecue area": "flame",
    "laundry": "shirt",
    "laundry room": "shirt",
    "fully furnished": "armchair",
    "furnished": "armchair",
    "2 stories": "building-2",
    "3 stories": "building-2",
    "fire alarm": "bell-ring",
    "fire place": "flame",
    "jacuzzi": "waves",
    "home theater": "tv",
    "roof top": "sun",
    "private beach": "umbrella",
    "electric range": "zap",
}


def get_icon_for_amenity(amenity: str) -> str:
    """Get the appropriate Lucide icon for an amenity."""
    amenity_lower = amenity.lower().strip()
    for key, icon in AMENITY_ICONS.items():
        if key in amenity_lower or amenity_lower in key:
            return icon
    return "check"  # Default icon


def scrape_webpage(url: str, retries: int = 3) -> tuple[str, list[str]]:
    """Scrape the webpage and extract text content and image URLs."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    import time
    last_error = None
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            break
        except requests.RequestException as e:
            last_error = e
            if attempt < retries - 1:
                print(f"   ⚠️ Retry {attempt + 1}/{retries - 1} after error: {e}")
                time.sleep(2)  # Wait before retrying
            else:
                raise Exception(f"Failed to fetch URL after {retries} attempts: {last_error}")
    
    soup = BeautifulSoup(response.content, 'lxml')
    
    # Remove script and style elements
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.decompose()
    
    # Extract main content text
    text = soup.get_text(separator='\n', strip=True)
    
    # Clean up text - remove excessive whitespace
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    text = '\n'.join(lines)
    
    # Extract image URLs - look for property images
    images = []
    
    # Look for images in gallery/slider sections
    for img in soup.find_all('img'):
        src = img.get('src') or img.get('data-src')
        if src and not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'placeholder', 'loading']):
            # Make absolute URL if relative
            if src.startswith('//'):
                src = 'https:' + src
            elif src.startswith('/'):
                parsed = urlparse(url)
                src = f"{parsed.scheme}://{parsed.netloc}{src}"
            images.append(src)
    
    # Also look for links to images (often used in galleries)
    for link in soup.find_all('a', href=True):
        href = link['href']
        if any(ext in href.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            if href.startswith('//'):
                href = 'https:' + href
            elif href.startswith('/'):
                parsed = urlparse(url)
                href = f"{parsed.scheme}://{parsed.netloc}{href}"
            if href not in images:
                images.append(href)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_images = []
    for img in images:
        if img not in seen:
            # Filter out QR codes, chart APIs, and other non-property images
            if 'chart.googleapis.com' in img or 'chart.apis.google.com' in img:
                continue
            if 'qr' in img.lower() and 'chart' in img.lower():
                continue
            seen.add(img)
            unique_images.append(img)
    
    return text, unique_images[:20]  # Limit to 20 images


def extract_property_data_with_ai(text: str, images: list[str], source_url: str) -> dict:
    """Use OpenAI to extract and structure property data from the scraped text."""
    
    prompt = f"""You are a real estate data extraction expert. Extract property information from the following webpage content and return it as a structured JSON object.

The property must match this exact schema for our PSM Phuket platform:

{{
    "title": "Property title (string, required)",
    "location": "Full address or location (string, required)",
    "price": "Price with currency symbol (string, e.g., '฿34,800,000' or '$500,000')",
    "beds": "Number of bedrooms (integer)",
    "baths": "Number of bathrooms (float, can be 2.5 for half baths)",
    "sqft": "Size in square meters (integer) - convert from sq ft if needed",
    "type": "FOR_SALE or FOR_RENT (based on listing type)",
    "category": "One of: LUXURY_VILLA, APARTMENT, RESIDENTIAL_HOME, OFFICE_SPACES",
    "tag": "Optional tag like 'Featured', 'New', 'Hot Deal' or empty string",
    "shortDescription": "1-2 sentence summary of the property (max 200 chars)",
    "content": "Full property description (combine all description paragraphs)",
    "amenities": ["Array of amenity names as strings"],
    "garage": "Number of garage/parking spaces (integer, optional)",
    "lotSize": "Lot size in sq meters (integer, optional)",
    "yearBuilt": "Year built (integer, optional, if mentioned)"
}}

Important rules:
1. If the listing says "For Sale" -> type = "FOR_SALE"
2. If the listing says "For Rent" -> type = "FOR_RENT"
3. For category:
   - Villas, large houses with pool -> LUXURY_VILLA
   - Condos, apartments, flats -> APARTMENT
   - Regular houses, townhouses -> RESIDENTIAL_HOME
   - Offices, commercial -> OFFICE_SPACES
4. Convert any imperial units to metric (sqft to sqm: divide by 10.764)
5. Extract ALL amenities/features mentioned
6. Make the shortDescription compelling for SEO

Source URL: {source_url}

WEBPAGE CONTENT:
{text[:15000]}

Return ONLY the JSON object, no markdown, no explanation."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a precise data extraction assistant that outputs only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Clean up the response - remove markdown code blocks if present
        if result_text.startswith('```'):
            result_text = re.sub(r'^```(?:json)?\n?', '', result_text)
            result_text = re.sub(r'\n?```$', '', result_text)
        
        property_data = json.loads(result_text)
        
        # Add images to the data
        property_data['images'] = images[:10]  # Limit to 10 images
        
        # Add amenities with icons
        if 'amenities' in property_data and property_data['amenities']:
            property_data['amenitiesWithIcons'] = [
                {"name": amenity, "icon": get_icon_for_amenity(amenity)}
                for amenity in property_data['amenities']
            ]
        
        # Add source URL for reference
        property_data['sourceUrl'] = source_url
        
        return property_data
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {e}\nResponse: {result_text}")
    except Exception as e:
        raise Exception(f"AI extraction failed: {e}")


def validate_property_data(data: dict) -> list[str]:
    """Validate the extracted property data and return list of issues."""
    issues = []
    
    required_fields = ['title', 'location', 'price', 'beds', 'baths', 'sqft', 'type', 'category', 'content']
    
    for field in required_fields:
        if field not in data or not data[field]:
            issues.append(f"Missing required field: {field}")
    
    if data.get('type') not in ['FOR_SALE', 'FOR_RENT']:
        issues.append(f"Invalid type: {data.get('type')}. Must be FOR_SALE or FOR_RENT")
    
    if data.get('category') not in ['LUXURY_VILLA', 'APARTMENT', 'RESIDENTIAL_HOME', 'OFFICE_SPACES']:
        issues.append(f"Invalid category: {data.get('category')}")
    
    if not data.get('amenities') or len(data.get('amenities', [])) < 1:
        issues.append("At least one amenity is required")
    
    if not data.get('images') or len(data.get('images', [])) < 1:
        issues.append("At least one image is required")
    
    return issues


def import_to_psm_phuket(data: dict) -> dict:
    """Send the property data to PSM Phuket API for import."""
    
    api_url = f"{PSM_PHUKET_API_URL}/api/properties/import"
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': PSM_PHUKET_API_KEY
    }
    
    try:
        response = requests.post(api_url, json=data, headers=headers, timeout=120)
        if not response.ok:
            try:
                error_details = response.json()
                raise Exception(f"API Error ({response.status_code}): {json.dumps(error_details, indent=2)}")
            except json.JSONDecodeError:
                raise Exception(f"API Error ({response.status_code}): {response.text}")
        return response.json()
    except requests.RequestException as e:
        raise Exception(f"Failed to import to PSM Phuket: {e}")


def save_to_file(data: dict, url: str):
    """Save the extracted data to a JSON file."""
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(__file__), 'output')
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename from URL
    parsed = urlparse(url)
    slug = parsed.path.strip('/').replace('/', '_') or 'property'
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{slug}_{timestamp}.json"
    
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return filepath


def main():
    parser = argparse.ArgumentParser(description='Scrape property listings for PSM Phuket')
    parser.add_argument('url', help='URL of the property listing to scrape, or path to a JSON file')
    parser.add_argument('--preview', action='store_true', help='Only preview the extracted data, do not import')
    parser.add_argument('--import', dest='do_import', action='store_true', help='Import the data to PSM Phuket')
    parser.add_argument('--save', action='store_true', help='Save the extracted data to a JSON file')
    parser.add_argument('--from-file', action='store_true', help='Load data from a JSON file instead of scraping')
    
    args = parser.parse_args()
    
    print(f"\n{'='*60}")
    print(f"🏠 PSM Phuket Property Scraper")
    print(f"{'='*60}")
    print(f"\n📍 Input: {args.url}\n")
    
    # Check if loading from file
    if args.from_file or args.url.endswith('.json'):
        print("📂 Loading from JSON file...")
        try:
            with open(args.url, 'r', encoding='utf-8') as f:
                property_data = json.load(f)
            print(f"   ✓ Loaded property data from file")
        except Exception as e:
            print(f"   ✗ Error loading file: {e}")
            sys.exit(1)
    else:
        # Step 1: Scrape the webpage
        print("📥 Step 1: Scraping webpage...")
        try:
            text, images = scrape_webpage(args.url)
            print(f"   ✓ Extracted {len(text)} characters of text")
            print(f"   ✓ Found {len(images)} images")
        except Exception as e:
            print(f"   ✗ Error: {e}")
            sys.exit(1)
        
        # Step 2: Extract data with AI
        print("\n🤖 Step 2: Extracting data with AI...")
        try:
            property_data = extract_property_data_with_ai(text, images, args.url)
            print(f"   ✓ Successfully extracted property data")
        except Exception as e:
            print(f"   ✗ Error: {e}")
            sys.exit(1)
    
    # Step 3: Validate data
    print("\n✅ Step 3: Validating data...")
    issues = validate_property_data(property_data)
    if issues:
        print(f"   ⚠️ Validation warnings:")
        for issue in issues:
            print(f"      - {issue}")
    else:
        print(f"   ✓ All required fields present")
    
    # Display extracted data
    print(f"\n{'='*60}")
    print("📋 EXTRACTED PROPERTY DATA")
    print(f"{'='*60}")
    print(f"\n📌 Title: {property_data.get('title', 'N/A')}")
    print(f"📍 Location: {property_data.get('location', 'N/A')}")
    print(f"💰 Price: {property_data.get('price', 'N/A')}")
    print(f"🛏️  Beds: {property_data.get('beds', 'N/A')}")
    print(f"🚿 Baths: {property_data.get('baths', 'N/A')}")
    print(f"📐 Size: {property_data.get('sqft', 'N/A')} m²")
    print(f"🏷️  Type: {property_data.get('type', 'N/A')}")
    print(f"📂 Category: {property_data.get('category', 'N/A')}")
    print(f"🏷️  Tag: {property_data.get('tag', 'None')}")
    
    print(f"\n📝 Short Description:")
    print(f"   {property_data.get('shortDescription', 'N/A')}")
    
    print(f"\n🎯 Amenities ({len(property_data.get('amenities', []))}):")
    for amenity in property_data.get('amenities', [])[:10]:
        icon = get_icon_for_amenity(amenity)
        print(f"   • {amenity} (icon: {icon})")
    
    print(f"\n🖼️  Images ({len(property_data.get('images', []))}):")
    for i, img in enumerate(property_data.get('images', [])[:5], 1):
        print(f"   {i}. {img[:80]}...")
    
    # Save to file if requested or by default in preview mode
    if args.save or args.preview:
        print(f"\n💾 Saving to file...")
        filepath = save_to_file(property_data, args.url)
        print(f"   ✓ Saved to: {filepath}")
    
    # Import if requested
    if args.do_import:
        if issues:
            print(f"\n⚠️ Cannot import: validation issues found")
            print("   Fix the issues or use --save to save and edit manually")
            sys.exit(1)
        
        print(f"\n🚀 Step 4: Importing to PSM Phuket...")
        try:
            result = import_to_psm_phuket(property_data)
            print(f"   ✓ Successfully imported!")
            print(f"   📎 Property ID: {result.get('id', 'N/A')}")
            print(f"   🔗 Slug: {result.get('slug', 'N/A')}")
        except Exception as e:
            print(f"   ✗ Error: {e}")
            sys.exit(1)
    
    print(f"\n{'='*60}")
    print("✨ Done!")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()

