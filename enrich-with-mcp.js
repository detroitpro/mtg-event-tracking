import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_FILE = path.join(__dirname, 'events-metadata.json');
const CACHE_FILE = path.join(__dirname, '.enrichment-cache.json');
const PROGRESS_FILE = path.join(__dirname, '.enrichment-progress.json');

// Load cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return { addresses: {}, links: {}, websites: {}, coordinates: {} };
}

// Save cache
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

// Load progress
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  }
  return { processedVenues: new Set(), processedEvents: new Set() };
}

// Save progress
function saveProgress(progress) {
  try {
    const serializable = {
      processedVenues: Array.from(progress.processedVenues),
      processedEvents: Array.from(progress.processedEvents)
    };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(serializable, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving progress:', error);
  }
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

// Get events needing enrichment
function getEventsNeedingEnrichment(events, progress) {
  return events.filter(event => {
    const venueKey = `${event.venue}|${event.city}|${event.state}`;
    const needsAddress = !event.address && !progress.processedVenues.has(venueKey);
    const needsLink = !event.eventLink && !progress.processedEvents.has(event.id);
    return needsAddress || needsLink;
  });
}

// Get unique venues needing addresses
function getUniqueVenues(events, progress) {
  const venues = new Map();
  
  for (const event of events) {
    const key = `${event.venue}|${event.city}|${event.state}`;
    if (!event.address && !progress.processedVenues.has(key)) {
      if (!venues.has(key)) {
        venues.set(key, {
          venue: event.venue,
          city: event.city,
          state: event.state,
          key: key
        });
      }
    }
  }
  
  return Array.from(venues.values());
}

// Main function - prepares data for MCP enrichment
async function prepareForEnrichment(limit = null) {
  console.log('Loading events metadata...');
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const events = data.events || [];
  
  const cache = loadCache();
  const progress = loadProgress();
  
  // Convert arrays back to Sets
  progress.processedVenues = new Set(progress.processedVenues || []);
  progress.processedEvents = new Set(progress.processedEvents || []);
  
  const venuesNeedingAddress = getUniqueVenues(events, progress);
  const eventsNeedingLinks = getEventsNeedingEnrichment(events, progress);
  
  if (limit) {
    venuesNeedingAddress.splice(limit);
    eventsNeedingLinks.splice(limit);
  }
  
  console.log(`\nEnrichment needed:`);
  console.log(`  - Venues needing address: ${venuesNeedingAddress.length}`);
  console.log(`  - Events needing links: ${eventsNeedingLinks.length}`);
  
  return {
    data,
    events,
    cache,
    progress,
    venuesNeedingAddress,
    eventsNeedingLinks
  };
}

// Update metadata with enrichment results
function updateMetadata(enrichmentResults) {
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const cache = loadCache();
  const progress = loadProgress();
  
  // Convert arrays back to Sets
  progress.processedVenues = new Set(progress.processedVenues || []);
  progress.processedEvents = new Set(progress.processedEvents || []);
  
  let updated = 0;
  
  for (const result of enrichmentResults) {
    if (result.type === 'address') {
      // Update all events with this venue
      const [venue, city, state] = result.venueKey.split('|');
      
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
      
      // Update cache and progress
      cache.addresses[result.venueKey] = result.address;
      if (result.coordinates) {
        cache.coordinates[result.venueKey] = result.coordinates;
      }
      if (result.website) {
        cache.websites[result.venueKey] = result.website;
      }
      progress.processedVenues.add(result.venueKey);
      
    } else if (result.type === 'link') {
      // Update specific event
      const event = data.events.find(e => e.id === result.eventId);
      if (event && result.link && !event.eventLink) {
        event.eventLink = result.link;
        updated++;
      }
      
      // Update cache and progress
      cache.links[result.eventId] = result.link;
      progress.processedEvents.add(result.eventId);
    }
  }
  
  // Save everything
  data.metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  saveCache(cache);
  saveProgress(progress);
  
  console.log(`\n✓ Updated ${updated} events`);
  return updated;
}

// Export functions
export {
  prepareForEnrichment,
  updateMetadata,
  geocodeAddress,
  loadCache,
  saveCache,
  METADATA_FILE
};

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : null;
  
  prepareForEnrichment(limit).then(result => {
    console.log('\n✓ Preparation complete!');
    console.log('\nNext steps:');
    console.log('1. Use MCP tools to search for venue addresses and event links');
    console.log('2. Call updateMetadata() with the results');
    console.log('\nExample venues to search:');
    result.venuesNeedingAddress.slice(0, 5).forEach(v => {
      console.log(`  - ${v.venue}, ${v.city}, ${v.state}`);
    });
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
