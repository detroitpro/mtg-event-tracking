# MTG Event Planner

A web application to help competitive Magic: The Gathering players plan and track Pro Tour qualification events in the Midwest US region.

![Vue.js](https://img.shields.io/badge/Vue.js-3.4-4FC08D?logo=vuedotjs)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Event Discovery
- **Multi-format Support**: Track RCQ (Regional Championship Qualifiers), RC (Regional Championships), Magic Spotlight Series, and SCG CON events
- **Format Filtering**: Filter by Standard, Limited, Modern, Pioneer, and other formats
- **State Filtering**: Focus on events in specific states
- **Date-based Grouping**: Events organized by date with collapsible groups

### Location-based Features
- **Distance Calculation**: See how far each event is from your location
- **Distance Filtering**: Show only events within your travel radius
- **Geocoding**: Automatic address-to-coordinates conversion
- **Maps Integration**: Click addresses to open in Google Maps

### Personal Planning
- **Favorites System**: Mark events you plan to attend
- **My Agenda Filter**: View only dates with favorited events
- **Share Agenda**: Generate shareable URLs of your event plans (LZ-compressed for compact URLs)
- **Tab Navigation**: Switch between Upcoming, All Events, and Favorites views

### User Experience
- **Dark Theme**: Glassmorphic UI with animated background
- **Responsive Design**: Works on desktop and mobile
- **Local Storage**: Preferences and favorites persist across sessions
- **Distance Caching**: Avoid redundant calculations

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

The app opens at `http://localhost:5173`

## Commands

### Development
```bash
yarn dev          # Start dev server
yarn build        # Build for production
yarn preview      # Preview production build
```

### Using Make (recommended)
```bash
make help         # Show all available commands
make dev          # Start dev server
make build        # Build for production
make status       # Show enrichment status
```

### Enrichment (see [enrichment/README.md](enrichment/README.md))
```bash
make extract           # Parse events.txt → events-metadata.json
make enrich-prepare    # Generate search queries
make enrich-apply      # Apply enrichment results
make enrich-geocode    # Geocode addresses
make deploy-public     # Copy metadata to public/
```

## Project Structure

```
mtg-comp/
├── events.txt              # Raw event data (source of truth)
├── Makefile               # Command shortcuts
├── package.json
├── vite.config.js
│
├── enrichment/            # Event enrichment scripts
│   ├── extract.js         # Parse events.txt
│   ├── prepare.js         # Generate search queries
│   ├── apply.js           # Apply enrichment results
│   ├── geocode.js         # Batch geocoding
│   ├── results.json       # Enrichment results (you create this)
│   ├── .cache.json        # Auto-generated cache
│   └── README.md          # Enrichment documentation
│
├── public/
│   └── events-metadata.json  # THE event database (single source of truth)
│
├── src/
│   ├── main.js            # Vue app entry
│   ├── App.vue            # Root component
│   ├── components/
│   │   ├── AmbientBackground.vue   # Animated background
│   │   ├── AppHeader.vue           # Header with branding
│   │   ├── DistanceModal.vue       # Distance filter modal
│   │   ├── EventCard.vue           # Individual event display
│   │   ├── EventList.vue           # Event listing with groups
│   │   ├── FavoritesSection.vue    # Favorites tab content
│   │   ├── FilterBar.vue           # Filter chips bar
│   │   ├── FilterModal.vue         # Filter selection modal
│   │   ├── LocationConfig.vue      # User location setup
│   │   ├── StatsBar.vue            # Event count display
│   │   ├── TabNav.vue              # Tab navigation
│   │   └── UpcomingEvents.vue      # Upcoming events tab
│   ├── utils/
│   │   ├── config.js        # User configuration
│   │   ├── distance.js      # Distance calculation
│   │   ├── distanceCache.js # Distance caching
│   │   ├── favorites.js     # Favorites management
│   │   └── geocoding.js     # Geocoding utilities
│   └── styles/
│       └── main.css         # Global styles
│
└── dist/                   # Production build output
```

## Data Flow

```
events.txt (manual input)
       │
       ▼ (make extract)
public/events-metadata.json ◄──────────────┐
       │                                    │
       ├───────────────────────┐            │
       ▼                       ▼            │
  prepare.js              Vue App          │
       │                                    │
       ▼                                    │
Search with AI/Web                         │
       │                                    │
       ▼                                    │
enrichment/results.json                    │
       │                                    │
       ▼ (make enrich-apply)               │
public/events-metadata.json                │
       │                                    │
       ▼ (make enrich-geocode)             │
public/events-metadata.json ───────────────┘
```

**Note:** All scripts work directly with `public/events-metadata.json` - no copying needed.

## Event Data Format

Events in `events-metadata.json`:

```json
{
  "id": "2026-01-03-venue-name-city",
  "type": "RCQ",
  "date": "2026-01-03",
  "time": "10pm",
  "venue": "Store Name",
  "city": "City",
  "state": "IL",
  "format": "Standard",
  "notes": "2-slot",
  "qualificationPath": "US Regional Championship...",
  "address": "123 Main St, City, IL 12345",
  "coordinates": { "lat": 41.123, "lng": -87.456 },
  "website": "https://store-website.com",
  "eventLink": "https://event-registration.com"
}
```

## Enrichment Workflow

1. **Generate Queries**
   ```bash
   make enrich-prepare
   ```
   This outputs search queries for venues/events missing data.

2. **Search for Information**
   Use AI tools (Perplexity MCP) or manual web search to find:
   - Venue addresses
   - Store websites
   - Event registration links

3. **Create Results File**
   Create `enrichment-results.json` with found data.

4. **Apply Results**
   ```bash
   make enrich-apply
   ```
   This updates the metadata and auto-geocodes addresses.

5. **Deploy**
   ```bash
   make deploy-public
   make build
   ```

See [enrichment/README.md](enrichment/README.md) for detailed instructions.

## Configuration

User settings stored in localStorage:
- `mtg-event-config`: Location, distance unit
- `mtg-favorites`: Favorited event IDs
- `mtg-distance-cache`: Cached distance calculations

## Technologies

- **Vue 3**: Frontend framework
- **Vite**: Build tool and dev server
- **LZ-String**: URL compression for share links
- **OpenStreetMap Nominatim**: Geocoding (free, rate-limited)
- **LocalStorage**: Client-side persistence

## Browser Support

Modern browsers with support for:
- ES2020+ JavaScript
- CSS Variables and Grid
- Fetch API
- LocalStorage

## Development Tips

### Adding New Events
1. Edit `events.txt` with new event data
2. Run `make extract`
3. Run enrichment cycle if needed
4. Run `make deploy-public`

### Updating Components
- Components are in `src/components/`
- Styles use CSS variables defined in `src/styles/main.css`
- App state is managed in `App.vue`

### Debugging Distance Issues
1. Check if event has `coordinates`
2. Check if user location is set
3. Check browser console for geocoding errors

## Deployment

### Static Hosting (GitHub Pages, Netlify, etc.)
```bash
make build
# Deploy contents of dist/ folder
```

### Railway (as mentioned in context)
The app is a static site - deploy the `dist/` folder.

## License

MIT

---

For enrichment documentation, see [enrichment/README.md](enrichment/README.md)

For developer handoff, see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
