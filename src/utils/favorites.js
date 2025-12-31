// Favorites management utility using localStorage
// Stores user's favorite events for quick access

const FAVORITES_KEY = 'mtg-event-favorites';

/**
 * Get all favorite event IDs
 * @returns {Set<string>} Set of favorite event IDs
 */
export function getFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return new Set();
    const data = JSON.parse(stored);
    return new Set(data.favorites || []);
  } catch (e) {
    console.warn('Error reading favorites:', e);
    return new Set();
  }
}

/**
 * Save favorites to localStorage
 * @param {Set<string>} favorites - Set of favorite event IDs
 */
function saveFavorites(favorites) {
  try {
    const data = {
      favorites: Array.from(favorites),
      lastUpdated: Date.now()
    };
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Error saving favorites:', e);
  }
}

/**
 * Check if an event is favorited
 * @param {string} eventId - Event ID to check
 * @returns {boolean} True if favorited
 */
export function isFavorite(eventId) {
  if (!eventId) return false;
  const favorites = getFavorites();
  return favorites.has(eventId);
}

/**
 * Toggle favorite status for an event
 * @param {string} eventId - Event ID to toggle
 * @returns {boolean} New favorite status
 */
export function toggleFavorite(eventId) {
  if (!eventId) return false;
  
  const favorites = getFavorites();
  
  if (favorites.has(eventId)) {
    favorites.delete(eventId);
  } else {
    favorites.add(eventId);
  }
  
  saveFavorites(favorites);
  return favorites.has(eventId);
}

/**
 * Add an event to favorites
 * @param {string} eventId - Event ID to add
 */
export function addFavorite(eventId) {
  if (!eventId) return;
  const favorites = getFavorites();
  favorites.add(eventId);
  saveFavorites(favorites);
}

/**
 * Remove an event from favorites
 * @param {string} eventId - Event ID to remove
 */
export function removeFavorite(eventId) {
  if (!eventId) return;
  const favorites = getFavorites();
  favorites.delete(eventId);
  saveFavorites(favorites);
}

/**
 * Get favorite events from a list
 * @param {Array} events - Array of event objects
 * @returns {Array} Array of favorite events
 */
export function getFavoriteEvents(events) {
  const favorites = getFavorites();
  return events.filter(event => favorites.has(event.id));
}

/**
 * Clear all favorites
 */
export function clearAllFavorites() {
  try {
    localStorage.removeItem(FAVORITES_KEY);
  } catch (e) {
    console.warn('Error clearing favorites:', e);
  }
}

/**
 * Get favorites count
 * @returns {number} Number of favorites
 */
export function getFavoritesCount() {
  return getFavorites().size;
}
