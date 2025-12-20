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

