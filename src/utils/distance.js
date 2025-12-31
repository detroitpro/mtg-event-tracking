// Distance calculation using Haversine formula

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} unit - 'mi' for miles, 'km' for kilometers
 * @returns {number} Distance in specified unit
 */
export function calculateDistance(lat1, lon1, lat2, lon2, unit = 'mi') {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return null;
  }
  
  const R = unit === 'km' ? 6371 : 3959; // Earth's radius in km or miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance from user location to event
 * @param {Object} userLocation - { lat, lng }
 * @param {Object} eventLocation - { lat, lng } or event object with coordinates
 * @param {string} unit - 'mi' or 'km'
 * @returns {number|null} Distance or null if coordinates unavailable
 */
export function distanceToEvent(userLocation, eventLocation, unit = 'mi') {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return null;
  }
  
  const eventCoords = eventLocation.coordinates || eventLocation;
  if (!eventCoords || !eventCoords.lat || !eventCoords.lng) {
    return null;
  }
  
  return calculateDistance(
    userLocation.lat,
    userLocation.lng,
    eventCoords.lat,
    eventCoords.lng,
    unit
  );
}

/**
 * Format distance for display
 * @param {number|null} distance - Distance in miles or km
 * @param {string} unit - 'mi' or 'km'
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance, unit = 'mi') {
  if (distance === null || distance === undefined) {
    return 'Distance unknown';
  }
  
  const unitLabel = unit === 'km' ? 'km' : 'mi';
  return `${distance} ${unitLabel}`;
}
