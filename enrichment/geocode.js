#!/usr/bin/env node
/**
 * Batch Geocoding Script
 * 
 * Geocodes all events that have addresses but are missing coordinates.
 * Uses OpenStreetMap Nominatim API with automatic fallback strategies.
 * 
 * Usage: node enrichment/geocode.js
 * 
 * Strategies:
 * 1. Full address (best precision)
 * 2. Simplified address (without suite/unit numbers)
 * 3. City + State fallback (city center)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const PROJECT_ROOT = path.join(__dirname, '..');
const METADATA_FILE = path.join(PROJECT_ROOT, 'public/events-metadata.json');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100; // Nominatim requires 1 request per second

/**
 * Sleep for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a geocoding request
 */
async function geocodeQuery(query) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MTG Event Planner/1.0 (geocoding script)'
      }
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
    return null;
  }
}

/**
 * Try multiple geocoding strategies for an event
 */
async function geocodeEvent(event) {
  // Strategy 1: Full address
  if (event.address) {
    const coords = await geocodeQuery(event.address);
    if (coords) {
      return { coords, method: 'full address' };
    }
    await sleep(RATE_LIMIT_MS);
  }
  
  // Strategy 2: Simplified address (remove suite/unit info)
  if (event.address) {
    const simplified = event.address
      .replace(/,?\s*(Suite|Ste|Unit|#|Apt|Mailbox)\s*[A-Za-z0-9-]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (simplified !== event.address) {
      const coords = await geocodeQuery(simplified);
      if (coords) {
        return { coords, method: 'simplified address' };
      }
      await sleep(RATE_LIMIT_MS);
    }
  }
  
  // Strategy 3: City + State fallback
  if (event.city && event.state) {
    const cityQuery = `${event.city}, ${event.state}`;
    const coords = await geocodeQuery(cityQuery);
    if (coords) {
      return { coords, method: 'city center' };
    }
  }
  
  return null;
}

/**
 * Main geocoding function
 */
async function main() {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║             MTG Event Enrichment - Batch Geocoder             ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
  
  // Load metadata file
  if (!fs.existsSync(METADATA_FILE)) {
    console.error(`Error: Metadata file not found: ${METADATA_FILE}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  
  // Find events needing geocoding
  const eventsToGeocode = data.events.filter(e => e.address && !e.coordinates);
  
  if (eventsToGeocode.length === 0) {
    console.log(`✅ All events with addresses have coordinates!\n`);
    
    // Show stats
    const withCoords = data.events.filter(e => e.coordinates).length;
    const withAddress = data.events.filter(e => e.address).length;
    console.log(`📊 Statistics:`);
    console.log(`   Total events: ${data.events.length}`);
    console.log(`   With coordinates: ${withCoords}`);
    console.log(`   With addresses: ${withAddress}`);
    console.log(`   Missing addresses: ${data.events.length - withAddress}\n`);
    return;
  }
  
  console.log(`📍 Found ${eventsToGeocode.length} events needing geocoding\n`);
  
  // Statistics
  let stats = {
    fullAddress: 0,
    simplifiedAddress: 0,
    cityCenter: 0,
    failed: 0
  };
  
  // Process events
  for (let i = 0; i < eventsToGeocode.length; i++) {
    const event = eventsToGeocode[i];
    const progress = `[${i + 1}/${eventsToGeocode.length}]`;
    
    console.log(`${progress} ${event.venue} (${event.city}, ${event.state})`);
    
    const result = await geocodeEvent(event);
    
    if (result) {
      console.log(`   ✓ Found via ${result.method}: ${result.coords.lat.toFixed(4)}, ${result.coords.lng.toFixed(4)}`);
      
      // Update event
      const eventToUpdate = data.events.find(e => e.id === event.id);
      if (eventToUpdate) eventToUpdate.coordinates = result.coords;
      
      // Track stats
      if (result.method === 'full address') stats.fullAddress++;
      else if (result.method === 'simplified address') stats.simplifiedAddress++;
      else stats.cityCenter++;
    } else {
      console.log(`   ✗ Could not geocode`);
      stats.failed++;
    }
    
    // Rate limit
    if (i < eventsToGeocode.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }
  
  // Save updated file
  data.metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n📁 Updated: ${METADATA_FILE}`);
  
  // Print summary
  console.log(`\n${'═'.repeat(68)}`);
  console.log(`\n✅ GEOCODING COMPLETE\n`);
  console.log(`   📍 Full address matches:       ${stats.fullAddress}`);
  console.log(`   📍 Simplified address matches: ${stats.simplifiedAddress}`);
  console.log(`   📍 City center fallbacks:      ${stats.cityCenter}`);
  console.log(`   ⚠️  Failed to geocode:          ${stats.failed}`);
  
  const total = stats.fullAddress + stats.simplifiedAddress + stats.cityCenter;
  console.log(`\n   📊 Total geocoded: ${total}/${eventsToGeocode.length}`);
  
  if (stats.failed > 0) {
    console.log(`\n⚠️  Some events could not be geocoded.`);
    console.log(`   These events may have incorrect addresses or be in locations not covered by Nominatim.\n`);
  } else {
    console.log(`\n📌 All events geocoded successfully!\n`);
  }
}

// Run
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
