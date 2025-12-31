// Distance caching utility using localStorage
// Caches calculated distances to avoid redundant calculations

const CACHE_KEY = 'mtg-event-distances';
const CACHE_VERSION = 1;
const CACHE_EXPIRY_DAYS = 7; // Cache expires after 7 days

/**
 * Get the cache from localStorage
 * @returns {Object} Cache object with distances and metadata
 */
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return createEmptyCache();
    }
    
    const data = JSON.parse(cached);
    
    // Check version and expiry
    if (data.version !== CACHE_VERSION || isExpired(data.timestamp)) {
      clearCache();
      return createEmptyCache();
    }
    
    return data;
  } catch (e) {
    console.warn('Error reading distance cache:', e);
    return createEmptyCache();
  }
}

/**
 * Save the cache to localStorage
 * @param {Object} cache - Cache object to save
 */
function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Error saving distance cache:', e);
  }
}

/**
 * Create an empty cache structure
 * @returns {Object} Empty cache object
 */
function createEmptyCache() {
  return {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    userLocation: null,
    distances: {}
  };
}

/**
 * Check if the cache is expired
 * @param {number} timestamp - Cache timestamp
 * @returns {boolean} True if expired
 */
function isExpired(timestamp) {
  const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > expiryMs;
}

/**
 * Generate a cache key for a user location
 * @param {Object} userLocation - { lat, lng }
 * @returns {string} Location key
 */
function getUserLocationKey(userLocation) {
  if (!userLocation || !userLocation.lat || !userLocation.lng) return null;
  // Round to 3 decimal places (~111m precision) for cache key
  return `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}`;
}

/**
 * Generate a cache key for an event
 * @param {Object} event - Event object
 * @returns {string|null} Event key or null
 */
function getEventKey(event) {
  if (!event) return null;
  
  // Use event ID if available, otherwise use venue + city + date
  if (event.id) return `event_${event.id}`;
  
  const coords = event.coordinates;
  if (coords && coords.lat && coords.lng) {
    return `coords_${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
  }
  
  return `venue_${event.venue}_${event.city}_${event.state}`.replace(/\s+/g, '_');
}

/**
 * Get cached distance for an event
 * @param {Object} userLocation - User's location
 * @param {Object} event - Event object
 * @returns {number|null} Cached distance or null if not cached
 */
export function getCachedDistance(userLocation, event) {
  const cache = getCache();
  const userKey = getUserLocationKey(userLocation);
  const eventKey = getEventKey(event);
  
  if (!userKey || !eventKey) return null;
  
  // Check if user location matches cached location
  if (cache.userLocation !== userKey) {
    return null;
  }
  
  return cache.distances[eventKey] ?? null;
}

/**
 * Cache a distance value
 * @param {Object} userLocation - User's location
 * @param {Object} event - Event object
 * @param {number} distance - Calculated distance
 */
export function cacheDistance(userLocation, event, distance) {
  if (distance === null || distance === undefined) return;
  
  const cache = getCache();
  const userKey = getUserLocationKey(userLocation);
  const eventKey = getEventKey(event);
  
  if (!userKey || !eventKey) return;
  
  // If user location changed, clear old distances
  if (cache.userLocation && cache.userLocation !== userKey) {
    cache.distances = {};
  }
  
  cache.userLocation = userKey;
  cache.distances[eventKey] = distance;
  cache.timestamp = Date.now();
  
  saveCache(cache);
}

/**
 * Get all cached distances for a user location
 * @param {Object} userLocation - User's location
 * @returns {Object} Map of event keys to distances
 */
export function getAllCachedDistances(userLocation) {
  const cache = getCache();
  const userKey = getUserLocationKey(userLocation);
  
  if (!userKey || cache.userLocation !== userKey) {
    return {};
  }
  
  return cache.distances;
}

/**
 * Clear the distance cache
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn('Error clearing distance cache:', e);
  }
}

/**
 * Get or calculate distance with caching
 * @param {Object} userLocation - User's location
 * @param {Object} event - Event object
 * @param {Function} calculateFn - Function to calculate distance if not cached
 * @returns {number|null} Distance value
 */
export function getOrCalculateDistance(userLocation, event, calculateFn) {
  // Try to get from cache first
  const cached = getCachedDistance(userLocation, event);
  if (cached !== null) {
    return cached;
  }
  
  // Calculate and cache
  const distance = calculateFn();
  if (distance !== null) {
    cacheDistance(userLocation, event, distance);
  }
  
  return distance;
}
