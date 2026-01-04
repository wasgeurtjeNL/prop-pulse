/**
 * Property URL utilities
 * These are synchronous utility functions for generating property URLs
 */

/**
 * Generate the full property URL path
 */
export function getPropertyUrl(property: { provinceSlug?: string | null; areaSlug?: string | null; slug: string }): string {
  if (property.provinceSlug && property.areaSlug) {
    return `/properties/${property.provinceSlug}/${property.areaSlug}/${property.slug}`;
  }
  // Fallback for properties without location slugs
  return `/properties/phuket/other/${property.slug}`;
}

/**
 * Parse location string to extract province and area slugs
 */
export function parseLocationToSlugs(location: string): { provinceSlug: string; areaSlug: string } {
  const lowerLocation = location.toLowerCase();
  
  // Default province
  let provinceSlug = 'phuket';
  let areaSlug = 'other';
  
  // Area detection
  const areaPatterns: [RegExp, string][] = [
    [/rawai/i, 'rawai'],
    [/kata(?!hu)/i, 'kata'],
    [/karon/i, 'karon'],
    [/patong/i, 'patong'],
    [/kamala/i, 'kamala'],
    [/surin/i, 'surin'],
    [/bang.?tao/i, 'bang-tao'],
    [/laguna/i, 'laguna'],
    [/layan/i, 'layan'],
    [/nai.?harn/i, 'nai-harn'],
    [/nai.?yang/i, 'nai-yang'],
    [/mai.?khao/i, 'mai-khao'],
    [/chalong/i, 'chalong'],
    [/kathu/i, 'kathu'],
    [/phuket.?town|phuket.?city/i, 'phuket-town'],
    [/thalang|talang/i, 'thalang'],
    [/cherng.?talay/i, 'cherngtalay'],
    [/ao.?po/i, 'ao-po'],
    [/cape.?panwa|panwa/i, 'cape-panwa'],
    [/cape.?yamu|yamu/i, 'cape-yamu'],
    [/mueang/i, 'mueang'],
    [/wichit/i, 'wichit'],
  ];
  
  for (const [pattern, slug] of areaPatterns) {
    if (pattern.test(lowerLocation)) {
      areaSlug = slug;
      break;
    }
  }
  
  return { provinceSlug, areaSlug };
}

/**
 * Determine area from GPS coordinates using geofencing
 * Used as fallback when text-based detection fails
 */
export function getAreaFromCoordinates(lat: number, lng: number): string {
  // Approximate boundaries for Phuket areas (lat/lng ranges)
  const areaBounds = [
    // Southern Phuket
    { area: 'rawai', south: 7.76, north: 7.81, west: 98.31, east: 98.37 },
    { area: 'nai-harn', south: 7.76, north: 7.79, west: 98.28, east: 98.32 },
    { area: 'chalong', south: 7.81, north: 7.87, west: 98.32, east: 98.39 },
    { area: 'kata', south: 7.80, north: 7.84, west: 98.28, east: 98.32 },
    { area: 'karon', south: 7.83, north: 7.88, west: 98.27, east: 98.31 },
    // Central West Coast
    { area: 'patong', south: 7.87, north: 7.93, west: 98.27, east: 98.32 },
    { area: 'kamala', south: 7.93, north: 7.98, west: 98.27, east: 98.31 },
    { area: 'surin', south: 7.97, north: 8.01, west: 98.27, east: 98.30 },
    { area: 'bang-tao', south: 7.99, north: 8.04, west: 98.28, east: 98.32 },
    { area: 'laguna', south: 8.00, north: 8.04, west: 98.29, east: 98.33 },
    { area: 'layan', south: 8.03, north: 8.08, west: 98.27, east: 98.31 },
    // Northern Phuket
    { area: 'nai-yang', south: 8.07, north: 8.12, west: 98.29, east: 98.33 },
    { area: 'mai-khao', south: 8.11, north: 8.19, west: 98.29, east: 98.34 },
    // Central/East
    { area: 'kathu', south: 7.88, north: 7.95, west: 98.31, east: 98.37 },
    { area: 'cherngtalay', south: 8.00, north: 8.06, west: 98.30, east: 98.36 },
    { area: 'thalang', south: 8.00, north: 8.12, west: 98.33, east: 98.42 },
    { area: 'phuket-town', south: 7.85, north: 7.92, west: 98.37, east: 98.42 },
    { area: 'wichit', south: 7.84, north: 7.89, west: 98.35, east: 98.40 },
    { area: 'mueang', south: 7.85, north: 7.92, west: 98.36, east: 98.41 },
    // Eastern Phuket
    { area: 'cape-panwa', south: 7.78, north: 7.84, west: 98.39, east: 98.43 },
    { area: 'ao-po', south: 8.04, north: 8.12, west: 98.40, east: 98.46 },
    { area: 'cape-yamu', south: 7.97, north: 8.04, west: 98.40, east: 98.44 },
  ];
  
  for (const bounds of areaBounds) {
    if (lat >= bounds.south && lat <= bounds.north && 
        lng >= bounds.west && lng <= bounds.east) {
      return bounds.area;
    }
  }
  
  return 'other';
}