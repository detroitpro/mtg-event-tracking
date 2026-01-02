#!/usr/bin/env node
/**
 * Enrichment Preparation Script
 * 
 * Generates search queries for venues and events that need enrichment.
 * This script outputs queries that can be used with AI tools (like Perplexity MCP)
 * to find missing addresses, websites, and event links.
 * 
 * Usage: node enrichment/prepare.js [limit]
 *   limit - Optional. Max number of queries to generate (default: 10)
 * 
 * Output: Displays search queries and instructions for creating enrichment-results.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const PROJECT_ROOT = path.join(__dirname, '..');
const METADATA_FILE = path.join(PROJECT_ROOT, 'public/events-metadata.json');
const CACHE_FILE = path.join(__dirname, '.cache.json');

/**
 * Load the enrichment cache
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading cache:', error.message);
  }
  return { addresses: {}, websites: {}, links: {}, coordinates: {} };
}

/**
 * Save the enrichment cache
 */
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Get unique venues that need address enrichment
 */
function getVenuesNeedingAddress(events, cache) {
  const venues = new Map();
  
  for (const event of events) {
    const key = `${event.venue}|${event.city}|${event.state}`;
    if (!event.address && !cache.addresses[key] && !venues.has(key)) {
      venues.set(key, {
        venue: event.venue,
        city: event.city,
        state: event.state,
        key: key,
        eventCount: events.filter(e => 
          e.venue === event.venue && e.city === event.city && e.state === event.state
        ).length
      });
    }
  }
  
  return Array.from(venues.values());
}

/**
 * Get events that need link enrichment
 */
function getEventsNeedingLinks(events, cache) {
  return events.filter(e => !e.eventLink && !cache.links[e.id]);
}

/**
 * Print instructions and queries for enrichment
 */
function printEnrichmentQueries(venuesNeedingAddress, eventsNeedingLinks) {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║           MTG Event Enrichment - Query Generator              ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

  console.log(`📋 INSTRUCTIONS FOR AI ASSISTANT\n`);
  console.log(`Use Perplexity MCP or web search to find the following information.`);
  console.log(`After searching, create a file called 'enrichment-results.json'.\n`);
  
  console.log(`📁 RESULTS FILE FORMAT:\n`);
  console.log(`[`);
  console.log(`  {`);
  console.log(`    "type": "address",`);
  console.log(`    "venueKey": "Venue Name|City|State",`);
  console.log(`    "address": "123 Main St, City, State ZIP",`);
  console.log(`    "website": "https://website.com",`);
  console.log(`    "coordinates": null`);
  console.log(`  },`);
  console.log(`  {`);
  console.log(`    "type": "link",`);
  console.log(`    "eventId": "2026-01-03-venue-city",`);
  console.log(`    "link": "https://event-page.com"`);
  console.log(`  }`);
  console.log(`]\n`);

  console.log(`⚠️  IMPORTANT:`);
  console.log(`   • venueKey format: "Venue Name|City|State" (pipe separator)`);
  console.log(`   • eventId must match the 'id' field in events-metadata.json`);
  console.log(`   • Set coordinates to null (auto-calculated from address)`);
  console.log(`   • Skip entries if info cannot be found\n`);
  
  console.log(`${'═'.repeat(68)}\n`);

  // Print venue queries
  if (venuesNeedingAddress.length > 0) {
    console.log(`🏪 VENUES NEEDING ADDRESSES (${venuesNeedingAddress.length} total)\n`);
    
    venuesNeedingAddress.forEach((v, i) => {
      console.log(`${i + 1}. ${v.venue}`);
      console.log(`   📍 Location: ${v.city}, ${v.state}`);
      console.log(`   🔑 VenueKey: ${v.key}`);
      console.log(`   📊 Events at venue: ${v.eventCount}`);
      console.log(`   🔍 Search: "What is the full street address of ${v.venue} in ${v.city}, ${v.state}?"`);
      console.log(`   🌐 Website: "What is the website for ${v.venue} ${v.city} ${v.state} MTG?"`);
      console.log(``);
    });
  } else {
    console.log(`✅ All venues have addresses!\n`);
  }

  // Print event link queries
  if (eventsNeedingLinks.length > 0) {
    console.log(`${'─'.repeat(68)}\n`);
    console.log(`🔗 EVENTS NEEDING LINKS (${eventsNeedingLinks.length} total)\n`);
    
    eventsNeedingLinks.forEach((e, i) => {
      console.log(`${i + 1}. ${e.venue} - ${e.date}`);
      console.log(`   📍 Location: ${e.city}, ${e.state}`);
      console.log(`   🎮 Format: ${e.format} (${e.type})`);
      console.log(`   🔑 EventId: ${e.id}`);
      console.log(`   🔍 Search: "Find registration or event page for ${e.type} at ${e.venue} ${e.city} ${e.state} ${e.date} Magic: The Gathering"`);
      console.log(``);
    });
  } else {
    console.log(`✅ All events have links!\n`);
  }

  console.log(`${'═'.repeat(68)}\n`);
  console.log(`📌 NEXT STEPS:`);
  console.log(`   1. Search for the information using AI tools or web search`);
  console.log(`   2. Create enrichment-results.json with the results`);
  console.log(`   3. Run: make enrich-apply   (or: node enrichment/apply.js enrichment-results.json)`);
  console.log(`   4. Run: make enrich-geocode (or: node enrichment/geocode.js)`);
  console.log(`   5. Copy public/events-metadata.json and rebuild the app\n`);
}

/**
 * Main function
 */
function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 10;
  
  // Load data
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(`Error: ${METADATA_FILE} not found`);
    console.error(`Run 'make extract' first to generate event metadata.`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const events = data.events || [];
  const cache = loadCache();
  
  console.log(`\n📊 Data Summary:`);
  console.log(`   Total events: ${events.length}`);
  console.log(`   Events with addresses: ${events.filter(e => e.address).length}`);
  console.log(`   Events with coordinates: ${events.filter(e => e.coordinates).length}`);
  console.log(`   Events with links: ${events.filter(e => e.eventLink).length}`);
  
  // Get items needing enrichment
  const venuesNeedingAddress = getVenuesNeedingAddress(events, cache).slice(0, limit);
  const eventsNeedingLinks = getEventsNeedingLinks(events, cache).slice(0, limit);
  
  if (venuesNeedingAddress.length === 0 && eventsNeedingLinks.length === 0) {
    console.log(`\n✅ All enrichment is complete! No queries needed.\n`);
    return;
  }
  
  printEnrichmentQueries(venuesNeedingAddress, eventsNeedingLinks);
}

// Run if called directly
main();

export { loadCache, saveCache, getVenuesNeedingAddress, getEventsNeedingLinks };
