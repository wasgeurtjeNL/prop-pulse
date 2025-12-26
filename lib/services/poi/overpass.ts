/**
 * Overpass API Client - Fetch POIs from OpenStreetMap
 * 
 * Uses the Overpass API to query OpenStreetMap for Points of Interest
 * https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import { PoiCategory, NoiseLevel, TrafficLevel } from '@/lib/generated/prisma';
import { OverpassElement, ProcessedPoi, PoiCategoryConfig, PHUKET_BBOX } from './types';

// Overpass API endpoints (use multiple for redundancy)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Rate limiting: be nice to public Overpass servers
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

/**
 * POI Category Configuration
 * Maps our categories to OSM tags and UI settings
 */
export const POI_CATEGORY_CONFIG: PoiCategoryConfig[] = [
  // 🏖️ Leisure
  {
    category: 'BEACH',
    label: 'Beaches',
    labelTh: 'ชายหาด',
    icon: 'ph:waves',
    color: '#06b6d4',
    osmQueries: ['natural=beach'],
    importance: 10,
    highlightRadius: 1000,
  },
  {
    category: 'PARK',
    label: 'Parks',
    labelTh: 'สวนสาธารณะ',
    icon: 'ph:tree',
    color: '#22c55e',
    osmQueries: ['leisure=park', 'leisure=garden'],
    importance: 7,
    highlightRadius: 1000,
  },
  {
    category: 'VIEWPOINT',
    label: 'Viewpoints',
    labelTh: 'จุดชมวิว',
    icon: 'ph:binoculars',
    color: '#8b5cf6',
    osmQueries: ['tourism=viewpoint'],
    importance: 8,
    highlightRadius: 2000,
  },
  {
    category: 'GOLF_COURSE',
    label: 'Golf Courses',
    icon: 'ph:golf',
    color: '#16a34a',
    osmQueries: ['leisure=golf_course'],
    importance: 6,
    highlightRadius: 5000,
  },
  {
    category: 'MARINA',
    label: 'Marinas',
    icon: 'ph:anchor',
    color: '#0284c7',
    osmQueries: ['leisure=marina'],
    importance: 7,
    highlightRadius: 3000,
  },
  {
    category: 'TEMPLE',
    label: 'Temples',
    labelTh: 'วัด',
    icon: 'ph:building-office',
    color: '#f59e0b',
    osmQueries: ['amenity=place_of_worship']['religion=buddhist'],
    importance: 6,
    highlightRadius: 1500,
  },

  // 🏫 Family & Education
  {
    category: 'INTERNATIONAL_SCHOOL',
    label: 'International Schools',
    labelTh: 'โรงเรียนนานาชาติ',
    icon: 'ph:graduation-cap',
    color: '#3b82f6',
    osmQueries: ['amenity=school'],
    importance: 10,
    highlightRadius: 3000,
  },
  {
    category: 'LOCAL_SCHOOL',
    label: 'Schools',
    labelTh: 'โรงเรียน',
    icon: 'ph:student',
    color: '#60a5fa',
    osmQueries: ['amenity=school'],
    importance: 6,
    highlightRadius: 2000,
  },
  {
    category: 'KINDERGARTEN',
    label: 'Kindergartens',
    labelTh: 'โรงเรียนอนุบาล',
    icon: 'ph:baby',
    color: '#f472b6',
    osmQueries: ['amenity=kindergarten'],
    importance: 8,
    highlightRadius: 2000,
  },
  {
    category: 'UNIVERSITY',
    label: 'Universities',
    labelTh: 'มหาวิทยาลัย',
    icon: 'ph:book-open',
    color: '#1d4ed8',
    osmQueries: ['amenity=university', 'amenity=college'],
    importance: 7,
    highlightRadius: 5000,
  },

  // 🏥 Healthcare
  {
    category: 'HOSPITAL',
    label: 'Hospitals',
    labelTh: 'โรงพยาบาล',
    icon: 'ph:first-aid-kit',
    color: '#ef4444',
    osmQueries: ['amenity=hospital'],
    importance: 10,
    highlightRadius: 5000,
  },
  {
    category: 'CLINIC',
    label: 'Clinics',
    labelTh: 'คลินิก',
    icon: 'ph:stethoscope',
    color: '#f87171',
    osmQueries: ['amenity=clinic', 'amenity=doctors'],
    importance: 7,
    highlightRadius: 2000,
  },
  {
    category: 'PHARMACY',
    label: 'Pharmacies',
    labelTh: 'ร้านขายยา',
    icon: 'ph:pill',
    color: '#004aac',
    osmQueries: ['amenity=pharmacy'],
    importance: 6,
    highlightRadius: 1500,
  },
  {
    category: 'DENTIST',
    label: 'Dentists',
    labelTh: 'ทันตแพทย์',
    icon: 'ph:tooth',
    color: '#0066cc',
    osmQueries: ['amenity=dentist'],
    importance: 5,
    highlightRadius: 2000,
  },

  // 🏙️ Daily Life - Shopping
  {
    category: 'SHOPPING_MALL',
    label: 'Shopping Malls',
    labelTh: 'ห้างสรรพสินค้า',
    icon: 'ph:storefront',
    color: '#ec4899',
    osmQueries: ['shop=mall', 'shop=department_store'],
    importance: 9,
    highlightRadius: 5000,
  },
  {
    category: 'SUPERMARKET',
    label: 'Supermarkets',
    labelTh: 'ซูเปอร์มาร์เก็ต',
    icon: 'ph:shopping-cart',
    color: '#f97316',
    osmQueries: ['shop=supermarket'],
    importance: 8,
    highlightRadius: 2000,
  },
  {
    category: 'CONVENIENCE_STORE',
    label: 'Convenience Stores',
    labelTh: 'ร้านสะดวกซื้อ',
    icon: 'ph:bag-simple',
    color: '#fb923c',
    osmQueries: ['shop=convenience'],
    importance: 6,
    highlightRadius: 1000,
  },
  {
    category: 'MARKET',
    label: 'Markets',
    labelTh: 'ตลาด',
    icon: 'ph:basket',
    color: '#84cc16',
    osmQueries: ['amenity=marketplace', 'shop=market'],
    importance: 7,
    highlightRadius: 2000,
  },

  // 🏙️ Daily Life - Services
  {
    category: 'GYM',
    label: 'Gyms & Fitness',
    labelTh: 'ฟิตเนส',
    icon: 'ph:barbell',
    color: '#a855f7',
    osmQueries: ['leisure=fitness_centre', 'leisure=sports_centre'],
    importance: 6,
    highlightRadius: 2000,
  },
  {
    category: 'COWORKING',
    label: 'Coworking Spaces',
    icon: 'ph:laptop',
    color: '#6366f1',
    osmQueries: ['amenity=coworking_space', 'office=coworking'],
    importance: 7,
    highlightRadius: 3000,
  },
  {
    category: 'BANK',
    label: 'Banks',
    labelTh: 'ธนาคาร',
    icon: 'ph:bank',
    color: '#0f766e',
    osmQueries: ['amenity=bank'],
    importance: 6,
    highlightRadius: 1500,
  },
  {
    category: 'ATM',
    label: 'ATMs',
    icon: 'ph:credit-card',
    color: '#0d9488',
    osmQueries: ['amenity=atm'],
    importance: 4,
    highlightRadius: 1000,
  },

  // 🍽️ Food & Drink (for reference/noise analysis)
  {
    category: 'RESTAURANT',
    label: 'Restaurants',
    labelTh: 'ร้านอาหาร',
    icon: 'ph:fork-knife',
    color: '#ea580c',
    osmQueries: ['amenity=restaurant'],
    importance: 5,
    highlightRadius: 1000,
  },
  {
    category: 'CAFE',
    label: 'Cafés',
    labelTh: 'คาเฟ่',
    icon: 'ph:coffee',
    color: '#92400e',
    osmQueries: ['amenity=cafe'],
    importance: 5,
    highlightRadius: 1000,
  },
  {
    category: 'NIGHTCLUB',
    label: 'Nightclubs & Bars',
    labelTh: 'ไนต์คลับ',
    icon: 'ph:martini',
    color: '#7c3aed',
    osmQueries: ['amenity=nightclub', 'amenity=bar', 'amenity=pub'],
    importance: 4,
    highlightRadius: 500,
  },

  // 🚦 Transport & Infrastructure
  {
    category: 'AIRPORT',
    label: 'Airport',
    labelTh: 'สนามบิน',
    icon: 'ph:airplane-takeoff',
    color: '#0ea5e9',
    osmQueries: ['aeroway=aerodrome'],
    importance: 10,
    highlightRadius: 10000,
  },
  {
    category: 'BUS_STATION',
    label: 'Bus Stations',
    labelTh: 'สถานีรถบัส',
    icon: 'ph:bus',
    color: '#64748b',
    osmQueries: ['amenity=bus_station', 'highway=bus_stop'],
    importance: 5,
    highlightRadius: 1500,
  },
  {
    category: 'FERRY_TERMINAL',
    label: 'Ferry Terminals',
    labelTh: 'ท่าเรือ',
    icon: 'ph:boat',
    color: '#0891b2',
    osmQueries: ['amenity=ferry_terminal'],
    importance: 7,
    highlightRadius: 5000,
  },
];

/**
 * Get category config by category enum
 */
export function getCategoryConfig(category: PoiCategory): PoiCategoryConfig | undefined {
  return POI_CATEGORY_CONFIG.find(c => c.category === category);
}

/**
 * Wait for rate limit
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
}

/**
 * Build Overpass QL query for a category
 */
function buildOverpassQuery(
  config: PoiCategoryConfig,
  bbox: { south: number; west: number; north: number; east: number }
): string {
  const { south, west, north, east } = bbox;
  
  // Build union of all OSM queries for this category
  const queryParts = config.osmQueries.map(osmQuery => {
    // Handle tag=value format
    const [key, value] = osmQuery.split('=');
    return `
      node["${key}"="${value}"](${south},${west},${north},${east});
      way["${key}"="${value}"](${south},${west},${north},${east});
    `;
  }).join('');
  
  return `
    [out:json][timeout:60];
    (
      ${queryParts}
    );
    out center;
  `;
}

/**
 * Execute Overpass query with retry logic
 */
async function executeOverpassQuery(query: string): Promise<OverpassElement[]> {
  await waitForRateLimit();
  
  let lastError: Error | null = null;
  
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      
      if (!response.ok) {
        throw new Error(`Overpass error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      lastError = error as Error;
      console.warn(`Overpass endpoint ${endpoint} failed:`, error);
      continue;
    }
  }
  
  throw lastError || new Error('All Overpass endpoints failed');
}

/**
 * Check if a school is an international school
 */
function isInternationalSchool(tags: Record<string, string>): boolean {
  const name = (tags.name || '').toLowerCase();
  const nameEn = (tags['name:en'] || '').toLowerCase();
  const operator = (tags.operator || '').toLowerCase();
  
  const internationalKeywords = [
    'international',
    'british',
    'american',
    'french',
    'german',
    'swiss',
    'australian',
    'canadian',
    'singapore',
    'headstart',
    'oak meadow',
    'qsi',
    'uwc',
  ];
  
  const allText = `${name} ${nameEn} ${operator}`;
  return internationalKeywords.some(keyword => allText.includes(keyword));
}

/**
 * Process raw Overpass element into our POI format
 */
function processElement(
  element: OverpassElement,
  category: PoiCategory,
  config: PoiCategoryConfig
): ProcessedPoi | null {
  // Get coordinates
  let lat: number;
  let lon: number;
  
  if (element.lat !== undefined && element.lon !== undefined) {
    lat = element.lat;
    lon = element.lon;
  } else if (element.center) {
    lat = element.center.lat;
    lon = element.center.lon;
  } else {
    return null; // No valid coordinates
  }
  
  const tags = element.tags || {};
  
  // Get name
  const name = tags.name || tags['name:en'] || tags['name:th'] || 'Unknown';
  
  // Skip unnamed POIs for most categories
  if (name === 'Unknown' && !['ATM', 'BUS_STATION'].includes(category)) {
    return null;
  }
  
  // Handle school sub-categorization
  let finalCategory = category;
  let subCategory: string | undefined;
  
  if (category === 'INTERNATIONAL_SCHOOL' || category === 'LOCAL_SCHOOL') {
    if (isInternationalSchool(tags)) {
      finalCategory = 'INTERNATIONAL_SCHOOL';
      subCategory = 'international';
    } else {
      finalCategory = 'LOCAL_SCHOOL';
      subCategory = tags['isced:level'] || 'general';
    }
  }
  
  // Determine noise level for certain categories
  let noiseLevel: NoiseLevel | undefined;
  if (category === 'NIGHTCLUB') {
    noiseLevel = 'LOUD';
  } else if (category === 'BAR' || category === 'RESTAURANT') {
    noiseLevel = 'MODERATE';
  }
  
  return {
    externalId: `osm-${element.type}-${element.id}`,
    source: 'OSM',
    name,
    nameTh: tags['name:th'],
    nameLocal: tags['name:th'] || tags['alt_name'],
    category: finalCategory,
    subCategory,
    latitude: lat,
    longitude: lon,
    address: tags['addr:full'] || formatAddress(tags),
    district: tags['addr:suburb'] || tags['addr:district'],
    osmTags: tags,
    importance: config.importance,
    noiseLevel,
  };
}

/**
 * Format address from OSM tags
 */
function formatAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * Fetch POIs for a specific category
 */
export async function fetchPoisForCategory(
  category: PoiCategory,
  bbox: { south: number; west: number; north: number; east: number } = PHUKET_BBOX
): Promise<ProcessedPoi[]> {
  const config = getCategoryConfig(category);
  
  if (!config) {
    console.warn(`No config found for category: ${category}`);
    return [];
  }
  
  try {
    const query = buildOverpassQuery(config, bbox);
    const elements = await executeOverpassQuery(query);
    
    const pois: ProcessedPoi[] = [];
    
    for (const element of elements) {
      const poi = processElement(element, category, config);
      if (poi) {
        pois.push(poi);
      }
    }
    
    console.log(`Fetched ${pois.length} POIs for category ${category}`);
    return pois;
  } catch (error) {
    console.error(`Error fetching POIs for ${category}:`, error);
    throw error;
  }
}

/**
 * Fetch all POIs for the Phuket region
 */
export async function fetchAllPois(
  categories?: PoiCategory[],
  bbox: { south: number; west: number; north: number; east: number } = PHUKET_BBOX
): Promise<ProcessedPoi[]> {
  const categoriesToFetch = categories || POI_CATEGORY_CONFIG.map(c => c.category);
  const allPois: ProcessedPoi[] = [];
  
  for (const category of categoriesToFetch) {
    try {
      const pois = await fetchPoisForCategory(category, bbox);
      allPois.push(...pois);
    } catch (error) {
      console.error(`Failed to fetch category ${category}, continuing...`);
    }
  }
  
  return allPois;
}

/**
 * Fetch specific high-importance POIs
 * (Beaches, International Schools, Hospitals, Shopping Malls, Airport)
 */
export async function fetchHighPriorityPois(
  bbox: { south: number; west: number; north: number; east: number } = PHUKET_BBOX
): Promise<ProcessedPoi[]> {
  const highPriorityCategories: PoiCategory[] = [
    'BEACH',
    'INTERNATIONAL_SCHOOL',
    'HOSPITAL',
    'SHOPPING_MALL',
    'AIRPORT',
    'SUPERMARKET',
  ];
  
  return fetchAllPois(highPriorityCategories, bbox);
}

