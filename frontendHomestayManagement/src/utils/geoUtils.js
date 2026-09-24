/**
 * Geo Utilities for Lá Đỏ Homestay Map Explorer
 * Calculates accurate geodesic distance (Haversine formula),
 * estimated travel duration (walking / driving), and generates Google Maps directions URL.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates the great-circle distance between two coordinates in meters.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = EARTH_RADIUS_METERS * c;
  // Realistic mountain road distance coefficient in Sa Pa terrain (~1.65x straight line)
  return Math.round(straightLine * 1.65);
}

export function getPlaceDistanceMeters(place, originLat, originLng) {
  if (place && place.roadDistanceMeters != null && place.roadDistanceMeters > 0) {
    return place.roadDistanceMeters;
  }
  return calculateDistanceMeters(originLat, originLng, place?.latitude, place?.longitude);
}

/**
 * Formats distance according to user specifications:
 * - If < 1000m: "xxx m"
 * - If >= 1000m: "x.x km"
 * @param {number} meters 
 * @returns {string} Formatted distance string
 */
export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Calculates estimated walking duration based on ~4.5 km/h average mountain-city walking speed.
 * @param {number} meters 
 * @returns {string} e.g. "5 phút", "15 phút", "1 giờ 10 phút"
 */
export function estimateWalkingTime(meters) {
  if (!meters || meters <= 0) return '1 phút';
  // 4.5 km/h = 75 m/min. In hilly Sa Pa terrain, ~65 m/min is realistic.
  const minutes = Math.max(1, Math.round(meters / 65));
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin > 0 ? `${hours} giờ ${remainingMin} phút` : `${hours} giờ`;
}

/**
 * Calculates estimated driving duration based on ~25 km/h average Sa Pa town road speed.
 * @param {number} meters 
 * @returns {string} e.g. "3 phút", "10 phút"
 */
export function estimateDrivingTime(meters) {
  if (!meters || meters <= 0) return '1 phút';
  // 25 km/h = ~416 m/min
  const minutes = Math.max(1, Math.round(meters / 416));
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin > 0 ? `${hours} giờ ${remainingMin} phút` : `${hours} giờ`;
}

/**
 * Generates an official Google Maps Directions URL from origin coordinates to destination coordinates.
 * @param {Object} origin { lat, lng, name }
 * @param {Object} destination { lat, lng, name }
 * @param {'walking'|'driving'} mode
 * @returns {string}
 */
export function generateGoogleMapsDirectionsUrl(origin, destination, mode = 'walking') {
  if (!destination?.lat || !destination?.lng) return 'https://maps.google.com';
  
  const originParam = origin ? `${origin.lat},${origin.lng}` : '';
  const destParam = `${destination.lat},${destination.lng}`;
  const travelMode = mode === 'walking' ? 'walking' : 'driving';
  
  if (originParam) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destParam)}&travelmode=${travelMode}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destParam)}`;
}
