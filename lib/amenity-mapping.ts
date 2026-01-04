/**
 * Amenity Mapping - Central configuration for amenity filtering and display
 * 
 * This file provides:
 * 1. Alias mapping for fuzzy/flexible filtering
 * 2. Icon mapping for display (using Lucide icons)
 * 3. Filter options for the PropertyFilters component
 */

import {
  Waves, Mountain, TreePine, Building2,
  Droplets, Flower2, Sun, DoorOpen, Flame, Car, Warehouse,
  ChefHat, Sofa, UtensilsCrossed, Armchair, Wind, ThermometerSun, Shirt, Archive,
  Layers, ArrowUpDown, Wifi, ShieldCheck, Video, Building,
  Dumbbell, Sparkles, Thermometer, Bath, Bell, Tv, Dog, Bike,
  Check, Sunrise, PalmtreeIcon, LucideIcon, Snowflake, Shirt as Laundry,
  Eye, Home, Film, Shield, LockKeyhole
} from 'lucide-react';

// ============================================================================
// AMENITY ALIASES - Maps search terms to database values
// ============================================================================

/**
 * Maps a search/filter term to all possible database values that should match.
 * Used for fuzzy matching - when user searches for "wifi", we also match "High-Speed WiFi"
 */
export const AMENITY_ALIASES: Record<string, string[]> = {
  // WiFi / Internet
  'wifi': ['WiFi', 'High-Speed WiFi'],
  'high-speed wifi': ['WiFi', 'High-Speed WiFi'],
  'internet': ['WiFi', 'High-Speed WiFi'],
  
  // Pool
  'pool': ['Swimming Pool', 'Infinity Pool'],
  'swimming pool': ['Swimming Pool', 'Infinity Pool'],
  'infinity pool': ['Swimming Pool', 'Infinity Pool'],
  
  // AC / Heating
  'ac': ['Air Conditioning', 'Central Cooling'],
  'air conditioning': ['Air Conditioning', 'Central Cooling'],
  'cooling': ['Air Conditioning', 'Central Cooling'],
  'heating': ['Central Heating', 'Fire Place'],
  'central heating': ['Central Heating'],
  
  // Parking
  'parking': ['Parking', 'Covered Car Park', 'Covered Parking'],
  'garage': ['Covered Car Park', 'Covered Parking'],
  'covered parking': ['Covered Car Park', 'Covered Parking'],
  
  // Gym / Fitness
  'gym': ['Gym'],
  'fitness': ['Gym'],
  
  // Views
  'sea view': ['Sea View', 'Ocean/Mountain Views'],
  'ocean view': ['Sea View', 'Ocean/Mountain Views'],
  'mountain view': ['Mountain View', 'Ocean/Mountain Views'],
  'sunset view': ['Sunset View'],
  
  // Security
  'security': ['24/7 Security', 'Alarm', 'Fire Alarm'],
  '24/7 security': ['24/7 Security'],
  'alarm': ['Alarm', 'Fire Alarm'],
  
  // Kitchen
  'kitchen': ['Kitchen', 'Fully Equipped Kitchen', 'Modern Kitchen'],
  'fully equipped kitchen': ['Fully Equipped Kitchen', 'Modern Kitchen', 'Kitchen'],
  
  // Outdoor
  'garden': ['Garden', 'Lawn'],
  'balcony': ['Balcony'],
  'terrace': ['Terace'], // Note: typo in database
  'barbecue': ['Barbecue Area'],
  'jacuzzi': ['Jacuzzi'],
  
  // Living
  'living room': ['Living room', 'Living Room'],
  'furnished': ['Fully Furnished'],
  
  // Laundry
  'washer': ['Washer', 'Washing machine'],
  'washing machine': ['Washer', 'Washing machine'],
  'dryer': ['Dryer'],
  'laundry': ['Laundry Room', 'Washer', 'Washing machine', 'Dryer'],
  
  // TV / Entertainment
  'tv': ['TV', 'TV Cable', 'Home Theater'],
  'home theater': ['Home Theater'],
  
  // Elevator
  'elevator': ['Elevator'],
  
  // Beach
  'private beach': ['Private Beach'],
  'beach': ['Private Beach'],
};

// ============================================================================
// ICON MAPPING - Maps amenity names to Lucide icons
// ============================================================================

/**
 * Maps amenity names (lowercase) to their corresponding Lucide icon component.
 * Used by PropertyAmenities component for display.
 */
export const AMENITY_ICONS: Record<string, LucideIcon> = {
  // Views
  'sea view': Waves,
  'ocean view': Waves,
  'ocean/mountain views': Waves,
  'mountain view': Mountain,
  'sunset view': Sunrise,
  'garden view': TreePine,
  'pool view': Droplets,
  'city view': Building2,
  
  // Pool / Water
  'swimming pool': Droplets,
  'pool': Droplets,
  'infinity pool': Droplets,
  'private pool': Droplets,
  'jacuzzi': Bath,
  
  // Outdoor
  'garden': Flower2,
  'lawn': Flower2,
  'terrace': Sun,
  'terace': Sun, // Handle typo
  'balcony': DoorOpen,
  'roof top': Building,
  'rooftop': Building,
  'roof top/poolbar': Building,
  'barbecue': Flame,
  'barbecue area': Flame,
  'private beach': Waves,
  
  // Parking
  'parking': Car,
  'covered car park': Warehouse,
  'covered parking': Warehouse,
  'garage': Warehouse,
  
  // Kitchen
  'kitchen': ChefHat,
  'fully equipped kitchen': ChefHat,
  'modern kitchen': ChefHat,
  'electric range': ChefHat,
  'refrigerator': ChefHat,
  'microwave': ChefHat,
  
  // Living
  'living room': Sofa,
  'dining room': UtensilsCrossed,
  'fully furnished': Armchair,
  'marble floors': Home,
  
  // Climate
  'air conditioning': Wind,
  'central cooling': Wind,
  'heating': ThermometerSun,
  'central heating': ThermometerSun,
  'fire place': Flame,
  'fireplace': Flame,
  
  // Laundry
  'laundry': Shirt,
  'laundry room': Shirt,
  'washer': Shirt,
  'washing machine': Shirt,
  'dryer': Shirt,
  
  // Storage & Structure
  'storage': Archive,
  '2 stories': Layers,
  '3 stories': Layers,
  "26' ceilings": ArrowUpDown,
  'high ceilings': ArrowUpDown,
  
  // Smart / WiFi
  'wifi': Wifi,
  'high-speed wifi': Wifi,
  'smart home': Wifi,
  
  // Security
  'security': ShieldCheck,
  '24/7 security': ShieldCheck,
  'cctv': Video,
  'alarm': Shield,
  'fire alarm': Shield,
  'emergency exit': Shield,
  'hurricane shutters': Shield,
  'window coverings': LockKeyhole,
  
  // Elevator
  'elevator': Building,
  
  // Facilities
  'gym': Dumbbell,
  'fitness': Dumbbell,
  'spa': Sparkles,
  'sauna': Thermometer,
  'restaurant': UtensilsCrossed,
  'concierge': Bell,
  
  // Entertainment
  'tv': Tv,
  'tv cable': Tv,
  'home theater': Film,
  
  // Outdoor Activities
  'bike path': Bike,
  'jog path': Bike,
  
  // Misc
  'dual sinks': Bath,
  'next to busy way': Car,
};

// ============================================================================
// FILTER OPTIONS - Amenities available for filtering in PropertyFilters
// ============================================================================

export interface AmenityFilterOption {
  label: string;
  value: string;  // This is what we search for
  icon: string;   // Iconify icon name
  aliases?: string[]; // Database values this matches
}

/**
 * Amenities shown in the PropertyFilters component.
 * Each option can match multiple database values via aliases.
 */
export const AMENITY_FILTER_OPTIONS: AmenityFilterOption[] = [
  // Most popular filters
  { label: "Swimming Pool", value: "pool", icon: "ph:swimming-pool" },
  { label: "WiFi", value: "wifi", icon: "ph:wifi-high" },
  { label: "Air Conditioning", value: "ac", icon: "ph:thermometer-cold" },
  { label: "Gym", value: "gym", icon: "ph:barbell" },
  { label: "Sea View", value: "sea view", icon: "ph:waves" },
  { label: "Parking", value: "parking", icon: "ph:car" },
  { label: "Garden", value: "garden", icon: "ph:flower" },
  { label: "Fully Furnished", value: "furnished", icon: "ph:armchair" },
  { label: "Kitchen", value: "kitchen", icon: "ph:cooking-pot" },
  { label: "Security", value: "security", icon: "ph:shield-check" },
  { label: "Jacuzzi", value: "jacuzzi", icon: "ph:bathtub" },
  { label: "Elevator", value: "elevator", icon: "ph:elevator" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Expands a search term to all matching database values.
 * Used by the property filter API.
 * 
 * @param searchTerm - The term to search for (e.g., "wifi", "pool")
 * @returns Array of database values that match
 */
export function expandAmenitySearch(searchTerm: string): string[] {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Check if we have aliases for this term
  const aliases = AMENITY_ALIASES[normalized];
  if (aliases && aliases.length > 0) {
    return aliases;
  }
  
  // No aliases - try to find partial matches in database values
  // This handles cases like "Air Conditioning" being passed directly
  return [searchTerm];
}

/**
 * Expands multiple search terms to all matching database values.
 * 
 * @param searchTerms - Array of terms to search for
 * @returns Array of all unique database values that match any term
 */
export function expandAmenitySearchTerms(searchTerms: string[]): string[] {
  const expanded = new Set<string>();
  
  for (const term of searchTerms) {
    const matches = expandAmenitySearch(term);
    matches.forEach(m => expanded.add(m));
  }
  
  return Array.from(expanded);
}

/**
 * Gets the icon component for an amenity name.
 * Falls back to Check icon if not found.
 * 
 * @param amenityName - The amenity name from the database
 * @returns Lucide icon component
 */
export function getAmenityIcon(amenityName: string): LucideIcon {
  const normalized = amenityName.toLowerCase().trim();
  return AMENITY_ICONS[normalized] || Check;
}

/**
 * Normalizes amenity name for consistent display.
 * Handles common typos and case inconsistencies.
 * 
 * @param amenityName - Raw amenity name from database
 * @returns Normalized display name
 */
export function normalizeAmenityName(amenityName: string): string {
  const fixes: Record<string, string> = {
    'terace': 'Terrace',
    'high-speed wifi': 'High-Speed WiFi',
    'wifi': 'WiFi',
  };
  
  const lower = amenityName.toLowerCase().trim();
  return fixes[lower] || amenityName;
}
