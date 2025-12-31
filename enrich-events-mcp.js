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
  return { addresses: {}, links: {}, websites: {} };
}

// Save cache
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

// Save metadata
function saveMetadata(data) {
  data.metadata.lastUpdated = new Date().toISOString();
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Get unique venues that need enrichment
function getVenuesNeedingEnrichment(events) {
  const venues = new Map();
  
  for (const event of events) {
    const key = `${event.venue}|${event.city}|${event.state}`;
    if (!venues.has(key)) {
      venues.set(key, {
        venue: event.venue,
        city: event.city,
        state: event.state,
        needsAddress: !event.address,
        needsWebsite: !event.website,
        events: []
      });
    }
    
    const venue = venues.get(key);
    venue.events.push(event);
    if (!event.eventLink) {
      venue.needsEventLink = true;
    }
  }
  
  return Array.from(venues.values());
}

// Main function to prepare enrichment data
async function prepareEnrichment() {
  console.log('Loading events metadata...');
  const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  const events = data.events || [];
  
  console.log(`Found ${events.length} total events`);
  
  const venues = getVenuesNeedingEnrichment(events);
  const venuesNeedingAddress = venues.filter(v => v.needsAddress);
  const venuesNeedingWebsite = venues.filter(v => v.needsWebsite);
  const eventsNeedingLinks = events.filter(e => !e.eventLink);
  
  console.log(`\nEnrichment needed:`);
  console.log(`  - Unique venues needing address: ${venuesNeedingAddress.length}`);
  console.log(`  - Unique venues needing website: ${venuesNeedingWebsite.length}`);
  console.log(`  - Events needing links: ${eventsNeedingLinks.length}`);
  
  return {
    data,
    events,
    venues,
    venuesNeedingAddress,
    venuesNeedingWebsite,
    eventsNeedingLinks
  };
}

// Update event with enrichment data
function updateEventWithEnrichment(data, venueKey, enrichment) {
  const [venue, city, state] = venueKey.split('|');
  
  for (const event of data.events) {
    if (event.venue === venue && event.city === city && event.state === state) {
      if (enrichment.address && !event.address) {
        event.address = enrichment.address;
      }
      if (enrichment.coordinates && !event.coordinates) {
        event.coordinates = enrichment.coordinates;
      }
      if (enrichment.website && !event.website) {
        event.website = enrichment.website;
      }
    }
    
    // Update event-specific link
    if (enrichment.eventLink && event.id === enrichment.eventId) {
      event.eventLink = enrichment.eventLink;
    }
  }
}

// Export functions for use with MCP tools
export {
  prepareEnrichment,
  updateEventWithEnrichment,
  saveMetadata,
  saveCache,
  loadCache,
  METADATA_FILE
};

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareEnrichment().then(result => {
    console.log('\n✓ Preparation complete!');
    console.log('\nTo enrich events, use the MCP tools to search for:');
    console.log('1. Venue addresses');
    console.log('2. Venue websites');
    console.log('3. Event registration/links');
    console.log('\nThen update the metadata file with the results.');
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}
