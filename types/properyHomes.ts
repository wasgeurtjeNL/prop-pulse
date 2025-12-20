// Re-export centralized getPropertyUrl for backwards compatibility
export { getPropertyUrl } from '@/lib/property-url';

export type PropertyHomes = {
  name: string
  slug: string
  category: string
  location: string
  rate: string
  beds: number
  baths: number
  area: number
  images: PropertyImage[]
  
  // Property features for badges
  amenities?: string[]
  yearBuilt?: number
  
  // POI Location data (optional for backwards compatibility)
  beachScore?: number | null
  familyScore?: number | null
  convenienceScore?: number | null
  quietnessScore?: number | null
  hasSeaView?: boolean | null
  seaDistance?: number | null
  district?: string | null
  
  // Hierarchical URL slugs
  provinceSlug?: string | null
  areaSlug?: string | null
}

interface PropertyImage {
  src: string;
}
