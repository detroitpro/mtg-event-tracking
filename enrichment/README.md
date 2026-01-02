# Event Enrichment System

This folder contains scripts for enriching MTG event data with addresses, coordinates, websites, and event links.

## Overview

The enrichment system is designed to work with AI assistants (like Perplexity MCP) to find missing event information. It's a semi-automated process where:

1. **`prepare.js`** generates search queries for venues/events needing data
2. **AI/Human** searches for the information using web tools
3. **Results are saved** to `enrichment/results.json`
4. **`apply.js`** applies the results to the metadata
5. **`geocode.js`** batch-geocodes addresses to coordinates

All scripts work directly with `public/events-metadata.json` - no need to copy files.

## Scripts

### `extract.js` - Event Extraction (IDEMPOTENT)

Parses `events.txt` and **merges** with existing event data. This is idempotent:
- **New events** are added
- **Existing events** are updated (enrichment data is preserved)
- **Events not in events.txt** are kept (manually added events stay)
- Running multiple times produces the same result

```bash
# Extract/merge events
node enrichment/extract.js
# or
make extract
```

**Input:** `events.txt` (project root)
**Output:** `public/events-metadata.json` (merged)

**Safe to run repeatedly** - won't delete events or lose enrichment data.

### `prepare.js` - Generate Enrichment Queries

Generates search queries for venues and events needing data.

```bash
# Generate 10 queries (default)
node enrichment/prepare.js

# Generate specific number of queries
node enrichment/prepare.js 50

# Using make
make enrich-prepare
make enrich-prepare-50
make enrich-prepare-all
```

**Output:** Displays search queries and instructions for creating `enrichment-results.json`

### `apply.js` - Apply Enrichment Results

Applies enrichment data from a JSON file to the metadata.

```bash
# Apply results (default: enrichment/results.json)
node enrichment/apply.js

# Apply from specific file
node enrichment/apply.js path/to/results.json

# Using make
make enrich-apply
make enrich-apply FILE=path/to/results.json
```

**Features:**
- Updates all events at matching venues (addresses/websites apply to all)
- Automatically geocodes addresses to get coordinates
- Updates the enrichment cache to avoid duplicate work
- Copies store websites as fallback event links

### `geocode.js` - Batch Geocoding

Geocodes all events that have addresses but missing coordinates.

```bash
node enrichment/geocode.js
# or
make enrich-geocode
```

**Geocoding strategies (in order):**
1. Full address (best precision)
2. Simplified address (without suite/unit numbers)
3. City + State fallback (city center)

**Rate limiting:** 1 request per second (Nominatim requirement)

## Enrichment Results Format

Create `enrichment/results.json` with this format:

```json
[
  {
    "type": "address",
    "venueKey": "Venue Name|City|State",
    "address": "123 Main St, City, State ZIP",
    "website": "https://website.com",
    "coordinates": null
  },
  {
    "type": "link",
    "eventId": "2026-01-03-venue-city",
    "link": "https://event-page.com"
  }
]
```

### Important Notes

- **venueKey format:** `"Venue Name|City|State"` (use pipe `|` separator)
- **venueKey must match exactly:** Case-sensitive, must match the metadata
- **eventId format:** Matches the `id` field in `events-metadata.json`
- **coordinates:** Always set to `null` - they're auto-calculated from address
- **Skip entries:** If info can't be found, simply don't include it

## Files

| File | Purpose |
|------|---------|
| `extract.js` | Parse events.txt → public/events-metadata.json |
| `prepare.js` | Generate search queries |
| `apply.js` | Apply enrichment results |
| `geocode.js` | Batch geocode addresses |
| `results.json` | Enrichment results (manual input) |
| `.cache.json` | Enrichment cache (auto-generated) |
| `README.md` | This documentation |

### File Purposes

- **`results.json`** - You create this file with search results. It's the input for `apply.js`.
- **`.cache.json`** - Auto-generated. Stores previously found addresses/websites to avoid re-searching.

## Cache System

The `.cache.json` file stores previously found data:

```json
{
  "addresses": { "Venue|City|State": "123 Main St..." },
  "websites": { "Venue|City|State": "https://..." },
  "links": { "event-id": "https://..." },
  "coordinates": { "Venue|City|State": { "lat": 41.0, "lng": -87.0 } }
}
```

This prevents re-searching for the same venues and speeds up the process.

## Typical Workflow

### Initial Setup (new data source)

```bash
# 1. Put raw event data in events.txt
# 2. Extract to JSON
make extract

# 3. Check status
make status
```

### Enrichment Cycle

```bash
# 1. Generate queries
make enrich-prepare

# 2. Use AI/web to search for info
# 3. Create enrichment/results.json with findings

# 4. Apply results
make enrich-apply

# 5. Geocode remaining events
make enrich-geocode

# 6. Rebuild app (if deploying)
make build
```

### Quick Status Check

```bash
make status
```

## Troubleshooting

### "No events found for this venue"
- Check venueKey format: `"Venue Name|City|State"` (pipe separator)
- Verify spelling matches exactly (case-sensitive)

### Geocoding fails
- The address might be incorrect or too vague
- Try simplifying the address manually
- Check if the location is in the US

### Cache issues
- Delete `.cache.json` to start fresh
- Warning: You'll re-search everything

### Events not updating
- Check if events already have the data (won't overwrite)
- Verify the eventId matches exactly

## API Rate Limits

- **Nominatim (OpenStreetMap):** 1 request/second
- Scripts automatically respect rate limits
- For bulk operations, expect ~1 hour per 1000 addresses
