/**
 * POI Types - Type definitions for the POI system
 */

import type { PoiCategory, PoiSource, NoiseLevel, TrafficLevel } from '@/lib/generated/prisma';

// Coordinate pair
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Geocoding result
export interface GeocodingResult extends Coordinates {
  displayName?: string;
  district?: string;
  confidence?: number;
}

// Raw POI from Overpass API
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Processed POI ready for database
export interface ProcessedPoi {
  externalId: string;
  source: PoiSource;
  name: string;
  nameTh?: string;
  nameLocal?: string;
  category: PoiCategory;
  subCategory?: string;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  osmTags?: Record<string, string>;
  importance: number;
  noiseLevel?: NoiseLevel;
  trafficLevel?: TrafficLevel;
}

// POI with calculated distance
export interface PoiWithDistance {
  id: string;
  name: string;
  nameTh?: string;
  category: PoiCategory;
  subCategory?: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  walkingMinutes?: number;
  drivingMinutes?: number;
  importance: number;
  isHighlight: boolean;
}

// Grouped POIs by category for UI
export interface GroupedPois {
  category: PoiCategory;
  label: string;
  icon: string;
  pois: PoiWithDistance[];
}

// POI Category configuration
export interface PoiCategoryConfig {
  category: PoiCategory;
  label: string;
  labelTh?: string;
  icon: string;
  color: string;
  osmQueries: string[]; // Overpass queries
  importance: number; // Default importance 1-10
  highlightRadius: number; // Meters - within this distance = highlight
}

// POI Sync options
export interface PoiSyncOptions {
  categories?: PoiCategory[];
  district?: string;
  boundingBox?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  forceRefresh?: boolean;
}

// POI Sync result
export interface PoiSyncResult {
  success: boolean;
  jobId: string;
  poisFetched: number;
  poisCreated: number;
  poisUpdated: number;
  poisSkipped: number;
  duration: number;
  errors?: string[];
}

// Property location scores
export interface PropertyLocationScores {
  beachScore: number;
  familyScore: number;
  convenienceScore: number;
  quietnessScore: number;
}

// Sea view analysis result
export interface SeaViewAnalysis {
  hasSeaView: boolean;
  seaViewDirection?: string;
  seaDistance: number;
}

// Thailand/Phuket specific districts
export const PHUKET_DISTRICTS = [
  'Rawai',
  'Chalong',
  'Kata',
  'Karon',
  'Patong',
  'Kamala',
  'Surin',
  'Bang Tao',
  'Laguna',
  'Cherng Talay',
  'Thalang',
  'Mai Khao',
  'Nai Harn',
  'Nai Yang',
  'Ao Po',
  'Cape Panwa',
  'Phuket Town',
] as const;

export type PhuketDistrict = typeof PHUKET_DISTRICTS[number];

// Phuket bounding box (approximate)
export const PHUKET_BBOX = {
  south: 7.75,
  west: 98.25,
  north: 8.20,
  east: 98.45,
} as const;

// Phuket Airport coordinates (for distance calculations)
export const PHUKET_AIRPORT = {
  latitude: 8.1132,
  longitude: 98.3169,
  name: 'Phuket International Airport',
} as const;

