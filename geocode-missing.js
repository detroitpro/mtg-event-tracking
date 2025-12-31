/**
 * Geocode events that have addresses but missing coordinates
 * Falls back to city-level geocoding if full address fails
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100; // Nominatim requires 1 request per second

async function geocodeQuery(query) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MTG Event Planner/1.0 (geocoding script)'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
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

async function geocodeEvent(event) {
  // Try 1: Full address
  if (event.address) {
    const coords = await geocodeQuery(event.address);
    if (coords) {
      return { coords, method: 'address' };
    }
  }
  
  // Try 2: Street address without suite/unit numbers
  if (event.address) {
    // Remove suite/unit info
    const simplified = event.address
      .replace(/,?\s*(Suite|Ste|Unit|#|Apt|Mailbox)\s*[A-Za-z0-9-]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (simplified !== event.address) {
      await sleep(RATE_LIMIT_MS);
      const coords = await geocodeQuery(simplified);
      if (coords) {
        return { coords, method: 'simplified address' };
      }
    }
  }
  
  // Try 3: City + State (fallback - gives city center)
  if (event.city && event.state) {
    await sleep(RATE_LIMIT_MS);
    const cityQuery = `${event.city}, ${event.state}`;
    const coords = await geocodeQuery(cityQuery);
    if (coords) {
      return { coords, method: 'city' };
    }
  }
  
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Read both files
  const publicPath = path.join(__dirname, 'public/events-metadata.json');
  const rootPath = path.join(__dirname, 'events-metadata.json');
  
  const publicData = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
  const rootData = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
  
  // Find events with address but no coordinates
  const eventsToGeocode = publicData.events.filter(e => e.address && !e.coordinates);
  
  console.log(`Found ${eventsToGeocode.length} events with addresses but no coordinates\n`);
  
  let addressCount = 0;
  let simplifiedCount = 0;
  let cityCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < eventsToGeocode.length; i++) {
    const event = eventsToGeocode[i];
    console.log(`[${i + 1}/${eventsToGeocode.length}] ${event.venue} (${event.city}, ${event.state})`);
    
    const result = await geocodeEvent(event);
    
    if (result) {
      console.log(`  ✓ Found via ${result.method}: ${result.coords.lat.toFixed(4)}, ${result.coords.lng.toFixed(4)}`);
      
      // Update in both data structures
      const publicEvent = publicData.events.find(e => e.id === event.id);
      const rootEvent = rootData.events.find(e => e.id === event.id);
      
      if (publicEvent) publicEvent.coordinates = result.coords;
      if (rootEvent) rootEvent.coordinates = result.coords;
      
      if (result.method === 'address') addressCount++;
      else if (result.method === 'simplified address') simplifiedCount++;
      else cityCount++;
    } else {
      console.log(`  ✗ Could not geocode`);
      failCount++;
    }
    
    // Rate limit between events
    if (i < eventsToGeocode.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }
  
  // Save updated files
  fs.writeFileSync(publicPath, JSON.stringify(publicData, null, 2));
  fs.writeFileSync(rootPath, JSON.stringify(rootData, null, 2));
  
  console.log(`\n=== Summary ===`);
  console.log(`Found via full address: ${addressCount}`);
  console.log(`Found via simplified address: ${simplifiedCount}`);
  console.log(`Found via city fallback: ${cityCount}`);
  console.log(`Failed to geocode: ${failCount}`);
  console.log(`\nFiles updated!`);
}

main().catch(console.error);
