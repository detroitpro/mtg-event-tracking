#!/usr/bin/env node
/**
 * Enrichment Apply Script
 * 
 * Applies enrichment results from a JSON file to the events metadata.
 * Automatically geocodes addresses to get coordinates.
 * 
 * Usage: node enrichment/apply.js <results-json-file>
 * 
 * Results JSON format:
 * [
 *   {
 *     "type": "address",
 *     "venueKey": "Venue Name|City|State",
 *     "address": "123 Main St, City, State ZIP",
 *     "website": "https://...",
 *     "coordinates": null  // Will be auto-calculated
 *   },
 *   {
 *     "type": "link",
 *     "eventId": "2026-01-03-venue-city",
 *     "link": "https://..."
 *   }
 * ]
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
const DEFAULT_RESULTS_FILE = path.join(__dirname, 'results.json');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100; // Nominatim requires 1 request per second

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
 * Sleep for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geocode an address using OpenStreetMap Nominatim
 */
async function geocodeAddress(address) {
  if (!address) return null;
  
  try {
    const query = encodeURIComponent(address);
    const url = `${NOMINATIM_URL}?q=${query}&format=json&limit=1&countrycodes=us`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MTG Event Planner/1.0 (enrichment script)' }
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
    console.error(`  ✗ Geocoding error: ${error.message}`);
    return null;
  }
}

/**
 * Try geocoding with different variations of the address
 */
async function geocodeWithFallback(address) {
  // Try 1: Full address
  let coords = await geocodeAddress(address);
  if (coords) return { coords, method: 'full address' };
  
  await sleep(RATE_LIMIT_MS);
  
  // Try 2: Without suite/unit numbers
  const simplified = address
    .replace(/,?\s*(Suite|Ste|Unit|#|Apt|Mailbox)\s*[A-Za-z0-9-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (simplified !== address) {
    coords = await geocodeAddress(simplified);
    if (coords) return { coords, method: 'simplified address' };
    await sleep(RATE_LIMIT_MS);
  }
  
  return null;
}

/**
 * Apply enrichment results to metadata
 */
async function applyEnrichment(resultsFile = DEFAULT_RESULTS_FILE) {
  // Load results
  if (!fs.existsSync(resultsFile)) {
    console.error(`Error: Results file not found: ${resultsFile}`);
    console.error(`Expected location: ${resultsFile}`);
    console.error(`\nCreate enrichment/results.json with your search results.`);
    process.exit(1);
  }
  
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  
  // Load metadata
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(`Error: Metadata file not found: ${METADATA_FILE}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const cache = loadCache();
  
  // Statistics
  let stats = {
    addressesUpdated: 0,
    websitesUpdated: 0,
    coordinatesUpdated: 0,
    linksUpdated: 0,
    fallbackLinksAdded: 0,
    errors: 0
  };
  
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║             MTG Event Enrichment - Apply Results              ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
  
  console.log(`📁 Processing ${results.length} enrichment entries...\n`);
  
  for (const result of results) {
    if (result.type === 'address') {
      const [venue, city, state] = result.venueKey.split('|');
      console.log(`🏪 Processing: ${venue}, ${city}, ${state}`);
      
      // Find matching events
      const matchingEvents = data.events.filter(
        e => e.venue === venue && e.city === city && e.state === state
      );
      
      if (matchingEvents.length === 0) {
        console.log(`  ⚠️  No events found for this venue`);
        stats.errors++;
        continue;
      }
      
      console.log(`   Found ${matchingEvents.length} event(s)`);
      
      // Update addresses
      if (result.address) {
        for (const event of matchingEvents) {
          if (!event.address) {
            event.address = result.address;
            stats.addressesUpdated++;
          }
        }
        cache.addresses[result.venueKey] = result.address;
        console.log(`   ✓ Address: ${result.address}`);
      }
      
      // Update websites
      if (result.website) {
        for (const event of matchingEvents) {
          if (!event.website) {
            event.website = result.website;
            stats.websitesUpdated++;
          }
        }
        cache.websites[result.venueKey] = result.website;
        console.log(`   ✓ Website: ${result.website}`);
      }
      
      // Geocode if needed
      let coordsToUse = result.coordinates;
      const addressToGeocode = result.address || matchingEvents[0]?.address;
      
      if (addressToGeocode && !coordsToUse) {
        const needsCoords = matchingEvents.some(e => !e.coordinates);
        if (needsCoords) {
          console.log(`   🌍 Geocoding: ${addressToGeocode}`);
          const geoResult = await geocodeWithFallback(addressToGeocode);
          if (geoResult) {
            coordsToUse = geoResult.coords;
            console.log(`   ✓ Coordinates (${geoResult.method}): ${coordsToUse.lat.toFixed(4)}, ${coordsToUse.lng.toFixed(4)}`);
            await sleep(RATE_LIMIT_MS);
          } else {
            console.log(`   ✗ Geocoding failed`);
          }
        }
      }
      
      // Update coordinates
      if (coordsToUse) {
        for (const event of matchingEvents) {
          if (!event.coordinates) {
            event.coordinates = coordsToUse;
            stats.coordinatesUpdated++;
          }
        }
        cache.coordinates[result.venueKey] = coordsToUse;
      }
      
      console.log(``);
      
    } else if (result.type === 'link') {
      const event = data.events.find(e => e.id === result.eventId);
      if (event && result.link) {
        if (!event.eventLink || event.eventLink !== result.link) {
          event.eventLink = result.link;
          stats.linksUpdated++;
          console.log(`🔗 Link updated: ${result.eventId}`);
        }
        cache.links[result.eventId] = result.link;
      }
    }
  }
  
  // Use store website as fallback for events without event links
  console.log(`\n📎 Setting store websites as fallback event links...`);
  for (const event of data.events) {
    if (!event.eventLink && event.website) {
      event.eventLink = event.website;
      stats.fallbackLinksAdded++;
    }
  }
  if (stats.fallbackLinksAdded > 0) {
    console.log(`   ✓ Added ${stats.fallbackLinksAdded} fallback links`);
  }
  
  // Save everything
  data.metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n📁 Updated: ${METADATA_FILE}`);
  
  saveCache(cache);
  
  // Print summary
  console.log(`\n${'═'.repeat(68)}`);
  console.log(`\n✅ ENRICHMENT COMPLETE\n`);
  console.log(`   📍 Addresses updated:    ${stats.addressesUpdated}`);
  console.log(`   🌐 Websites updated:     ${stats.websitesUpdated}`);
  console.log(`   🌍 Coordinates updated:  ${stats.coordinatesUpdated}`);
  console.log(`   🔗 Event links updated:  ${stats.linksUpdated}`);
  console.log(`   📎 Fallback links added: ${stats.fallbackLinksAdded}`);
  if (stats.errors > 0) {
    console.log(`   ⚠️  Errors/warnings:     ${stats.errors}`);
  }
  
  const total = stats.addressesUpdated + stats.websitesUpdated + 
                stats.coordinatesUpdated + stats.linksUpdated + stats.fallbackLinksAdded;
  console.log(`\n   📊 Total fields updated: ${total}`);
  console.log(`\n📌 Next step: Run 'make enrich-geocode' to geocode remaining events\n`);
  
  return stats;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  // Use provided file or default to enrichment/results.json
  const resultsFile = process.argv[2] || DEFAULT_RESULTS_FILE;
  
  applyEnrichment(resultsFile).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { applyEnrichment, geocodeAddress, loadCache, saveCache };
