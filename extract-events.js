import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Month abbreviations to numbers
const monthMap = {
  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
  'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
  'Sep': '09', 'Sept': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

// State abbreviations
const stateAbbrevs = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

function parseDate(dateStr, year = '2026') {
  // Handle formats like "Jan 2", "Jan 3 10pm", "Jan 10-11", "Jan 30-Feb 1"
  const dateMatch = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d+)(?:\s+(\d+[ap]m|10pm|6:30pm|1pm|5pm|12pm|3am|4pm|8am|9am|10am))?/i);
  if (!dateMatch) return null;
  
  const month = monthMap[dateMatch[1]];
  const day = dateMatch[2].padStart(2, '0');
  const time = dateMatch[3] || null;
  
  return {
    date: `${year}-${month}-${day}`,
    time: time
  };
}

function parseEventLine(line, currentEventType, qualificationPath) {
  // Skip empty lines, headers, and notes
  if (!line.trim() || line.startsWith('*') || (line.includes(':') && !line.match(/^\w+\s+\d+/))) {
    return null;
  }
  
  // Handle multi-day events - split into separate events
  const multiDayMatch = line.match(/^([A-Za-z]+\s+)(\d+)-(\d+)\s+-\s+(.+)$/);
  if (multiDayMatch) {
    const monthPrefix = multiDayMatch[1];
    const startDay = parseInt(multiDayMatch[2]);
    const endDay = parseInt(multiDayMatch[3]);
    const restOfLine = multiDayMatch[4];
    
    // Parse the rest of the line for venue, location, format
    const restMatch = restOfLine.match(/^(.+?)\s+-\s+([^,]+),\s+([A-Z]{2})\s+-\s+(.+)$/);
    if (restMatch) {
      const events = [];
      for (let day = startDay; day <= endDay; day++) {
        const dateStr = `${monthPrefix}${day}`;
        const dateInfo = parseDate(dateStr);
        if (dateInfo) {
          const venue = restMatch[1].trim();
          const city = restMatch[2].trim();
          const state = restMatch[3].trim();
          const formatNotes = restMatch[4].trim();
          
          let format = formatNotes;
          let notes = '';
          const noteMatch = format.match(/^(2-slot|TLA\?|ECL\?|TMT|CEDH)\s+(.+)$/);
          if (noteMatch) {
            notes = noteMatch[1];
            format = noteMatch[2];
          }
          
          const id = `${dateInfo.date}-${venue.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${city.toLowerCase()}`;
          events.push({
            id: id,
            type: currentEventType || 'Other',
            date: dateInfo.date,
            time: dateInfo.time,
            venue: venue,
            city: city,
            state: state,
            format: format,
            notes: notes,
            qualificationPath: qualificationPath || null,
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
  
    // Pattern: Date Time? - Venue - City, State - Format
    // Or: Date Time? - Venue - City, State - Notes Format
    // Handle cases like "Bloomington - Ellettsville" by matching the last ", STATE" pattern
    const patterns = [
      // Standard format with time: "Jan 3 10pm - Chupacabra Games - Naperville, IL - Standard"
      /^([A-Za-z]+\s+\d+(?:\s+\d+[ap]m|\s+10pm|\s+6:30pm|\s+1pm|\s+5pm|\s+12pm|\s+3am|\s+4pm|\s+8am|\s+9am|\s+10am)?)\s+-\s+(.+?)\s+-\s+([^,]+(?:,\s*[^,]+)?),\s+([A-Z]{2})\s+-\s+(.+)$/,
      // Without time: "Jan 3 - Tier 1 Games - Kokomo, IN - Standard"
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
  let city = match[3];
  const state = match[4];
  const formatNotes = match[5];
  
  // Clean up city (handle cases like "Bloomington - Ellettsville")
  city = city.replace(/\s*-\s*/g, ' ').trim();
  
  // Parse date and time
  const dateInfo = parseDate(dateTimeStr);
  if (!dateInfo) return null;
  
  // Extract format and notes
  let format = formatNotes.trim();
  let notes = '';
  
  // Check for notes like "2-slot", "TLA?", "ECL?", etc.
  const noteMatch = format.match(/^(2-slot|TLA\?|ECL\?|TMT|CEDH)\s+(.+)$/);
  if (noteMatch) {
    notes = noteMatch[1];
    format = noteMatch[2];
  }
  
  // Generate unique ID
  const id = `${dateInfo.date}-${venue.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${city.toLowerCase()}`;
  
  return {
    id: id,
    type: currentEventType || 'Other',
    date: dateInfo.date,
    time: dateInfo.time,
    venue: venue.trim(),
    city: city.trim(),
    state: state.trim(),
    format: format.trim(),
    notes: notes,
    qualificationPath: qualificationPath || null,
    address: null,
    coordinates: null,
    website: null,
    eventLink: null
  };
}

function extractEvents() {
  const filePath = path.join(__dirname, 'events.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const events = [];
  let currentEventType = null;
  let qualificationPath = null;
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect event type sections
    if (line.includes('Regional Championship Qualifiers')) {
      currentEventType = 'RCQ';
      currentSection = 'RCQ';
      // Extract qualification path
      const pathMatch = line.match(/\(leading to (.+?)\)/);
      if (pathMatch) {
        qualificationPath = pathMatch[1];
      }
      continue;
    }
    
    if (line.includes('US Regional Championships')) {
      currentEventType = 'RC';
      currentSection = 'RC';
      const pathMatch = line.match(/\(.*?lead to (.+?)\)/);
      if (pathMatch) {
        qualificationPath = pathMatch[1];
      }
      continue;
    }
    
    if (line.includes('Magic Spotlight Series') || line.includes('Magic Spotlight:')) {
      currentEventType = 'Magic Spotlight';
      currentSection = 'Magic Spotlight';
      continue;
    }
    
    if (line.includes('SCG CON:')) {
      currentEventType = 'SCG CON';
      currentSection = 'SCG CON';
      continue;
    }
    
    if (line.includes('NRG Series:') || line.includes('Shoebox:') || 
        line.includes('Hunter Burton Memorial Open:') || 
        line.includes('Gen Con:') ||
        line.includes('Pro Tour') || line.includes('MagicCon')) {
      currentEventType = 'Other';
      currentSection = line.split(':')[0];
      continue;
    }
    
    if (line.includes('Digital Events:') || line.includes('MTGO') || 
        line.includes('Arena Championships') || line.includes('Arena Direct')) {
      // Skip digital events for now
      currentEventType = null;
      currentSection = null;
      continue;
    }
    
    // Try to parse event line
    if (currentEventType && line.match(/^[A-Za-z]+\s+\d+/)) {
      const event = parseEventLine(line, currentEventType, qualificationPath);
      if (event) {
        // Handle multi-day events (array) or single events
        if (Array.isArray(event)) {
          events.push(...event);
        } else {
          events.push(event);
        }
      }
    }
  }
  
  // Sort events by date
  events.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    // If same date, sort by time if available
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    return 0;
  });
  
  return events;
}

// Main execution
const events = extractEvents();
const outputPath = path.join(__dirname, 'events-metadata.json');

const output = {
  metadata: {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    totalEvents: events.length
  },
  events: events
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Extracted ${events.length} events to ${outputPath}`);
