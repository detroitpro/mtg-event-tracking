/**
 * Date utilities for handling YYYY-MM-DD date strings
 * 
 * IMPORTANT: new Date("2026-01-10") parses as UTC midnight, which when
 * displayed in local timezone (e.g., EST) shows as the previous day.
 * 
 * These utilities parse dates as LOCAL time to avoid timezone issues.
 */

/**
 * Parse a YYYY-MM-DD date string as local midnight (not UTC)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Date object at local midnight
 */
export function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  
  // Split the date string and create date with local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Format a date string for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date like "JAN 10"
 */
export function formatDateShort(dateString) {
  const date = parseLocalDate(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Get the weekday abbreviation
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Weekday like "FRI"
 */
export function getWeekday(dateString) {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

/**
 * Get days until a date from today
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Days until the event (negative if past)
 */
export function getDaysUntil(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventDate = parseLocalDate(dateString);
  eventDate.setHours(0, 0, 0, 0);
  
  const diffTime = eventDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export function isToday(dateString) {
  return getDaysUntil(dateString) === 0;
}

/**
 * Check if a date is tomorrow
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export function isTomorrow(dateString) {
  return getDaysUntil(dateString) === 1;
}

/**
 * Check if a date is this week (within 7 days)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export function isThisWeek(dateString) {
  const days = getDaysUntil(dateString);
  return days >= 0 && days <= 7;
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string}
 */
export function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
