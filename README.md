# MTG Event Planner

A web application to help plan and track Magic: The Gathering Pro Tour qualification events, including RCQ (Regional Championship Qualifiers), RC (Regional Championships), and Magic Spotlight Series events.

## Features

- **Event Filtering**: Filter events by type (RCQ, RC, Magic Spotlight), format (Standard, Limited, etc.), date range, location, and distance
- **Distance Calculation**: Calculate distances from your location to each event venue
- **Geocoding**: Automatically look up venue addresses using OpenStreetMap
- **Event Details**: View event information including qualification paths, formats, and notes
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Extract events from `events.txt`:
```bash
yarn extract
```

This will parse `events.txt` and generate `events-metadata.json` in the public folder.

3. (Optional) Enrich events with addresses and links:
```bash
# See ENRICHMENT.md for detailed instructions
yarn enrich:prepare 10  # Generate queries for 10 venues
# Use MCP tools to search, then:
yarn enrich:apply enrichment-results.json
```

4. Start the development server:
```bash
yarn dev
```

The application will open in your browser at `http://localhost:3000`.

## Usage

1. **Set Your Location**: When you first open the app, enter your city and state to enable distance calculations.

2. **Filter Events**: Use the filter panel to:
   - Select event types (RCQ, RC, Magic Spotlight, etc.)
   - Filter by format (Standard, Limited, Modern, etc.)
   - Set date ranges
   - Filter by location (state or city)
   - Set maximum distance from your location

3. **View Events**: Browse filtered events in the event list. Each event card shows:
   - Date and time
   - Venue name and location
   - Distance from your location (if coordinates are available)
   - Format and event type
   - Qualification path information

4. **Get Addresses**: Click "Get Address" on any event card to automatically look up the venue address using geocoding.

5. **Sort Events**: Use the sort dropdown to sort events by date, distance, or venue name.

## Project Structure

```
mtg-comp/
├── events.txt                 # Source event data
├── extract-events.js          # Parser script
├── events-metadata.json       # Parsed event data
├── run-enrichment.js          # Generate enrichment queries
├── apply-enrichment.js        # Apply enrichment results
├── index.html                 # Main HTML file
├── package.json              # Dependencies
├── vite.config.js            # Vite configuration
├── public/
│   └── events-metadata.json  # Event data (served to app)
└── src/
    ├── main.js               # Vue app entry point
    ├── App.vue               # Root component
    ├── components/
    │   ├── LocationConfig.vue    # User location setup
    │   ├── EventFilters.vue      # Filter controls
    │   ├── EventList.vue         # Event listing
    │   └── EventCard.vue         # Individual event display
    ├── utils/
    │   ├── geocoding.js       # Address lookup utilities
    │   ├── distance.js       # Distance calculation
    │   └── config.js         # Configuration management
    └── styles/
        └── main.css          # Global styles
```

## Updating Events

When `events.txt` is updated:

1. Run the extract script again:
```bash
yarn extract
```

2. The web app will automatically load the updated data on refresh.

## Enriching Events

To add addresses and links to events, see [ENRICHMENT.md](ENRICHMENT.md) for detailed instructions.

Quick start:
```bash
# 1. Generate queries
yarn enrich:prepare 10

# 2. Use MCP tools (Perplexity/Browser) to search for addresses and links

# 3. Create enrichment-results.json with your findings

# 4. Apply the enrichment
yarn enrich:apply enrichment-results.json
```

## Geocoding

The app uses OpenStreetMap Nominatim API for geocoding (free, no API key required). Rate limits apply:
- 1 request per second
- Results are cached to avoid repeated lookups

## Technologies

- **Vue 3**: Frontend framework
- **Vite**: Build tool and dev server
- **OpenStreetMap Nominatim**: Geocoding service
- **LocalStorage**: User configuration storage
- **Perplexity MCP**: Web search for enrichment

## Browser Support

Modern browsers that support:
- ES6+ JavaScript
- Fetch API
- LocalStorage
- CSS Grid and Flexbox

## License

MIT
