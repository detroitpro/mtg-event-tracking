# MTG Event Planner - Developer Guide

This document provides everything a new developer needs to understand, maintain, and extend this project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Key Concepts](#key-concepts)
4. [Component Guide](#component-guide)
5. [Data Management](#data-management)
6. [Enrichment System](#enrichment-system)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Purpose
A web app for competitive Magic: The Gathering players to discover and plan events in the Midwest US. Tracks RCQs (Regional Championship Qualifiers), Regional Championships, and other competitive events.

### Target Users
- Competitive MTG players planning travel to events
- Players tracking qualification paths to Pro Tour

### Key User Flows
1. Set location → See events sorted by distance
2. Filter by format/type/state → Find relevant events
3. Favorite events → Build personal agenda
4. Share agenda URL → Coordinate with friends

---

## Architecture

### Tech Stack
```
Frontend:  Vue 3 (Composition-style in options API)
Build:     Vite 5
Styling:   Pure CSS with variables
Storage:   LocalStorage (client-side only)
Geocoding: OpenStreetMap Nominatim API
```

### Data Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT DATA PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  events.txt                                                     │
│      │                                                          │
│      ▼ (make extract)                                           │
│  events-metadata.json                                           │
│      │                                                          │
│      ├─────────────────────────────────────────┐                │
│      │                                         │                │
│      ▼ (make enrich-prepare)                   ▼                │
│  [Search Queries]                   public/events-metadata.json │
│      │                                         │                │
│      ▼ (AI/Manual Search)                      ▼                │
│  enrichment-results.json                   [Vue App]            │
│      │                                                          │
│      ▼ (make enrich-apply)                                      │
│  events-metadata.json (updated)                                 │
│      │                                                          │
│      ▼ (make enrich-geocode)                                    │
│  events-metadata.json (with coordinates)                        │
│      │                                                          │
│      ▼ (make deploy-public)                                     │
│  public/events-metadata.json                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure Quick Reference

| Path | Purpose |
|------|---------|
| `events.txt` | Raw event data (manually updated) |
| `public/events-metadata.json` | **THE event database** (single source of truth) |
| `enrichment/` | Enrichment scripts |
| `enrichment/results.json` | Your search results (input for apply.js) |
| `enrichment/.cache.json` | Auto-generated cache |
| `src/App.vue` | Main app component (~550 lines) |
| `src/components/` | UI components |
| `src/utils/` | Utility functions |

---

## Key Concepts

### Event Structure

```javascript
{
  id: "2026-01-03-store-name-city",  // Unique identifier
  type: "RCQ",                        // RCQ | RC | Magic Spotlight | SCG CON | Other
  date: "2026-01-03",                 // YYYY-MM-DD format
  time: "10pm",                       // Optional, various formats
  venue: "Store Name",                // Venue name (as appears in events.txt)
  city: "Chicago",                    // City name
  state: "IL",                        // 2-letter state code
  format: "Standard",                 // MTG format
  notes: "2-slot",                    // Special notes (2-slot, TLA?, etc.)
  qualificationPath: "...",           // What this event qualifies for
  address: "123 Main St...",          // Full address (from enrichment)
  coordinates: { lat, lng },          // GPS coords (from geocoding)
  website: "https://...",             // Store website
  eventLink: "https://..."            // Event registration/details page
}
```

### Venue Key Pattern

Venues are identified by: `"Venue Name|City|State"`

Example: `"Dice Dojo|Chicago|IL"`

This key is used in:
- Enrichment cache
- Deduplicating venues for address lookups
- Applying enrichment to all events at same venue

### User Location

Stored in localStorage as:
```javascript
{
  city: "Chicago",
  state: "IL",
  coordinates: { lat: 41.8781, lng: -87.6298 }
}
```

Used for:
- Distance calculations
- Default geocoding context
- Display in header

### Favorites System

- Stored in localStorage as array of event IDs
- Tracked via `favoritesVersion` ref for reactivity
- Shared via LZ-compressed URL parameter

---

## Component Guide

### `App.vue` (Main Orchestrator)

**Responsibilities:**
- Loads event data from `public/events-metadata.json`
- Manages global state (filters, location, favorites, active tab)
- Handles filter logic and computed filtered events
- Manages modals and tab navigation

**Key Refs:**
```javascript
events          // All loaded events
userLocation    // User's location config
activeTab       // 'upcoming' | 'all' | 'favorites'
selectedFormats // Active format filters
selectedStates  // Active state filters
maxDistance     // Distance filter (null = no limit)
showMyAgenda    // Filter by favorited dates
```

**Key Computed:**
```javascript
filteredEvents      // Events after all filters applied
filteredUpcomingEvents  // Next 3 weeks
favoriteEvents      // User's favorited events
```

### `EventCard.vue`

Displays a single event with:
- Venue name in header
- Date/time display
- Format and type badges
- Distance pill (calculated on mount)
- Favorite button
- Address with maps link

**Props:** `event`, `userLocation`, `distanceUnit`
**Emits:** `favorite-toggled`

### `EventList.vue`

Groups events by date with:
- Collapsible date headers
- "Days until" badge on headers
- Heart icon if group contains favorites
- Sort controls (distance within each date)

**Props:** `events`, `userLocation`, `distanceUnit`, `defaultCollapsed`
**Emits:** `favorite-toggled`

### `FilterModal.vue`

Reusable modal for multi-select filters:
- Search input
- Select all / Clear all
- Chip-style options

**Props:** `open`, `title`, `options`, `selected`
**Emits:** `update:selected`, `close`

### `LocationConfig.vue`

Initial setup screen for:
- City/state text input
- Geolocation button (browser permission)
- Distance unit toggle

**Emits:** `location-set`, `use-geolocation`

---

## Data Management

### Loading Events

```javascript
// In App.vue mounted()
const response = await fetch('/events-metadata.json');
const data = await response.json();
events.value = data.events || [];
```

### Distance Calculation

```javascript
// src/utils/distance.js
export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  // Returns distance in miles
}

// src/utils/distanceCache.js
export function getOrCalculateDistance(event, userLocation) {
  // Check cache first
  // Calculate and cache if not found
  // Returns { distance, unit }
}
```

### Geocoding

```javascript
// src/utils/geocoding.js
export async function geocodeAddress(address) {
  // Uses Nominatim API
  // Returns { lat, lng } or null
  // Rate limited: 1 request/second
}
```

### Favorites

```javascript
// src/utils/favorites.js
export function getFavoriteEvents()      // Returns Set of IDs
export function addFavorite(id)          // Add to favorites
export function removeFavorite(id)       // Remove from favorites
export function isFavorite(id)           // Check if favorited
export function clearAllFavorites()      // Clear all
```

---

## Enrichment System

Located in `enrichment/` folder. See [enrichment/README.md](enrichment/README.md) for details.

### Quick Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `extract.js` | `make extract` | Parse events.txt |
| `prepare.js` | `make enrich-prepare` | Generate search queries |
| `apply.js` | `make enrich-apply` | Apply results to metadata |
| `geocode.js` | `make enrich-geocode` | Batch geocode addresses |

### Enrichment Results Format

```json
[
  {
    "type": "address",
    "venueKey": "Store Name|City|State",
    "address": "123 Main St, City, State ZIP",
    "website": "https://...",
    "coordinates": null
  },
  {
    "type": "link",
    "eventId": "2026-01-03-store-name-city",
    "link": "https://event-page.com"
  }
]
```

---

## Common Tasks

### Adding New Events

1. Edit `events.txt` with new event data
2. Run `make extract`
3. Run enrichment if needed:
   ```bash
   make enrich-prepare
   # Search for missing data
   # Create enrichment-results.json
   make enrich-apply
   make enrich-geocode
   ```
4. Deploy: `make deploy-public`
5. Rebuild: `make build`

### Updating Event Data Format

If you need to change the event structure:

1. Update `enrichment/extract.js` parser
2. Update `EventCard.vue` display
3. Update any filters in `App.vue`
4. Re-extract: `make extract`

### Adding a New Filter

1. Add filter state in `App.vue`:
   ```javascript
   const selectedNewFilter = ref([]);
   ```
2. Add to `filteredEvents` computed
3. Add filter UI (button in FilterBar, modal, etc.)
4. Add clear logic in `clearAllFilters()`

### Changing the UI Theme

CSS variables are in `src/styles/main.css`:

```css
:root {
  --bg-primary: #0a0a0f;
  --text-primary: #f0f0f5;
  --accent-primary: #8b5cf6;
  /* ... */
}
```

### Adding a New Tab

1. Add tab option in `TabNav.vue`
2. Add section in `App.vue` template:
   ```vue
   <section v-if="activeTab === 'newtab'">
     <!-- Content -->
   </section>
   ```
3. Add any computed properties for tab data

---

## Troubleshooting

### Events Not Showing

1. Check browser console for fetch errors
2. Verify `public/events-metadata.json` exists and is valid JSON
3. Check if filters are excluding all events

### Distance Not Calculating

1. Check if event has `coordinates`
2. Check if user location is set (inspect localStorage)
3. Check `distanceCache.js` for issues

### Geocoding Failing

1. Nominatim rate limit: 1 request/second
2. Address might be invalid or not in database
3. Check console for specific error messages

### Favorites Not Persisting

1. Check if localStorage is available (private browsing can block it)
2. Check localStorage key: `mtg-favorites`
3. Verify `favoritesVersion` is incrementing on changes

### Share URL Too Long

URL compression uses LZ-String. If URLs are still too long:
1. Check if many events are favorited
2. Consider implementing server-side short URLs
3. Current compression: ~70% smaller for 30+ events

### Build Failing

1. Run `yarn install` to ensure deps are current
2. Check for TypeScript/Vue template errors
3. Run `make clean` and rebuild

---

## API Reference

### OpenStreetMap Nominatim

```
GET https://nominatim.openstreetmap.org/search
  ?q={address}
  &format=json
  &limit=1
  &countrycodes=us

Headers:
  User-Agent: MTG Event Planner/1.0
  
Rate Limit: 1 request/second
```

### LocalStorage Keys

| Key | Purpose | Format |
|-----|---------|--------|
| `mtg-event-config` | User location | JSON object |
| `mtg-favorites` | Favorited events | JSON array of IDs |
| `mtg-distance-cache` | Distance cache | JSON object |

---

## Deployment Notes

### Static Hosting Requirements

- Serves static files from `dist/`
- SPA routing (fallback to index.html) not required
- No server-side processing needed

### Build Output

```bash
make build
# Creates dist/ folder with:
# - index.html
# - assets/index-*.js
# - assets/index-*.css
# - events-metadata.json
```

### Environment Variables

None required. The app uses relative paths.

---

## Contact & Resources

- **Events Source**: Manually curated from various MTG event sources
- **Geocoding**: OpenStreetMap Nominatim (free, rate-limited)
- **Icons**: Inline SVG (no external dependencies)

---

*Last updated: January 2026*
