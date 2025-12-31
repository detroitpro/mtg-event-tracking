# Event Enrichment Guide

This guide explains how to enrich the `events-metadata.json` file with venue addresses, websites, and event links using web search tools.

## Overview

The enrichment process adds missing data to events:
- **Address**: Full street address of the venue
- **Coordinates**: Latitude/longitude (auto-calculated from address)
- **Website**: Store website or Facebook page
- **Event Link**: Tournament registration or event detail page

## Files

- `run-enrichment.js` - Generates search queries for venues/events needing enrichment
- `apply-enrichment.js` - Applies enrichment results to the metadata file
- `.enrichment-cache.json` - Cache to avoid re-searching same venues
- `enrichment-results.json` - Template for enrichment results

## Process

### Step 1: Generate Enrichment Queries

Run the preparation script to see what needs to be enriched:

```bash
yarn enrich:prepare 10
```

This will show:
- Venues needing addresses (with search queries)
- Events needing links (with search queries)

The number (10) limits how many to show. Omit for all.

### Step 2: Search for Information

Use Perplexity MCP or Browser MCP tools to search for:

1. **Venue Addresses**: Use the generated queries to find full addresses
2. **Venue Websites**: Find store websites or Facebook pages
3. **Event Links**: Find tournament registration or event detail pages

### Step 3: Create Results File

Create a JSON file with enrichment results:

```json
[
  {
    "type": "address",
    "venueKey": "Venue Name|City|State",
    "address": "123 Main St, City, State ZIP",
    "website": "https://example.com",
    "coordinates": null
  },
  {
    "type": "link",
    "eventId": "2026-01-02-venue-city",
    "link": "https://event-page.com"
  }
]
```

**Note**: Leave `coordinates` as `null` - they will be auto-calculated from the address.

### Step 4: Apply Enrichment

Apply the results to the metadata file:

```bash
yarn enrich:apply enrichment-results.json
```

This will:
- Update all events with the same venue
- Geocode addresses to get coordinates
- Update the cache to avoid re-searching
- Save the updated metadata file

## Example Workflow

1. **Generate queries**:
   ```bash
   yarn enrich:prepare 5
   ```

2. **Search using MCP tools** (or manually):
   - Use Perplexity to search for venue addresses
   - Use Browser MCP to find websites
   - Search for event registration pages

3. **Create results file** (`my-results.json`):
   ```json
   [
     {
       "type": "address",
       "venueKey": "Amazing Fantasy Books and Comics|Frankfort|IL",
       "address": "20505 S La Grange Rd, Frankfort, IL 60423",
       "website": "http://afbooks.com"
     }
   ]
   ```

4. **Apply enrichment**:
   ```bash
   yarn enrich:apply my-results.json
   ```

## Batch Processing

To enrich many events:

1. Generate queries in batches (e.g., 10 at a time)
2. Search and create results files for each batch
3. Apply each results file sequentially
4. The cache prevents duplicate searches

## Cache

The `.enrichment-cache.json` file stores:
- Previously found addresses
- Previously found websites
- Previously found links
- Previously geocoded coordinates

This prevents re-searching the same venues and speeds up the process.

## Tips

- **Venue addresses**: Search for "full street address of [venue] in [city], [state]"
- **Websites**: Search for "[venue] [city] [state] website" or "Facebook page"
- **Event links**: Search for "[venue] Magic tournament [date]" or "RCQ registration [city]"
- **Coordinates**: Automatically calculated from addresses using OpenStreetMap
- **Rate limiting**: Be respectful of API rate limits (1 second delay between geocoding requests)

## Troubleshooting

- **Address not found**: Try variations of the venue name or search for the store's website first
- **Geocoding fails**: The address might be incorrect or too vague - try a more specific search
- **Event link not found**: Many events don't have public registration pages - this is normal
- **Cache issues**: Delete `.enrichment-cache.json` to start fresh (but you'll re-search everything)
