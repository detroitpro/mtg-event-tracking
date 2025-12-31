// Configuration management with localStorage

const CONFIG_KEY = 'mtg-event-planner-config';

const defaultConfig = {
  userLocation: {
    city: '',
    state: '',
    lat: null,
    lng: null
  },
  distanceUnit: 'mi', // 'mi' or 'km'
  defaultFilters: {
    eventTypes: ['RCQ', 'RC', 'Magic Spotlight'],
    formats: []
  }
};

export function getConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return { ...defaultConfig };
}

export function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

export function updateUserLocation(location) {
  const config = getConfig();
  config.userLocation = { ...config.userLocation, ...location };
  saveConfig(config);
  return config;
}

export function updateDistanceUnit(unit) {
  const config = getConfig();
  config.distanceUnit = unit;
  saveConfig(config);
  return config;
}
