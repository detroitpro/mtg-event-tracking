#!/usr/bin/env node
/**
 * Apply enrichment results to metadata file
 * 
 * Usage: node apply-enrichment.js <results-json>
 * 
 * Results JSON format:
 * [
 *   {
 *     "type": "address",
 *     "venueKey": "Venue Name|City|State",
 *     "address": "123 Main St, City, State ZIP",
 *     "website": "https://...",
 *     "coordinates": { "lat": 41.xxx, "lng": -87.xxx }
 *   },
 *   {
 *     "type": "link",
 *     "eventId": "event-id",
 *     "link": "https://..."
 *   }
 * ]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { geocodeAddress } from './enrich-with-mcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_FILE = path.join(__dirname, 'events-metadata.json');
const CACHE_FILE = path.join(__dirname, '.enrichment-cache.json');

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

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

async function applyEnrichment(results) {
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const cache = loadCache();
  let updated = 0;
  let addressUpdated = 0;
  let websiteUpdated = 0;
  let coordinatesUpdated = 0;
  let linkUpdated = 0;
  
  for (const result of results) {
    if (result.type === 'address') {
      const [venue, city, state] = result.venueKey.split('|');
      console.log(`\nProcessing: ${venue}, ${city}, ${state}`);
      
      // Find all events with this venue
      const matchingEvents = data.events.filter(
        e => e.venue === venue && e.city === city && e.state === state
      );
      
      if (matchingEvents.length === 0) {
        console.log(`  ⚠ No events found matching: ${venue}, ${city}, ${state}`);
        continue;
      }
      
      console.log(`  Found ${matchingEvents.length} event(s)`);
      
      // Update addresses
      if (result.address) {
        for (const event of matchingEvents) {
          if (!event.address) {
            event.address = result.address;
            addressUpdated++;
            updated++;
            console.log(`  ✓ Updated address for event: ${event.id}`);
          } else if (event.address !== result.address) {
            console.log(`  ℹ Event ${event.id} already has address: ${event.address}`);
          }
        }
      }
      
      // Update websites
      if (result.website) {
        for (const event of matchingEvents) {
          if (!event.website) {
            event.website = result.website;
            websiteUpdated++;
            updated++;
            console.log(`  ✓ Updated website for event: ${event.id}`);
          } else if (event.website !== result.website) {
            console.log(`  ℹ Event ${event.id} already has website: ${event.website}`);
          }
        }
      }
      
      // Get coordinates if address provided but coordinates missing
      let coordsToUse = result.coordinates;
      const addressToGeocode = result.address || matchingEvents[0]?.address;
      
      if (addressToGeocode && !coordsToUse) {
        // Check if any event needs coordinates
        const needsCoords = matchingEvents.some(e => !e.coordinates);
        if (needsCoords) {
          console.log(`  Geocoding: ${addressToGeocode}`);
          const coords = await geocodeAddress(addressToGeocode);
          if (coords) {
            coordsToUse = coords;
            console.log(`  ✓ Found coordinates: ${coords.lat}, ${coords.lng}`);
          } else {
            console.log(`  ✗ Geocoding failed - trying simplified address...`);
            // Try without suite number
            const simplified = addressToGeocode.replace(/,?\s*Suite\s+\d+/i, '');
            if (simplified !== addressToGeocode) {
              const coords2 = await geocodeAddress(simplified);
              if (coords2) {
                coordsToUse = coords2;
                console.log(`  ✓ Found coordinates with simplified address: ${coords2.lat}, ${coords2.lng}`);
              }
            }
          }
        }
      }
      
      // Update events with coordinates
      if (coordsToUse) {
        for (const event of matchingEvents) {
          if (!event.coordinates) {
            event.coordinates = coordsToUse;
            coordinatesUpdated++;
            updated++;
            console.log(`  ✓ Updated coordinates for event: ${event.id}`);
          }
        }
      }
      
      // Update cache
      if (result.address) {
        cache.addresses[result.venueKey] = result.address;
      }
      if (coordsToUse) {
        cache.coordinates[result.venueKey] = coordsToUse;
      }
      if (result.website) {
        cache.websites[result.venueKey] = result.website;
      }
      
    } else if (result.type === 'link') {
      const event = data.events.find(e => e.id === result.eventId);
      if (event && result.link) {
        // Always update if we have a link (even if one exists, prefer the new one)
        if (!event.eventLink || result.link !== event.eventLink) {
          event.eventLink = result.link;
          linkUpdated++;
          updated++;
          console.log(`  ✓ Updated event link for event: ${event.id}`);
        }
      }
      if (result.link) {
        cache.links[result.eventId] = result.link;
      }
    }
  }
  
  // Use store website as fallback for eventLink if no specific event page was found
  console.log(`\nSetting store websites as fallback for events without event links...`);
  let fallbackLinksAdded = 0;
  for (const event of data.events) {
    if (!event.eventLink && event.website) {
      event.eventLink = event.website;
      fallbackLinksAdded++;
      updated++;
    }
  }
  if (fallbackLinksAdded > 0) {
    console.log(`  ✓ Added ${fallbackLinksAdded} store websites as event links (fallback)`);
  }
  
  // Save
  data.metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  saveCache(cache);
  
  // Detailed output
  console.log(`\n✓ Enrichment complete:`);
  if (addressUpdated > 0) console.log(`  - Addresses updated: ${addressUpdated}`);
  if (websiteUpdated > 0) console.log(`  - Websites updated: ${websiteUpdated}`);
  if (coordinatesUpdated > 0) console.log(`  - Coordinates updated: ${coordinatesUpdated}`);
  if (linkUpdated > 0) console.log(`  - Event links updated: ${linkUpdated}`);
  if (fallbackLinksAdded > 0) console.log(`  - Fallback links (store websites) added: ${fallbackLinksAdded}`);
  console.log(`  - Total fields updated: ${updated}`);
  
  return updated;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.length < 3) {
    console.error('Usage: node apply-enrichment.js <results-json-file>');
    process.exit(1);
  }
  
  const resultsFile = process.argv[2];
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  
  applyEnrichment(results).then(() => {
    console.log('✓ Enrichment applied successfully');
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { applyEnrichment };
