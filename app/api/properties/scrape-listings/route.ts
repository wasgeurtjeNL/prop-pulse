import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface ListingItem {
  url: string;
  title: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  image: string;
  type: "FOR_RENT" | "FOR_SALE";
}

interface ScrapeListingsResult {
  success: boolean;
  properties: ListingItem[];
  totalFound: number;
  pagesScraped: number;
  nextPageUrl: string | null;
  error?: string;
}

// Retry fetch with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(30000),
      });
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("Max retries exceeded");
}

// Extract property listings from a page
function extractListings($: cheerio.CheerioAPI, baseUrl: string, isRental: boolean): ListingItem[] {
  const listings: ListingItem[] = [];
  
  // PSM Phuket / Flavor theme specific: articles with property cards
  $("article").each((_, element) => {
    const $el = $(element);
    
    // Try to find property URL (look for /property/ links)
    let url = "";
    const linkEl = $el.find("a[href*='/property/']").first();
    if (linkEl.length) {
      url = linkEl.attr("href") || "";
    }
    
    // Make URL absolute
    if (url && !url.startsWith("http")) {
      const urlObj = new URL(baseUrl);
      url = url.startsWith("/") ? `${urlObj.origin}${url}` : `${urlObj.origin}/${url}`;
    }
    
    // Skip if no valid URL or if it's a pagination/filter link
    if (!url || url.includes("page=") || url.includes("?status=") || url.includes("#")) {
      return;
    }
    
    // Extract title from h2/h3 inside the article
    let title = "";
    const titleEl = $el.find("h2 a, h3 a").first();
    if (titleEl.length) {
      title = titleEl.text().trim();
    } else {
      const headingEl = $el.find("h2, h3, h4").first();
      title = headingEl.text().trim();
    }
    
    // Extract price - look for price paragraph (contains ฿ or Monthly/Year)
    let price = "";
    $el.find("p").each((_, pEl) => {
      const pText = $(pEl).text().trim();
      if (pText.includes("฿") || pText.includes("Monthly") || pText.includes("Month") || pText.includes("/mo")) {
        price = pText.replace(/\s+/g, " ");
      }
    });
    
    // Extract beds - look for "Bedrooms" label followed by number
    let beds = 0;
    const fullText = $el.text();
    const bedsMatch = fullText.match(/Bedrooms?\s*(\d+)/i);
    if (bedsMatch) {
      beds = parseInt(bedsMatch[1]);
    } else {
      // Try pattern like "1" after Bedrooms label
      const altBedsMatch = fullText.match(/Bedroom[s]?\s*[\n\r\s]*(\d+)/i);
      if (altBedsMatch) beds = parseInt(altBedsMatch[1]);
    }
    
    // Extract baths
    let baths = 0;
    const bathsMatch = fullText.match(/Bathroom[s]?\s*[\n\r\s]*(\d+)/i);
    if (bathsMatch) baths = parseInt(bathsMatch[1]);
    
    // Extract size (sq m, sqm, sq ft, m²)
    let sqft = "";
    const sqftMatch = fullText.match(/(\d+[\d,]*)\s*(?:sq\s*m|sqm|sq\s*ft|sqft|Sq\s*m|m²)/i);
    if (sqftMatch) sqft = sqftMatch[1].replace(",", "");
    
    // Also check for just number after "Area"
    if (!sqft) {
      const areaMatch = fullText.match(/Area\s*[\n\r\s]*(\d+)/i);
      if (areaMatch) sqft = areaMatch[1];
    }
    
    // Extract image
    let image = "";
    const imgEl = $el.find("figure img, img").first();
    image = imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
    if (image && !image.startsWith("http")) {
      const urlObj = new URL(baseUrl);
      image = image.startsWith("/") ? `${urlObj.origin}${image}` : `${urlObj.origin}/${image}`;
    }
    
    // Only add if we have at least URL and title
    if (url && title) {
      listings.push({
        url,
        title,
        price,
        beds,
        baths,
        sqft,
        image,
        type: isRental ? "FOR_RENT" : "FOR_SALE",
      });
    }
  });
  
  // If no articles found, try other common selectors
  if (listings.length === 0) {
    const fallbackSelectors = [
      ".property-item",
      ".property-card", 
      ".listing-item",
      ".rh_prop_card",
      ".ere-property",
    ];
    
    for (const selector of fallbackSelectors) {
      $(selector).each((_, element) => {
        const $el = $(element);
        
        let url = "";
        const linkEl = $el.find("a[href*='/property/']").first();
        if (linkEl.length) {
          url = linkEl.attr("href") || "";
        } else {
          const anyLink = $el.find("a").first();
          url = anyLink.attr("href") || "";
        }
        
        if (url && !url.startsWith("http")) {
          const urlObj = new URL(baseUrl);
          url = url.startsWith("/") ? `${urlObj.origin}${url}` : `${urlObj.origin}/${url}`;
        }
        
        if (!url || url.includes("page=") || url.includes("?status=") || url.includes("#")) {
          return;
        }
        
        let title = "";
        const titleEl = $el.find("h2, h3, h4").first();
        title = titleEl.text().trim();
        
        let price = "";
        const priceEl = $el.find(".price, [class*='price']").first();
        price = priceEl.text().trim().replace(/\s+/g, " ");
        
        let beds = 0;
        const bedsText = $el.text();
        const bedsMatch = bedsText.match(/(\d+)\s*(?:bed|bedroom|Bedroom)/i);
        if (bedsMatch) beds = parseInt(bedsMatch[1]);
        
        let baths = 0;
        const bathsMatch = bedsText.match(/(\d+)\s*(?:bath|bathroom|Bathroom)/i);
        if (bathsMatch) baths = parseInt(bathsMatch[1]);
        
        let sqft = "";
        const sqftMatch = bedsText.match(/(\d+[\d,]*)\s*(?:sq\s*m|sqm|sq\s*ft|sqft|m²)/i);
        if (sqftMatch) sqft = sqftMatch[1].replace(",", "");
        
        let image = "";
        const imgEl = $el.find("img").first();
        image = imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
        if (image && !image.startsWith("http")) {
          const urlObj = new URL(baseUrl);
          image = image.startsWith("/") ? `${urlObj.origin}${image}` : `${urlObj.origin}/${image}`;
        }
        
        if (url && title) {
          listings.push({
            url,
            title,
            price,
            beds,
            baths,
            sqft,
            image,
            type: isRental ? "FOR_RENT" : "FOR_SALE",
          });
        }
      });
      
      if (listings.length > 0) break;
    }
  }
  
  return listings;
}

// Find next page URL
function findNextPageUrl($: cheerio.CheerioAPI, currentUrl: string): string | null {
  // Look for pagination links
  const nextSelectors = [
    "a.next",
    "a[rel='next']",
    ".pagination a:contains('Next')",
    ".pagination a:contains('»')",
    ".pagination .current + a",
    "a[class*='next']",
  ];
  
  for (const selector of nextSelectors) {
    const nextEl = $(selector).first();
    if (nextEl.length) {
      let nextUrl = nextEl.attr("href");
      if (nextUrl) {
        if (!nextUrl.startsWith("http")) {
          const urlObj = new URL(currentUrl);
          nextUrl = nextUrl.startsWith("/") ? `${urlObj.origin}${nextUrl}` : `${urlObj.origin}/${nextUrl}`;
        }
        return nextUrl;
      }
    }
  }
  
  // Try to find numbered pagination and get next page
  const currentPageMatch = currentUrl.match(/page\/(\d+)/);
  if (currentPageMatch) {
    const currentPage = parseInt(currentPageMatch[1]);
    const nextPage = currentPage + 1;
    const nextPageLink = $(`a[href*="page/${nextPage}"]`).first();
    if (nextPageLink.length) {
      let nextUrl = nextPageLink.attr("href");
      if (nextUrl && !nextUrl.startsWith("http")) {
        const urlObj = new URL(currentUrl);
        nextUrl = nextUrl.startsWith("/") ? `${urlObj.origin}${nextUrl}` : `${urlObj.origin}/${nextUrl}`;
      }
      return nextUrl || null;
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, pages = 1, type = "FOR_RENT" } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }
    
    const isRental = type === "FOR_RENT";
    const allListings: ListingItem[] = [];
    let currentUrl = url;
    let pagesScraped = 0;
    let nextPageUrl: string | null = null;
    
    console.log(`🔍 Scraping listings from: ${url}`);
    console.log(`📄 Pages to scrape: ${pages}`);
    console.log(`🏠 Type: ${type}`);
    
    for (let page = 0; page < pages; page++) {
      if (!currentUrl) break;
      
      console.log(`📄 Scraping page ${page + 1}: ${currentUrl}`);
      
      try {
        const response = await fetchWithRetry(currentUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch page ${page + 1}: ${response.status}`);
          break;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract listings from this page
        const pageListings = extractListings($, currentUrl, isRental);
        console.log(`   Found ${pageListings.length} listings on page ${page + 1}`);
        
        // Add to total (avoid duplicates by URL)
        const existingUrls = new Set(allListings.map(l => l.url));
        for (const listing of pageListings) {
          if (!existingUrls.has(listing.url)) {
            allListings.push(listing);
            existingUrls.add(listing.url);
          }
        }
        
        pagesScraped++;
        
        // Find next page URL for continuation
        nextPageUrl = findNextPageUrl($, currentUrl);
        currentUrl = nextPageUrl || "";
        
        // Small delay between pages
        if (page < pages - 1 && currentUrl) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error scraping page ${page + 1}:`, error);
        break;
      }
    }
    
    console.log(`✅ Total listings found: ${allListings.length}`);
    console.log(`📄 Pages scraped: ${pagesScraped}`);
    
    const result: ScrapeListingsResult = {
      success: true,
      properties: allListings,
      totalFound: allListings.length,
      pagesScraped,
      nextPageUrl,
    };
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error("Scrape listings error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to scrape listings",
        properties: [],
        totalFound: 0,
        pagesScraped: 0,
        nextPageUrl: null,
      },
      { status: 500 }
    );
  }
}

