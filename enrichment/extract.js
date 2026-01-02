#!/usr/bin/env node
/**
 * Event Extraction Script (IDEMPOTENT)
 * 
 * Parses the raw events.txt file and MERGES with existing metadata.
 * - New events are added
 * - Existing events are updated BUT enrichment data is preserved
 * - Events not in events.txt are KEPT (not deleted)
 * 
 * Usage: node enrichment/extract.js
 * 
 * Input: events.txt (in project root)
 * Output: public/events-metadata.json (merged)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const EVENTS_FILE = path.join(PROJECT_ROOT, 'events.txt');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'public/events-metadata.json');

// Month abbreviations to numbers
const monthMap = {
  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
  'May': '05', 'Jun': '06', 'June': '06', 'Jul': '07', 'July': '07', 'Aug': '08',
  'Sep': '09', 'Sept': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

// US State abbreviations
const stateAbbrevs = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

/**
 * Parse a date string like "Jan 2", "Jan 3 10pm"
 */
function parseDate(dateStr, year = '2026') {
  const dateMatch = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d+)(?:\s+(\d+[ap]m|10pm|6:30pm|1pm|5pm|12pm|3am|4pm|8am|9am|10am))?/i);
  if (!dateMatch) return null;
  
  const month = monthMap[dateMatch[1]];
  const day = dateMatch[2].padStart(2, '0');
  const time = dateMatch[3] || null;
  
  return { date: `${year}-${month}-${day}`, time };
}

/**
 * Generate a unique ID for an event
 * Includes time if provided to handle same venue/date with different time slots
 */
function generateId(date, venue, city, time = null) {
  const venueSlug = venue.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().replace(/-+/g, '-');
  const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const timeSlug = time ? `-${time.replace(/[^a-z0-9]/gi, '')}` : '';
  return `${date}-${venueSlug}-${citySlug}${timeSlug}`;
}

/**
 * Parse a single event line
 */
function parseEventLine(line, currentEventType, qualificationPath) {
  // Skip empty lines, headers, notes
  if (!line.trim() || line.startsWith('*') || (line.includes(':') && !line.match(/^\w+\s+\d+/))) {
    return null;
  }
  
  // Handle multi-day events
  const multiDayMatch = line.match(/^([A-Za-z]+\s+)(\d+)-(\d+)\s+-\s+(.+)$/);
  if (multiDayMatch) {
    const monthPrefix = multiDayMatch[1];
    const startDay = parseInt(multiDayMatch[2]);
    const endDay = parseInt(multiDayMatch[3]);
    const restOfLine = multiDayMatch[4];
    
    const restMatch = restOfLine.match(/^(.+?)\s+-\s+([^,]+),\s+([A-Z]{2})\s+-\s+(.+)$/);
    if (restMatch) {
      const events = [];
      for (let day = startDay; day <= endDay; day++) {
        const dateStr = `${monthPrefix}${day}`;
        const dateInfo = parseDate(dateStr);
        if (dateInfo) {
          const venue = restMatch[1].trim();
          let city = restMatch[2].trim().replace(/\s*-\s*/g, ' ');
          const state = restMatch[3].trim();
          let format = restMatch[4].trim();
          let notes = '';
          
          const noteMatch = format.match(/^(2-slot|TLA\?|ECL\?|TMT|CEDH)\s+(.+)$/);
          if (noteMatch) {
            notes = noteMatch[1];
            format = noteMatch[2];
          }
          
          events.push({
            id: generateId(dateInfo.date, venue, city, dateInfo.time),
            type: currentEventType || 'Other',
            date: dateInfo.date,
            time: dateInfo.time,
            venue: venue,
            city: city,
            state: state,
            format: format,
            notes: notes,
            qualificationPath: qualificationPath || null,
            // Enrichment fields - will be preserved if event already exists
            address: null,
            coordinates: null,
            website: null,
            eventLink: null
          });
        }
      }
      return events.length > 0 ? events : null;
    }
  }
  
  // Standard event patterns
  const patterns = [
    // With time
    /^([A-Za-z]+\s+\d+(?:\s+\d+[ap]m|\s+10pm|\s+6:30pm|\s+1pm|\s+5pm|\s+12pm|\s+3am|\s+4pm|\s+8am|\s+9am|\s+10am)?)\s+-\s+(.+?)\s+-\s+([^,]+(?:,\s*[^,]+)?),\s+([A-Z]{2})\s+-\s+(.+)$/,
    // Without time
    /^([A-Za-z]+\s+\d+)\s+-\s+(.+?)\s+-\s+([^,]+(?:,\s*[^,]+)?),\s+([A-Z]{2})\s+-\s+(.+)$/
  ];
  
  let match = null;
  for (const pattern of patterns) {
    match = line.match(pattern);
    if (match) break;
  }
  
  if (!match) return null;
  
  const dateTimeStr = match[1];
  const venue = match[2];
  let city = match[3].replace(/\s*-\s*/g, ' ').trim();
  const state = match[4];
  let format = match[5].trim();
  let notes = '';
  
  const dateInfo = parseDate(dateTimeStr);
  if (!dateInfo) return null;
  
  // Extract notes
  const noteMatch = format.match(/^(2-slot|TLA\?|ECL\?|TMT|CEDH)\s+(.+)$/);
  if (noteMatch) {
    notes = noteMatch[1];
    format = noteMatch[2];
  }
  
  return {
    id: generateId(dateInfo.date, venue, city, dateInfo.time),
    type: currentEventType || 'Other',
    date: dateInfo.date,
    time: dateInfo.time,
    venue: venue.trim(),
    city: city,
    state: state.trim(),
    format: format.trim(),
    notes: notes,
    qualificationPath: qualificationPath || null,
    // Enrichment fields - will be preserved if event already exists
    address: null,
    coordinates: null,
    website: null,
    eventLink: null
  };
}

/**
 * Extract all events from the events file
 */
function extractEvents() {
  if (!fs.existsSync(EVENTS_FILE)) {
    console.error(`Error: Events file not found: ${EVENTS_FILE}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
  const lines = content.split('\n');
  
  const events = [];
  let currentEventType = null;
  let qualificationPath = null;
  
  for (const rawLine of lines) {
    const line = rawLine.trim();
    
    // Detect event type sections
    if (line.includes('Regional Championship Qualifiers')) {
      currentEventType = 'RCQ';
      const pathMatch = line.match(/\(leading to (.+?)\)/);
      if (pathMatch) qualificationPath = pathMatch[1];
      continue;
    }
    
    if (line.includes('US Regional Championships')) {
      currentEventType = 'RC';
      const pathMatch = line.match(/\(.*?lead to (.+?)\)/);
      if (pathMatch) qualificationPath = pathMatch[1];
      continue;
    }
    
    if (line.includes('Magic Spotlight Series') || line.includes('Magic Spotlight:')) {
      currentEventType = 'Magic Spotlight';
      continue;
    }
    
    if (line.includes('SCG CON:')) {
      currentEventType = 'SCG CON';
      continue;
    }
    
    if (line.includes('NRG Series:') || line.includes('Shoebox:') || 
        line.includes('Hunter Burton Memorial Open:') || 
        line.includes('Gen Con:') ||
        line.includes('Pro Tour') || line.includes('MagicCon')) {
      currentEventType = 'Other';
      continue;
    }
    
    if (line.includes('Digital Events:') || line.includes('MTGO') || 
        line.includes('Arena Championships') || line.includes('Arena Direct')) {
      currentEventType = null;
      continue;
    }
    
    // Parse event line
    if (currentEventType && line.match(/^[A-Za-z]+\s+\d+/)) {
      const event = parseEventLine(line, currentEventType, qualificationPath);
      if (event) {
        if (Array.isArray(event)) {
          events.push(...event);
        } else {
          events.push(event);
        }
      }
    }
  }
  
  return events;
}

/**
 * Load existing events from metadata file
 * Creates multiple indexes for matching (by ID and by venue+date+city for migration)
 */
function loadExistingEvents() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return { events: [], byId: new Map(), byVenueDateCity: new Map() };
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    const byId = new Map(data.events.map(e => [e.id, e]));
    
    // Secondary index for migration: venue+date+city (handles old IDs without time)
    const byVenueDateCity = new Map();
    for (const e of data.events) {
      const key = `${e.date}-${e.venue.toLowerCase()}-${e.city.toLowerCase()}`;
      if (!byVenueDateCity.has(key)) {
        byVenueDateCity.set(key, []);
      }
      byVenueDateCity.get(key).push(e);
    }
    
    return { events: data.events, byId, byVenueDateCity };
  } catch (e) {
    console.warn(`⚠️  Could not parse existing metadata, starting fresh`);
    return { events: [], byId: new Map(), byVenueDateCity: new Map() };
  }
}

/**
 * Merge new events with existing, preserving enrichment data
 * Handles ID format migration (old IDs without time → new IDs with time)
 */
function mergeEvents(newEvents, existing) {
  const stats = {
    added: 0,
    updated: 0,
    unchanged: 0,
    preserved: 0,
    migrated: 0
  };
  
  const mergedById = new Map();
  const processedOldIds = new Set();
  
  for (const newEvent of newEvents) {
    let existingEvent = existing.byId.get(newEvent.id);
    
    // If not found by exact ID, try to find by venue+date+city (migration)
    if (!existingEvent) {
      const key = `${newEvent.date}-${newEvent.venue.toLowerCase()}-${newEvent.city.toLowerCase()}`;
      const candidates = existing.byVenueDateCity.get(key) || [];
      
      // Find best match (same time or only one candidate)
      if (candidates.length === 1) {
        existingEvent = candidates[0];
        processedOldIds.add(existingEvent.id);
        stats.migrated++;
      } else if (candidates.length > 1) {
        // Multiple candidates - try to match by time
        const timeMatch = candidates.find(c => c.time === newEvent.time);
        if (timeMatch) {
          existingEvent = timeMatch;
          processedOldIds.add(existingEvent.id);
          stats.migrated++;
        }
      }
    } else {
      processedOldIds.add(existingEvent.id);
    }
    
    if (!existingEvent) {
      // New event - add it
      mergedById.set(newEvent.id, newEvent);
      stats.added++;
    } else {
      // Existing event - merge, preserving enrichment data
      const merged = {
        ...newEvent,
        // Preserve enrichment fields from existing event
        address: existingEvent.address || newEvent.address,
        coordinates: existingEvent.coordinates || newEvent.coordinates,
        website: existingEvent.website || newEvent.website,
        eventLink: existingEvent.eventLink || newEvent.eventLink
      };
      
      // Check if anything actually changed (beyond ID)
      const hasChanges = (
        existingEvent.type !== merged.type ||
        existingEvent.date !== merged.date ||
        existingEvent.time !== merged.time ||
        existingEvent.venue !== merged.venue ||
        existingEvent.city !== merged.city ||
        existingEvent.state !== merged.state ||
        existingEvent.format !== merged.format ||
        existingEvent.notes !== merged.notes ||
        existingEvent.id !== merged.id
      );
      
      if (hasChanges) {
        stats.updated++;
      } else {
        stats.unchanged++;
      }
      
      mergedById.set(newEvent.id, merged);
    }
  }
  
  // Add preserved events (not in new data but kept)
  for (const [id, event] of existing.byId) {
    if (!processedOldIds.has(id) && !mergedById.has(id)) {
      mergedById.set(id, event);
      stats.preserved++;
    }
  }
  
  // Convert back to array and sort
  const mergedEvents = Array.from(mergedById.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return 0;
  });
  
  return { events: mergedEvents, stats };
}

/**
 * Main function
 */
function main() {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║        MTG Event Enrichment - Event Extractor (Merge)         ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
  
  console.log(`📄 Reading: ${EVENTS_FILE}`);
  
  // Load existing events
  const existing = loadExistingEvents();
  console.log(`📦 Existing events: ${existing.events.length}`);
  
  // Extract new events from events.txt
  const newEvents = extractEvents();
  console.log(`📋 Events in events.txt: ${newEvents.length}`);
  
  // Merge
  const { events, stats } = mergeEvents(newEvents, existing);
  
  const output = {
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      totalEvents: events.length,
      source: 'events.txt (merged)'
    },
    events: events
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`\n📁 Output: ${OUTPUT_FILE}`);
  
  console.log(`\n════════════════════════════════════════════════════════════════════\n`);
  console.log(`📊 Merge Results:`);
  console.log(`   ➕ Added:     ${stats.added} new events`);
  console.log(`   🔄 Updated:   ${stats.updated} events (enrichment preserved)`);
  console.log(`   ⏸️  Unchanged: ${stats.unchanged} events`);
  console.log(`   🔀 Migrated:  ${stats.migrated} events (ID format updated)`);
  console.log(`   📌 Preserved: ${stats.preserved} events (not in events.txt, kept)`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   📈 Total:     ${events.length} events`);
  
  // Count by type
  const byType = {};
  events.forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + 1;
  });
  
  console.log(`\n   By type:`);
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`      ${type}: ${count}`);
  });
  
  // Enrichment stats
  const withAddress = events.filter(e => e.address).length;
  const withCoords = events.filter(e => e.coordinates).length;
  const withLinks = events.filter(e => e.eventLink).length;
  
  console.log(`\n   Enrichment status:`);
  console.log(`      With addresses:    ${withAddress}/${events.length}`);
  console.log(`      With coordinates:  ${withCoords}/${events.length}`);
  console.log(`      With event links:  ${withLinks}/${events.length}`);
  
  console.log(`\n✅ Extraction complete! (idempotent merge)`);
  console.log(`\n📌 Next step: Run 'make enrich-prepare' to generate enrichment queries\n`);
}

// Run
main();
