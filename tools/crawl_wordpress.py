#!/usr/bin/env python3
"""
WordPress Site Crawler for URL Migration
=========================================
Dit script crawlt psmphuket.com (of een andere WordPress site) om alle URL's
in kaart te brengen voor een redirect mapping naar de nieuwe Next.js site.

Gebruik:
    python crawl_wordpress.py --url https://psmphuket.com --output output/redirect_mapping.csv
"""

import argparse
import csv
import json
import re
import sys
import time
import warnings
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional, Set
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning

# Suppress XML parsing warning
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Configuratie
DEFAULT_DELAY = 0.5  # Seconden tussen requests
MAX_PAGES = 500  # Maximum aantal pagina's om te crawlen
TIMEOUT = 10  # Request timeout in seconden

# User agent om te voorkomen dat we geblokkeerd worden
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}


@dataclass
class PageInfo:
    """Informatie over een gevonden pagina"""
    url: str
    title: str = ""
    page_type: str = "unknown"
    status_code: int = 0
    meta_description: str = ""
    h1: str = ""
    canonical: str = ""
    suggested_redirect: str = ""


@dataclass
class CrawlResult:
    """Resultaat van de crawl"""
    base_url: str
    pages: list = field(default_factory=list)
    errors: list = field(default_factory=list)
    sitemap_urls: list = field(default_factory=list)


class WordPressCrawler:
    """Crawler voor WordPress websites"""
    
    def __init__(self, base_url: str, delay: float = DEFAULT_DELAY, max_pages: int = MAX_PAGES):
        self.base_url = base_url.rstrip('/')
        self.domain = urlparse(base_url).netloc
        self.delay = delay
        self.max_pages = max_pages
        self.visited: Set[str] = set()
        self.to_visit: Set[str] = set()
        self.pages: list[PageInfo] = []
        self.errors: list[dict] = []
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
    
    def normalize_url(self, url: str) -> str:
        """Normaliseer een URL (verwijder fragment, trailing slash, etc.)"""
        parsed = urlparse(url)
        # Verwijder fragment (#)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        # Verwijder trailing slash behalve voor root
        if normalized != f"{parsed.scheme}://{parsed.netloc}/" and normalized.endswith('/'):
            normalized = normalized.rstrip('/')
        return normalized
    
    def is_valid_url(self, url: str) -> bool:
        """Check of een URL geldig is om te crawlen"""
        parsed = urlparse(url)
        
        # Moet zelfde domein zijn
        if parsed.netloc != self.domain:
            return False
        
        # Skip bepaalde bestandstypes
        skip_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.css', '.js', '.ico', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot']
        path_lower = parsed.path.lower()
        if any(path_lower.endswith(ext) for ext in skip_extensions):
            return False
        
        # Skip WordPress admin/login
        skip_paths = ['/wp-admin', '/wp-login', '/wp-includes', '/wp-content/uploads', '/feed', '/xmlrpc.php', '/wp-json']
        if any(path_lower.startswith(skip) for skip in skip_paths):
            return False
        
        # Skip query parameters die duplicates veroorzaken
        skip_params = ['replytocom', 'share=', 'like_comment', 'print=']
        if parsed.query and any(param in parsed.query for param in skip_params):
            return False
        
        return True
    
    def detect_page_type(self, url: str, soup: BeautifulSoup) -> str:
        """Detecteer het type pagina op basis van URL en content"""
        path = urlparse(url).path.lower()
        
        # Check body classes (WordPress specifiek)
        body = soup.find('body')
        body_classes = body.get('class', []) if body else []
        body_class_str = ' '.join(body_classes) if isinstance(body_classes, list) else str(body_classes)
        
        # Property/Listing detectie
        if any(x in path for x in ['/property/', '/listing/', '/villa/', '/house/', '/condo/', '/apartment/']):
            return 'property'
        if 'single-property' in body_class_str or 'single-listing' in body_class_str:
            return 'property'
        
        # Blog detectie
        if '/blog/' in path or '/news/' in path or '/article/' in path:
            return 'blog'
        if 'single-post' in body_class_str:
            return 'blog'
        
        # Category/Archive
        if '/category/' in path or '/tag/' in path:
            return 'archive'
        if 'archive' in body_class_str or 'category' in body_class_str:
            return 'archive'
        
        # Agent pagina's
        if '/agent/' in path or '/agents/' in path:
            return 'agent'
        
        # Pagina types
        if path in ['/', '']:
            return 'homepage'
        if any(x in path for x in ['/about', '/over-ons', '/team']):
            return 'about'
        if any(x in path for x in ['/contact', '/contactus']):
            return 'contact'
        if any(x in path for x in ['/privacy', '/gdpr']):
            return 'privacy'
        if any(x in path for x in ['/terms', '/voorwaarden', '/conditions']):
            return 'terms'
        if any(x in path for x in ['/service', '/dienst']):
            return 'service'
        if any(x in path for x in ['/rental', '/verhuur', '/rent']):
            return 'rental'
        if any(x in path for x in ['/location', '/area', '/region']):
            return 'location'
        if any(x in path for x in ['/faq', '/veelgestelde-vragen']):
            return 'faq'
        
        # Default: statische pagina
        if 'page' in body_class_str:
            return 'page'
        
        return 'unknown'
    
    def suggest_redirect(self, page: PageInfo) -> str:
        """Genereer een redirect suggestie voor de nieuwe site"""
        path = urlparse(page.url).path
        
        # Mapping regels op basis van page type
        redirect_rules = {
            'homepage': '/',
            'about': '/about',
            'contact': '/contact',
            'privacy': '/privacy-policy',
            'terms': '/terms-and-conditions',
            'rental': '/rental-services',
            'faq': '/faq',
        }
        
        if page.page_type in redirect_rules:
            return redirect_rules[page.page_type]
        
        if page.page_type == 'property':
            # Extraheer slug uit URL
            slug = path.rstrip('/').split('/')[-1]
            # Listings route zoekt alleen op slug (geen province/area nodig)
            return f'/listings/{slug}'
        
        if page.page_type == 'blog':
            slug = path.rstrip('/').split('/')[-1]
            return f'/blogs/{slug}'
        
        if page.page_type == 'agent':
            # Agent pagina's redirecten naar about of contact
            return '/about'
        
        if page.page_type == 'archive':
            return '/properties'
        
        if page.page_type == 'location':
            slug = path.rstrip('/').split('/')[-1]
            return f'/locations/{slug}'
        
        if page.page_type == 'service':
            slug = path.rstrip('/').split('/')[-1]
            return f'/services/{slug}'
        
        # Fallback: behoud path maar clean het op
        clean_path = re.sub(r'^/(blog|news|article)/', '/blogs/', path)
        clean_path = re.sub(r'^/(property|listing|properties)/', '/properties/phuket/other/', clean_path)
        
        return clean_path if clean_path != path else '/properties'
    
    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Haal een pagina op en return de BeautifulSoup object"""
        try:
            response = self.session.get(url, timeout=TIMEOUT, allow_redirects=True)
            
            # Sla de uiteindelijke URL op (na redirects)
            final_url = response.url
            
            if response.status_code == 200:
                return BeautifulSoup(response.text, 'lxml')
            else:
                self.errors.append({
                    'url': url,
                    'status_code': response.status_code,
                    'error': f'HTTP {response.status_code}'
                })
                return None
                
        except requests.RequestException as e:
            self.errors.append({
                'url': url,
                'status_code': 0,
                'error': str(e)
            })
            return None
    
    def extract_page_info(self, url: str, soup: BeautifulSoup) -> PageInfo:
        """Extraheer informatie uit een pagina"""
        # Title
        title_tag = soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else ""
        
        # Meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        description = meta_desc.get('content', '') if meta_desc else ""
        
        # H1
        h1_tag = soup.find('h1')
        h1 = h1_tag.get_text(strip=True) if h1_tag else ""
        
        # Canonical URL
        canonical_tag = soup.find('link', rel='canonical')
        canonical = canonical_tag.get('href', '') if canonical_tag else ""
        
        # Detecteer page type
        page_type = self.detect_page_type(url, soup)
        
        page = PageInfo(
            url=url,
            title=title,
            page_type=page_type,
            status_code=200,
            meta_description=description,
            h1=h1,
            canonical=canonical
        )
        
        # Genereer redirect suggestie
        page.suggested_redirect = self.suggest_redirect(page)
        
        return page
    
    def extract_links(self, soup: BeautifulSoup, current_url: str) -> Set[str]:
        """Extraheer alle links uit een pagina"""
        links = set()
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            
            # Maak absolute URL
            absolute_url = urljoin(current_url, href)
            normalized = self.normalize_url(absolute_url)
            
            if self.is_valid_url(normalized):
                links.add(normalized)
        
        return links
    
    def try_fetch_sitemap(self) -> list[str]:
        """Probeer de sitemap te vinden en URL's te extraheren"""
        sitemap_locations = [
            '/sitemap.xml',
            '/sitemap_index.xml',
            '/wp-sitemap.xml',
            '/sitemap/',
            '/sitemap.xml.gz',
        ]
        
        all_urls = []
        
        for location in sitemap_locations:
            sitemap_url = f"{self.base_url}{location}"
            print(f"  Checking sitemap: {sitemap_url}")
            
            try:
                response = self.session.get(sitemap_url, timeout=TIMEOUT)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'lxml')
                    
                    # Check voor sitemap index (bevat andere sitemaps)
                    sitemaps = soup.find_all('sitemap')
                    if sitemaps:
                        for sitemap in sitemaps:
                            loc = sitemap.find('loc')
                            if loc:
                                sub_urls = self._parse_sitemap(loc.get_text(strip=True))
                                all_urls.extend(sub_urls)
                    
                    # Check voor directe URL's
                    urls = soup.find_all('url')
                    for url_tag in urls:
                        loc = url_tag.find('loc')
                        if loc:
                            url = loc.get_text(strip=True)
                            if self.is_valid_url(url):
                                all_urls.append(url)
                    
                    if all_urls:
                        print(f"  [OK] Found {len(all_urls)} URLs in sitemap")
                        return all_urls
                        
            except requests.RequestException:
                continue
        
        print("  [X] No sitemap found, will crawl manually")
        return []
    
    def _parse_sitemap(self, sitemap_url: str) -> list[str]:
        """Parse een individuele sitemap en return URL's"""
        urls = []
        try:
            response = self.session.get(sitemap_url, timeout=TIMEOUT)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                for url_tag in soup.find_all('url'):
                    loc = url_tag.find('loc')
                    if loc:
                        url = loc.get_text(strip=True)
                        if self.is_valid_url(url):
                            urls.append(url)
        except requests.RequestException:
            pass
        return urls
    
    def crawl(self) -> CrawlResult:
        """Start de crawl van de website"""
        print(f"\n{'='*60}")
        print(f"WordPress URL Crawler - Migration Tool")
        print(f"{'='*60}")
        print(f"Target: {self.base_url}")
        print(f"Max pages: {self.max_pages}")
        print(f"Delay: {self.delay}s between requests")
        print(f"{'='*60}\n")
        
        # Stap 1: Probeer sitemap te vinden
        print("Step 1: Looking for sitemap...")
        sitemap_urls = self.try_fetch_sitemap()
        
        if sitemap_urls:
            # Gebruik sitemap URL's als startpunt
            for url in sitemap_urls:
                normalized = self.normalize_url(url)
                self.to_visit.add(normalized)
        else:
            # Start met homepage
            self.to_visit.add(self.base_url)
        
        # Stap 2: Crawl pagina's
        print("\nStep 2: Crawling pages...")
        page_count = 0
        
        while self.to_visit and page_count < self.max_pages:
            url = self.to_visit.pop()
            
            if url in self.visited:
                continue
            
            self.visited.add(url)
            page_count += 1
            
            print(f"  [{page_count}/{self.max_pages}] Crawling: {url[:80]}...")
            
            soup = self.fetch_page(url)
            if soup:
                # Extraheer pagina info
                page_info = self.extract_page_info(url, soup)
                self.pages.append(page_info)
                
                # Als we NIET van sitemap komen, zoek nieuwe links
                if not sitemap_urls:
                    new_links = self.extract_links(soup, url)
                    for link in new_links:
                        if link not in self.visited:
                            self.to_visit.add(link)
            
            # Respecteer rate limiting
            time.sleep(self.delay)
        
        print(f"\n[OK] Crawl complete! Found {len(self.pages)} pages")
        
        return CrawlResult(
            base_url=self.base_url,
            pages=self.pages,
            errors=self.errors,
            sitemap_urls=sitemap_urls
        )


def generate_redirect_config(pages: list[PageInfo], output_format: str = 'nextjs') -> str:
    """Genereer redirect configuratie voor Next.js of Vercel"""
    
    if output_format == 'nextjs':
        redirects = []
        for page in pages:
            if page.page_type != 'homepage':  # Skip homepage
                source = urlparse(page.url).path
                if source and page.suggested_redirect:
                    redirects.append({
                        'source': source,
                        'destination': page.suggested_redirect,
                        'permanent': True
                    })
        
        # Genereer TypeScript config
        config = """// Add this to your next.config.ts
async redirects() {
  return [
"""
        for r in redirects:
            config += f"    {{ source: '{r['source']}', destination: '{r['destination']}', permanent: true }},\n"
        config += """  ];
}"""
        return config
    
    elif output_format == 'vercel':
        redirects = []
        for page in pages:
            if page.page_type != 'homepage':
                source = urlparse(page.url).path
                if source and page.suggested_redirect:
                    redirects.append({
                        'source': source,
                        'destination': page.suggested_redirect,
                        'permanent': True
                    })
        
        return json.dumps({'redirects': redirects}, indent=2)
    
    return ""


def export_to_csv(pages: list[PageInfo], output_path: str):
    """Exporteer resultaten naar CSV"""
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Old URL',
            'Page Type',
            'Title',
            'H1',
            'Suggested Redirect',
            'Status',
            'Notes'
        ])
        
        for page in sorted(pages, key=lambda p: p.page_type):
            writer.writerow([
                page.url,
                page.page_type,
                page.title,
                page.h1,
                page.suggested_redirect,
                page.status_code,
                ''  # Notes column for manual review
            ])
    
    print(f"[OK] Exported to: {output_path}")


def export_to_json(pages: list[PageInfo], output_path: str):
    """Exporteer resultaten naar JSON"""
    data = {
        'total_pages': len(pages),
        'page_types': defaultdict(int),
        'pages': []
    }
    
    for page in pages:
        data['page_types'][page.page_type] += 1
        data['pages'].append({
            'old_url': page.url,
            'page_type': page.page_type,
            'title': page.title,
            'h1': page.h1,
            'meta_description': page.meta_description,
            'suggested_redirect': page.suggested_redirect,
            'canonical': page.canonical,
            'status_code': page.status_code
        })
    
    data['page_types'] = dict(data['page_types'])
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Exported to: {output_path}")


def print_summary(result: CrawlResult):
    """Print een samenvatting van de crawl"""
    print(f"\n{'='*60}")
    print("CRAWL SUMMARY")
    print(f"{'='*60}")
    
    # Tel page types
    type_counts = defaultdict(int)
    for page in result.pages:
        type_counts[page.page_type] += 1
    
    print(f"\nTotal pages found: {len(result.pages)}")
    print(f"Errors encountered: {len(result.errors)}")
    
    print("\nPages by type:")
    for ptype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {ptype}: {count}")
    
    if result.errors:
        print("\nErrors:")
        for error in result.errors[:10]:  # Show first 10 errors
            print(f"  {error['url']}: {error['error']}")
        if len(result.errors) > 10:
            print(f"  ... and {len(result.errors) - 10} more errors")


def main():
    parser = argparse.ArgumentParser(
        description='Crawl a WordPress site to create redirect mappings for migration'
    )
    parser.add_argument(
        '--url', '-u',
        default='https://psmphuket.com',
        help='Base URL of the WordPress site to crawl (default: https://psmphuket.com)'
    )
    parser.add_argument(
        '--output', '-o',
        default='output/redirect_mapping',
        help='Output file path (without extension)'
    )
    parser.add_argument(
        '--max-pages', '-m',
        type=int,
        default=MAX_PAGES,
        help=f'Maximum number of pages to crawl (default: {MAX_PAGES})'
    )
    parser.add_argument(
        '--delay', '-d',
        type=float,
        default=DEFAULT_DELAY,
        help=f'Delay between requests in seconds (default: {DEFAULT_DELAY})'
    )
    
    args = parser.parse_args()
    
    # Zorg dat output directory bestaat
    import os
    output_dir = os.path.dirname(args.output)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Start de crawler
    crawler = WordPressCrawler(
        base_url=args.url,
        delay=args.delay,
        max_pages=args.max_pages
    )
    
    result = crawler.crawl()
    
    # Print samenvatting
    print_summary(result)
    
    # Exporteer resultaten
    print(f"\n{'='*60}")
    print("EXPORTING RESULTS")
    print(f"{'='*60}")
    
    export_to_csv(result.pages, f"{args.output}.csv")
    export_to_json(result.pages, f"{args.output}.json")
    
    # Genereer redirect config
    nextjs_config = generate_redirect_config(result.pages, 'nextjs')
    with open(f"{args.output}_nextjs_redirects.ts", 'w', encoding='utf-8') as f:
        f.write(nextjs_config)
    print(f"[OK] Next.js config: {args.output}_nextjs_redirects.ts")
    
    vercel_config = generate_redirect_config(result.pages, 'vercel')
    with open(f"{args.output}_vercel_redirects.json", 'w', encoding='utf-8') as f:
        f.write(vercel_config)
    print(f"[OK] Vercel config: {args.output}_vercel_redirects.json")
    
    print(f"\n{'='*60}")
    print("NEXT STEPS")
    print(f"{'='*60}")
    print("""
1. Review the CSV file and adjust redirect mappings manually where needed
2. Copy the Next.js redirects to your next.config.ts
3. Or copy the Vercel redirects to your vercel.json
4. Test the redirects locally before deploying
5. Update DNS to point psmphuket.com to your new site
""")


if __name__ == '__main__':
    main()

