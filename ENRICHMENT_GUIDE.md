# Event Enrichment Scripts - Complete Guide

## Overview

The enrichment system consists of **two separate scripts** that work together:

1. **`run-enrichment.js`** - Generates search queries (does NOT use MCP directly)
2. **`apply-enrichment.js`** - Applies enrichment results to metadata (does NOT use MCP directly)

**Important**: Neither script directly calls MCP tools. Instead, you (or an AI assistant) use MCP tools to search for information, then create a JSON file with the results, which `apply-enrichment.js` processes.

## How It Works

```
┌─────────────────────┐
│ run-enrichment.js   │  → Generates queries for venues/events needing data
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ You/AI Assistant    │  → Use MCP tools (Perplexity/Browser) to search
│ with MCP tools      │     for addresses, websites, event links
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Create JSON file    │  → Save search results in enrichment-results.json
│ with results        │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ apply-enrichment.js │  → Reads JSON, updates events-metadata.json
└─────────────────────┘
```

## Script Details

### 1. `run-enrichment.js` - Generate Queries

**What it does:**
- Reads `events-metadata.json`
- Finds venues missing addresses
- Finds events missing links
- Generates ready-to-use search queries
- **Does NOT use MCP tools** - just generates queries

**Usage:**
```bash
yarn enrich:prepare 10
# or
node run-enrichment.js 10
```

**Output:**
- Lists venues needing addresses with search queries
- Lists events needing links with search queries
- The number (10) limits how many to show

**Example output:**
```
=== Enrichment Queries ===

Venues needing addresses (3):

1. Tier 1 Games, Kokomo, IN
   Query: "What is the full street address of Tier 1 Games in Kokomo, IN? ..."
   Website Query: "What is the website or Facebook page for Tier 1 Games..."
```

### 2. `apply-enrichment.js` - Apply Results

**What it does:**
- Reads a JSON file with enrichment results
- Updates `events-metadata.json` with addresses, websites, coordinates, links
- Auto-geocodes addresses to get coordinates (uses OpenStreetMap, not MCP)
- Updates cache to avoid duplicate work
- **Does NOT use MCP tools** - only processes JSON results

**Usage:**
```bash
yarn enrich:apply enrichment-results.json
# or
node apply-enrichment.js enrichment-results.json
```

**What it updates:**
- Addresses for all events at the same venue
- Websites for all events at the same venue
- Coordinates (auto-calculated from addresses)
- Event links (specific to each event)

## Complete Workflow

### Step 1: Generate Queries

```bash
yarn enrich:prepare 5
```

This shows you 5 venues/events that need enrichment with ready-to-use queries.

### Step 2: Search Using MCP Tools

**Option A: Use AI Assistant (Recommended)**
Ask the AI assistant to search using Perplexity MCP:
- "Search for the address of Tier 1 Games in Kokomo, IN"
- "Find the website for Empire Comics in New Albany, IN"

**Option B: Manual Search**
Use the generated queries to search manually on Google, etc.

### Step 3: Create Results JSON File

Create or update `enrichment-results.json` with your findings:

```json
[
  {
    "type": "address",
    "venueKey": "Tier 1 Games|Kokomo|IN",
    "address": "123 Main St, Kokomo, IN 46901",
    "website": "https://tier1games.com",
    "coordinates": null
  },
  {
    "type": "address",
    "venueKey": "Empire Comics|New Albany|IN",
    "address": "456 Oak Ave, New Albany, IN 47150",
    "website": "https://empirecomics.com",
    "coordinates": null
  },
  {
    "type": "link",
    "eventId": "2026-01-03-tier-1-games-kokomo",
    "link": "https://tier1games.com/events/rcq-jan-3"
  }
]
```

**Important Notes:**
- `venueKey` format: `"Venue Name|City|State"` (use pipe `|` separator)
- `eventId` format: matches the `id` field in events-metadata.json
- Set `coordinates` to `null` - they'll be auto-calculated
- You can include just address, just website, or both

### Step 4: Apply Enrichment

```bash
yarn enrich:apply enrichment-results.json
```

This will:
- Update all events with matching venues
- Geocode addresses to get coordinates
- Show detailed output of what was updated
- Save the updated metadata file

**Example output:**
```
Processing: Tier 1 Games, Kokomo, IN
  Found 1 event(s)
  ✓ Updated address for event: 2026-01-03-tier-1-games-kokomo
  ✓ Updated website for event: 2026-01-03-tier-1-games-kokomo
  Geocoding: 123 Main St, Kokomo, IN 46901
  ✓ Found coordinates: 40.4864, -86.1336
  ✓ Updated coordinates for event: 2026-01-03-tier-1-games-kokomo
✓ Enrichment complete:
  - Addresses updated: 1
  - Websites updated: 1
  - Coordinates updated: 1
  - Total fields updated: 3
```

## Using MCP Tools (AI Assistant)

When working with an AI assistant that has MCP tools:

1. **Generate queries:**
   ```
   Run: yarn enrich:prepare 10
   ```

2. **Ask AI to search:**
   ```
   "Use Perplexity MCP to search for the address of Tier 1 Games in Kokomo, IN"
   "Find the website for Empire Comics in New Albany, IN"
   ```

3. **AI creates results file:**
   The AI can create `enrichment-results.json` with the findings

4. **Apply results:**
   ```
   yarn enrich:apply enrichment-results.json
   ```

## File Formats

### enrichment-results.json Format

```json
[
  {
    "type": "address",
    "venueKey": "Venue Name|City|State",
    "address": "Full street address",
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

### Finding Event IDs

Event IDs are in the format: `YYYY-MM-DD-venue-name-city`

To find an event ID:
1. Look in `events-metadata.json`
2. Or use the event date + venue name + city (lowercase, spaces to hyphens)

Example: `2026-01-03-tier-1-games-kokomo`

## Tips & Best Practices

1. **Process in batches**: Don't try to enrich all 240 events at once. Do 10-20 at a time.

2. **Check cache**: The `.enrichment-cache.json` file tracks what's been searched. If a venue is in the cache, `run-enrichment.js` won't show it again.

3. **Coordinates are auto-calculated**: You don't need to provide coordinates - just addresses. The script will geocode them automatically.

4. **Address format**: Full addresses work best: "123 Main St, City, State ZIP"

5. **Website vs Event Link**:
   - `website`: Store's general website (applies to all events at that venue)
   - `eventLink`: Specific tournament/event page (unique per event)

6. **Geocoding fallback**: If geocoding fails with suite numbers, the script tries without them automatically.

## Troubleshooting

**"Updated 0 events"**
- Check if events already have the data you're trying to add
- Verify the `venueKey` format matches exactly (case-sensitive)
- Check that events exist in the metadata file

**Geocoding fails**
- The script tries a simplified address automatically
- If still failing, the address might be incorrect or too vague
- You can manually add coordinates to the JSON if needed

**No events found**
- Verify venue name, city, and state match exactly (case-sensitive)
- Check for typos in the venueKey

**Cache issues**
- Delete `.enrichment-cache.json` to start fresh
- But you'll re-search everything

## Example: Complete Session

```bash
# 1. Generate queries for 3 venues
$ yarn enrich:prepare 3

# Output shows:
# - Tier 1 Games, Kokomo, IN
# - Empire Comics, New Albany, IN  
# - Super Hideaway Games, Holland, MI

# 2. Use AI/MCP to search (or search manually)
# AI searches and finds addresses/websites

# 3. Create enrichment-results.json with findings
# (AI or you create this file)

# 4. Apply the enrichment
$ yarn enrich:apply enrichment-results.json

# Output shows what was updated
```

## Summary

- **`run-enrichment.js`**: Generates queries (no MCP)
- **`apply-enrichment.js`**: Applies results (no MCP, but uses OpenStreetMap for geocoding)
- **MCP tools**: Used by you/AI assistant to search for information
- **Workflow**: Generate → Search (MCP) → Create JSON → Apply

The scripts are designed to work with MCP tools, but the MCP calls happen outside the scripts (by you or an AI assistant).
