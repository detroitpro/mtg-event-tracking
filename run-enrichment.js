#!/usr/bin/env node
/**
 * Enrichment script that uses Perplexity MCP to find venue addresses and event links
 * 
 * This script should be run with the AI assistant to use MCP tools.
 * It processes events in batches and updates the metadata file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_FILE = path.join(__dirname, 'events-metadata.json');
const CACHE_FILE = path.join(__dirname, '.enrichment-cache.json');

// Load cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return { addresses: {}, websites: {}, links: {}, coordinates: {} };
}

// Save cache
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

// Geocode address
async function geocodeAddress(address) {
  if (!address) return null;
  
  try {
    const query = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MTG Event Planner/1.0' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error(`Geocoding error:`, error);
    return null;
  }
}

// Get unique venues
function getUniqueVenues(events) {
  const venues = new Map();
  
  for (const event of events) {
    const key = `${event.venue}|${event.city}|${event.state}`;
    if (!event.address && !venues.has(key)) {
      venues.set(key, {
        venue: event.venue,
        city: event.city,
        state: event.state,
        key: key,
        events: []
      });
    }
    if (venues.has(key)) {
      venues.get(key).events.push(event);
    }
  }
  
  return Array.from(venues.values());
}

// Main function - generates search queries for MCP tools
function generateEnrichmentQueries(limit = 10) {
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const events = data.events || [];
  const cache = loadCache();
  
  // Get venues needing addresses
  const venuesNeedingAddress = getUniqueVenues(events)
    .filter(v => !cache.addresses[v.key])
    .slice(0, limit);
  
  // Get events needing links
  const eventsNeedingLinks = events
    .filter(e => !e.eventLink && !cache.links[e.id])
    .slice(0, limit);
  
  // Output instructions for AI assistant
  console.log(`=== ENRICHMENT INSTRUCTIONS FOR AI ASSISTANT ===\n`);
  console.log(`Use Perplexity MCP or Browser MCP tools to search for the following information.\n`);
  console.log(`After searching, create a file called 'enrichment-results.json' with the results.\n`);
  console.log(`For event links: Search for ANY page with event information - registration pages, event calendars,`);
  console.log(`event detail pages, or even the store's general website if it has event information.\n`);
  console.log(`File format:`);
  console.log(`[`);
  console.log(`  {`);
  console.log(`    "type": "address",`);
  console.log(`    "venueKey": "Venue Name|City|State",`);
  console.log(`    "address": "Full street address with zip code",`);
  console.log(`    "website": "https://website.com (optional)",`);
  console.log(`    "coordinates": null`);
  console.log(`  },`);
  console.log(`  {`);
  console.log(`    "type": "link",`);
  console.log(`    "eventId": "event-id-from-metadata",`);
  console.log(`    "link": "https://event-details-page.com (can be registration page, event calendar, store website, or any page with event information)"`);
  console.log(`  }`);
  console.log(`]\n`);
  console.log(`Important:`);
  console.log(`- venueKey format: "Venue Name|City|State" (use pipe | separator)`);
  console.log(`- eventId matches the 'id' field in events-metadata.json`);
  console.log(`- Always set coordinates to null (they'll be auto-calculated)`);
  console.log(`- For event links: Prefer registration pages, but also accept event calendars, event detail pages, or store websites with event information`);
  console.log(`- If you can't find an address/website/link, skip that entry\n`);
  console.log(`=== QUERIES TO SEARCH ===\n`);
  
  // Output only queries
  if (venuesNeedingAddress.length > 0) {
    console.log(`VENUES NEEDING ADDRESSES (${venuesNeedingAddress.length}):\n`);
    venuesNeedingAddress.forEach((v, i) => {
      console.log(`${i + 1}. Venue: ${v.venue}, ${v.city}, ${v.state}`);
      console.log(`   VenueKey: ${v.key}`);
      console.log(`   Address Query: "What is the full street address of ${v.venue} in ${v.city}, ${v.state}? Please provide complete address with street, city, state, and zip code."`);
      console.log(`   Website Query: "What is the website or Facebook page for ${v.venue} in ${v.city}, ${v.state}? Do they host Magic: The Gathering tournaments?"`);
      console.log(``);
    });
  }
  
  if (eventsNeedingLinks.length > 0) {
    console.log(`EVENTS NEEDING LINKS (${eventsNeedingLinks.length}):\n`);
    eventsNeedingLinks.forEach((e, i) => {
      console.log(`${i + 1}. Event: ${e.venue}, ${e.city}, ${e.state} - ${e.date} (${e.format})`);
      console.log(`   EventId: ${e.id}`);
      console.log(`   Link Query: "Find event details page, registration page, event calendar, or store website for ${e.type} tournament at ${e.venue} in ${e.city}, ${e.state} on ${e.date} for ${e.format} format Magic: The Gathering. Include any page with event information, registration, or the store's general event calendar."`);
      console.log(``);
    });
  }
  
  if (venuesNeedingAddress.length === 0 && eventsNeedingLinks.length === 0) {
    console.log(`No venues or events need enrichment. All data is up to date!`);
  }
  
  console.log(`\n=== AFTER SEARCHING ===`);
  console.log(`Once you've created enrichment-results.json, run:`);
  console.log(`yarn enrich:apply enrichment-results.json`);
  
  return {
    venuesNeedingAddress,
    eventsNeedingLinks,
    data,
    cache
  };
}

// Update metadata with enrichment results
function updateMetadata(results) {
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const cache = loadCache();
  let updated = 0;
  
  for (const result of results) {
    if (result.type === 'address') {
      const [venue, city, state] = result.venueKey.split('|');
      
      // Update all events with this venue
      for (const event of data.events) {
        if (event.venue === venue && event.city === city && event.state === state) {
          if (result.address && !event.address) {
            event.address = result.address;
            updated++;
          }
          if (result.coordinates && !event.coordinates) {
            event.coordinates = result.coordinates;
          }
          if (result.website && !event.website) {
            event.website = result.website;
          }
        }
      }
      
      // Update cache
      cache.addresses[result.venueKey] = result.address;
      if (result.coordinates) {
        cache.coordinates[result.venueKey] = result.coordinates;
      }
      if (result.website) {
        cache.websites[result.venueKey] = result.website;
      }
      
    } else if (result.type === 'link') {
      const event = data.events.find(e => e.id === result.eventId);
      if (event && result.link && !event.eventLink) {
        event.eventLink = result.link;
        updated++;
      }
      cache.links[result.eventId] = result.link;
    }
  }
  
  // Save
  data.metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  saveCache(cache);
  
  console.log(`\n✓ Updated ${updated} events in metadata`);
  return updated;
}

// Export
export { generateEnrichmentQueries, updateMetadata, geocodeAddress, loadCache };

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 10;
  generateEnrichmentQueries(limit);
}
