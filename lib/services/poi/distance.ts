/**
 * Distance Calculator - Haversine formula and related utilities
 * 
 * Calculates distances between coordinates and estimates walking/driving times
 */

import { Coordinates, SeaViewAnalysis } from './types';

// Earth's radius in meters
const EARTH_RADIUS_METERS = 6371000;

// Walking speed: ~5 km/h = 83.33 m/min
const WALKING_SPEED_M_PER_MIN = 83.33;

// Average driving speed in urban areas: ~30 km/h = 500 m/min
const DRIVING_SPEED_M_PER_MIN = 500;

/**
 * Calculate the Haversine distance between two points
 * 
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calculate distance between two coordinate objects
 */
export function distanceBetween(from: Coordinates, to: Coordinates): number {
  return haversineDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );
}

/**
 * Estimate walking time in minutes
 * 
 * @param distanceMeters - Distance in meters
 * @returns Walking time in minutes (rounded up)
 */
export function estimateWalkingTime(distanceMeters: number): number {
  return Math.ceil(distanceMeters / WALKING_SPEED_M_PER_MIN);
}

/**
 * Estimate driving time in minutes
 * 
 * @param distanceMeters - Distance in meters
 * @returns Driving time in minutes (rounded up)
 */
export function estimateDrivingTime(distanceMeters: number): number {
  return Math.ceil(distanceMeters / DRIVING_SPEED_M_PER_MIN);
}

/**
 * Calculate bearing from point A to point B
 * 
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  from: Coordinates,
  to: Coordinates
): number {
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const toDeg = (rad: number) => rad * (180 / Math.PI);
  
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = toDeg(Math.atan2(y, x));
  
  // Normalize to 0-360
  return (bearing + 360) % 360;
}

/**
 * Convert bearing to cardinal direction
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Phuket coastline reference points (simplified)
 * These are approximate points along the western coastline
 */
const PHUKET_COASTLINE: Coordinates[] = [
  { latitude: 7.7612, longitude: 98.2929 }, // Nai Harn
  { latitude: 7.7842, longitude: 98.2947 }, // Rawai
  { latitude: 7.8181, longitude: 98.2986 }, // Chalong Bay
  { latitude: 7.8476, longitude: 98.2861 }, // Kata
  { latitude: 7.8567, longitude: 98.2816 }, // Kata Noi
  { latitude: 7.8840, longitude: 98.2824 }, // Karon
  { latitude: 7.8979, longitude: 98.2805 }, // Karon North
  { latitude: 7.9013, longitude: 98.2972 }, // Patong South
  { latitude: 7.9103, longitude: 98.2946 }, // Patong
  { latitude: 7.9281, longitude: 98.2812 }, // Patong North
  { latitude: 7.9559, longitude: 98.2794 }, // Kamala
  { latitude: 7.9806, longitude: 98.2812 }, // Surin
  { latitude: 8.0024, longitude: 98.2849 }, // Bang Tao South
  { latitude: 8.0244, longitude: 98.2933 }, // Bang Tao
  { latitude: 8.0433, longitude: 98.2966 }, // Laguna
  { latitude: 8.0724, longitude: 98.2988 }, // Nai Yang South
  { latitude: 8.0932, longitude: 98.3019 }, // Nai Yang
  { latitude: 8.1201, longitude: 98.3088 }, // Mai Khao
];

/**
 * Find the nearest point on the Phuket coastline
 */
export function findNearestCoastPoint(
  location: Coordinates
): { point: Coordinates; distance: number } {
  let nearestPoint = PHUKET_COASTLINE[0];
  let minDistance = distanceBetween(location, nearestPoint);
  
  for (const point of PHUKET_COASTLINE) {
    const distance = distanceBetween(location, point);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  }
  
  return {
    point: nearestPoint,
    distance: minDistance,
  };
}

/**
 * Analyze sea view potential for a property
 * 
 * This is a simplified analysis based on:
 * 1. Distance to coastline
 * 2. Direction to coast
 * 
 * Note: True sea view analysis would require elevation data
 * and building obstruction checks.
 */
export function analyzeSeaView(location: Coordinates): SeaViewAnalysis {
  const { point: nearestCoast, distance: seaDistance } = findNearestCoastPoint(location);
  
  // Properties within 500m have high potential for sea view
  // Properties within 1000m may have sea view from upper floors
  // Beyond 2000m unlikely to have meaningful sea view
  const hasSeaViewPotential = seaDistance < 1000;
  
  const bearing = calculateBearing(location, nearestCoast);
  const seaViewDirection = bearingToCardinal(bearing);
  
  return {
    hasSeaView: hasSeaViewPotential,
    seaViewDirection: hasSeaViewPotential ? seaViewDirection : undefined,
    seaDistance: Math.round(seaDistance),
  };
}

/**
 * Sort POIs by distance
 */
export function sortByDistance<T extends { distanceMeters: number }>(
  pois: T[]
): T[] {
  return [...pois].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Filter POIs within a radius
 */
export function filterByRadius<T extends { distanceMeters: number }>(
  pois: T[],
  radiusMeters: number
): T[] {
  return pois.filter(poi => poi.distanceMeters <= radiusMeters);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)}km`;
}

/**
 * Format walking time for display
 */
export function formatWalkingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min walk`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h walk`;
  }
  return `${hours}h ${mins}min walk`;
}

/**
 * Format driving time for display
 */
export function formatDrivingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min drive`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h drive`;
  }
  return `${hours}h ${mins}min drive`;
}

