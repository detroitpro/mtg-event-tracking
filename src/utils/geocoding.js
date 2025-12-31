// Geocoding utility using OpenStreetMap Nominatim API
// This is a free, rate-limited service

const GEOCODE_CACHE = new Map();
const RATE_LIMIT_DELAY = 1000; // 1 second between requests to respect rate limits

export async function geocodeVenue(venue, city, state) {
  const cacheKey = `${venue}, ${city}, ${state}`;
  
  // Check cache first
  if (GEOCODE_CACHE.has(cacheKey)) {
    return GEOCODE_CACHE.get(cacheKey);
  }
  
  try {
    // Use Nominatim API (free, no key required)
    const query = encodeURIComponent(`${venue}, ${city}, ${state}, USA`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MTG Event Planner/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const geocodeResult = {
        address: result.display_name,
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        },
        found: true
      };
      
      GEOCODE_CACHE.set(cacheKey, geocodeResult);
      return geocodeResult;
    }
    
    // Not found
    const notFound = {
      address: null,
      coordinates: null,
      found: false
    };
    GEOCODE_CACHE.set(cacheKey, notFound);
    return notFound;
    
  } catch (error) {
    console.error(`Geocoding error for ${venue}, ${city}, ${state}:`, error);
    return {
      address: null,
      coordinates: null,
      found: false,
      error: error.message
    };
  }
}

export async function geocodeVenuesBatch(venues, onProgress = null) {
  const results = [];
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    const result = await geocodeVenue(venue.venue, venue.city, venue.state);
    results.push({
      ...venue,
      ...result
    });
    
    if (onProgress) {
      onProgress(i + 1, venues.length);
    }
    
    // Rate limiting - wait between requests
    if (i < venues.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }
  
  return results;
}
