/**
 * Geocoding Service - Convert addresses to coordinates
 * 
 * Uses OpenStreetMap Nominatim API (free, rate-limited)
 * Fallback to coordinates extraction from Google Maps URLs
 */

import { GeocodingResult, PHUKET_DISTRICTS, PhuketDistrict } from './types';

// Rate limiting: Nominatim allows 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

/**
 * Wait for rate limit if needed
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
 * Geocode an address using OpenStreetMap Nominatim
 * 
 * @param address - The address to geocode
 * @param country - Optional country context (default: Thailand)
 * @returns Coordinates and metadata, or null if not found
 */
export async function geocodeAddress(
  address: string,
  country: string = 'Thailand'
): Promise<GeocodingResult | null> {
  try {
    await waitForRateLimit();
    
    // Normalize address - add country if not present
    const normalizedAddress = address.toLowerCase().includes('thailand') 
      ? address 
      : `${address}, ${country}`;
    
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', normalizedAddress);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'PropPulse/1.0 (contact@proppulse.com)',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Nominatim error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`No geocoding results for: ${address}`);
      return null;
    }
    
    const result = data[0];
    const addressDetails = result.address || {};
    
    // Try to extract district from various address fields
    const district = extractDistrict(address, addressDetails);
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      district,
      confidence: result.importance || 0.5,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Extract district name from address or Nominatim response
 */
function extractDistrict(
  originalAddress: string,
  addressDetails: Record<string, string>
): string | undefined {
  // First, check if any known district is in the original address
  const addressLower = originalAddress.toLowerCase();
  
  for (const district of PHUKET_DISTRICTS) {
    if (addressLower.includes(district.toLowerCase())) {
      return district;
    }
  }
  
  // Check Nominatim address details
  const possibleFields = [
    'suburb',
    'neighbourhood',
    'village',
    'town',
    'city_district',
    'district',
  ];
  
  for (const field of possibleFields) {
    const value = addressDetails[field];
    if (value) {
      // Check if it matches a known district
      for (const district of PHUKET_DISTRICTS) {
        if (value.toLowerCase().includes(district.toLowerCase())) {
          return district;
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Extract coordinates from a Google Maps URL
 * 
 * Supports formats:
 * - https://www.google.com/maps?q=7.8,-98.3
 * - https://www.google.com/maps/@7.8,98.3,15z
 * - https://maps.google.com/maps?ll=7.8,-98.3
 * - https://goo.gl/maps/... (won't work - would need to follow redirect)
 */
export function extractCoordsFromMapUrl(url: string): GeocodingResult | null {
  try {
    // Pattern 1: ?q=lat,lng or ?ll=lat,lng
    const queryMatch = url.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (queryMatch) {
      return {
        latitude: parseFloat(queryMatch[1]),
        longitude: parseFloat(queryMatch[2]),
      };
    }
    
    // Pattern 2: /@lat,lng,zoom
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2]),
      };
    }
    
    // Pattern 3: /place/.../@lat,lng
    const placeMatch = url.match(/place\/[^@]+@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) {
      return {
        latitude: parseFloat(placeMatch[1]),
        longitude: parseFloat(placeMatch[2]),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting coords from URL:', error);
    return null;
  }
}

/**
 * Geocode a property location
 * 
 * Tries multiple strategies:
 * 1. Extract from mapUrl if present
 * 2. Geocode the location string
 * 
 * @param location - Location string (e.g., "Rawai, Phuket")
 * @param mapUrl - Optional Google Maps URL
 */
export async function geocodePropertyLocation(
  location: string,
  mapUrl?: string | null
): Promise<GeocodingResult | null> {
  // Strategy 1: Try to extract from map URL
  if (mapUrl) {
    const urlCoords = extractCoordsFromMapUrl(mapUrl);
    if (urlCoords) {
      // We have coords, now try to get district from location string
      const district = extractDistrictFromLocation(location);
      return {
        ...urlCoords,
        district,
      };
    }
  }
  
  // Strategy 2: Geocode the location string
  const geocoded = await geocodeAddress(location);
  if (geocoded) {
    return geocoded;
  }
  
  // Strategy 3: Try with "Phuket" appended if not already present
  if (!location.toLowerCase().includes('phuket')) {
    const withPhuket = await geocodeAddress(`${location}, Phuket`);
    if (withPhuket) {
      return withPhuket;
    }
  }
  
  return null;
}

/**
 * Extract district from a location string
 */
function extractDistrictFromLocation(location: string): string | undefined {
  const locationLower = location.toLowerCase();
  
  for (const district of PHUKET_DISTRICTS) {
    if (locationLower.includes(district.toLowerCase())) {
      return district;
    }
  }
  
  return undefined;
}

/**
 * Validate coordinates are within Phuket area
 */
export function isWithinPhuket(lat: number, lng: number): boolean {
  const PHUKET_BOUNDS = {
    south: 7.70,
    north: 8.25,
    west: 98.20,
    east: 98.50,
  };
  
  return (
    lat >= PHUKET_BOUNDS.south &&
    lat <= PHUKET_BOUNDS.north &&
    lng >= PHUKET_BOUNDS.west &&
    lng <= PHUKET_BOUNDS.east
  );
}

/**
 * Batch geocode multiple addresses
 * Respects rate limiting (1 request per second)
 */
export async function batchGeocode(
  addresses: string[]
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();
  
  for (const address of addresses) {
    const result = await geocodeAddress(address);
    results.set(address, result);
  }
  
  return results;
}

