<template>
  <div class="app">
    <!-- Ambient background effects -->
    <div class="ambient-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <!-- Header -->
    <header class="app-header">
      <div class="header-container">
        <div class="brand">
          <div class="logo">
            <span class="logo-icon">⚔️</span>
          </div>
          <div class="brand-text">
            <h1>Rhystic Gaming: Upcoming Regional Events</h1>
          </div>
        </div>
        
        <div v-if="userLocationSet" class="location-chip" @click="resetLocation">
          <span class="location-pin">📍</span>
          <span class="location-text">{{ userLocation.city }}, {{ userLocation.state }}</span>
          <button class="location-close" title="Change Location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <LocationConfig 
        v-if="!userLocationSet"
        @location-set="handleLocationSet"
        @use-geolocation="handleGeolocation"
      />
      
      <div v-else class="main-content animate-fadeIn">
        <!-- Hero Stats -->
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-value">{{ upcomingEventsCount }}</span>
            <span class="stat-label">Next 3 Weeks</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ allFutureEvents.length }}</span>
            <span class="stat-label">All Future</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item clickable" @click="activeTab = 'favorites'">
            <span class="stat-value favorites-value">{{ favoriteEvents.length }}</span>
            <span class="stat-label">Favorites</span>
          </div>
        </div>

        <!-- Tab Navigation -->
        <nav class="tab-nav">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'upcoming' }"
            @click="activeTab = 'upcoming'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span>Upcoming</span>
            <span class="tab-count">{{ upcomingEventsCount }}</span>
          </button>
          
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>All Events</span>
            <span class="tab-count">{{ allFutureEvents.length }}</span>
          </button>
          
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'favorites' }"
            @click="activeTab = 'favorites'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" :fill="favoriteEvents.length > 0 ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Favorites</span>
            <span class="tab-count" :class="{ 'has-favorites': favoriteEvents.length > 0 }">{{ favoriteEvents.length }}</span>
          </button>
        </nav>

        <!-- Filter Chips Bar -->
        <div class="filter-bar" v-if="activeTab !== 'favorites'">
          <div class="filter-bar-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
          </div>
          
          <div class="filter-chips">
            <button 
              class="filter-chip" 
              :class="{ active: selectedEventTypes.length > 0 && selectedEventTypes.length < availableEventTypes.length }"
              @click="openFilterModal('eventTypes')"
            >
              <span class="chip-icon">🎯</span>
              <span class="chip-label">Event Types</span>
              <span v-if="selectedEventTypes.length > 0 && selectedEventTypes.length < availableEventTypes.length" class="chip-count">{{ selectedEventTypes.length }}</span>
            </button>
            
            <button 
              class="filter-chip"
              :class="{ active: selectedFormats.length > 0 }"
              @click="openFilterModal('formats')"
            >
              <span class="chip-icon">🃏</span>
              <span class="chip-label">Formats</span>
              <span v-if="selectedFormats.length > 0" class="chip-count">{{ selectedFormats.length }}</span>
            </button>
            
            <button 
              class="filter-chip"
              :class="{ active: selectedStates.length > 0 }"
              @click="openFilterModal('states')"
            >
              <span class="chip-icon">📍</span>
              <span class="chip-label">States</span>
              <span v-if="selectedStates.length > 0" class="chip-count">{{ selectedStates.length }}</span>
            </button>
            
            <button 
              class="filter-chip"
              :class="{ active: maxDistance !== null }"
              @click="openFilterModal('distance')"
            >
              <span class="chip-icon">📏</span>
              <span class="chip-label">Distance</span>
              <span v-if="maxDistance" class="chip-count">{{ maxDistance }}mi</span>
            </button>
          </div>
          
          <button 
            v-if="hasActiveFilters" 
            class="clear-filters-btn"
            @click="clearAllFilters"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Clear
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Upcoming Events Tab -->
          <section v-if="activeTab === 'upcoming'" class="events-section upcoming-section">
            <div class="section-header">
              <div class="section-title-group">
                <span class="section-icon">⚡</span>
                <h2>Upcoming Events</h2>
                <span class="section-badge">Next 3 Weeks</span>
              </div>
              <div class="section-actions">
                <!-- Sort Toggle -->
                <div v-if="userLocation" class="sort-toggle">
                  <button 
                    class="sort-btn" 
                    :class="{ active: upcomingSortBy === 'date' }"
                    @click="upcomingSortBy = 'date'"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    By Date
                  </button>
                  <button 
                    class="sort-btn" 
                    :class="{ active: upcomingSortBy === 'distance' }"
                    @click="upcomingSortBy = 'distance'"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    By Distance
                  </button>
                </div>
                <button v-if="Object.keys(groupedUpcomingEvents).length > 0 && upcomingSortBy === 'date'" class="expand-all-btn" @click="toggleAllUpcoming">
                  {{ allUpcomingCollapsed ? 'Expand All' : 'Collapse All' }}
                </button>
              </div>
            </div>
            
            <div v-if="filteredUpcomingEvents.length === 0" class="empty-state">
              <div class="empty-icon">⚡</div>
              <h3>No upcoming events</h3>
              <p>No events found in the next 3 weeks matching your filters</p>
              <button class="empty-action" @click="activeTab = 'all'">View All Events →</button>
            </div>
            
            <!-- Sorted by Date (Grouped) -->
            <div v-else-if="upcomingSortBy === 'date'" class="events-timeline">
              <div
                v-for="(dayGroup, date) in groupedUpcomingEvents"
                :key="date"
                class="timeline-day stagger-item"
              >
                <div class="timeline-header" @click="toggleUpcomingDay(date)">
                  <div class="timeline-date">
                    <span class="date-month">{{ getMonthName(date) }}</span>
                    <span class="date-day-num">{{ getDayNum(date) }}</span>
                    <span class="date-weekday">({{ getDayName(date) }})</span>
                    <span class="days-until-badge" :class="getDaysUntilClass(date)">{{ getDaysUntilText(date) }}</span>
                  </div>
                  <div class="timeline-meta">
                    <span class="event-count-badge">{{ dayGroup.length }} event{{ dayGroup.length !== 1 ? 's' : '' }}</span>
                    <button class="expand-btn" :class="{ collapsed: collapsedUpcomingDays[date] }">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div class="timeline-events" :class="{ collapsed: collapsedUpcomingDays[date] }">
                  <EventCard
                    v-for="(event, index) in dayGroup"
                    :key="event.id"
                    :event="event"
                    :user-location="userLocation"
                    :distance-unit="distanceUnit"
                    :is-closest="userLocation && index === 0 && isClosestEvent(event)"
                    :is-farther="!!userLocation && index > 0"
                    :is-upcoming="true"
                    @favorite-toggled="handleFavoriteToggled"
                  />
                </div>
              </div>
            </div>
            
            <!-- Sorted by Distance (Flat List) -->
            <div v-else class="events-distance-sorted">
              <EventCard
                v-for="(event, index) in distanceSortedUpcomingEvents"
                :key="event.id"
                :event="event"
                :user-location="userLocation"
                :distance-unit="distanceUnit"
                :is-closest="index === 0"
                :is-farther="index > 0"
                :is-upcoming="true"
                @favorite-toggled="handleFavoriteToggled"
              />
            </div>
          </section>

          <!-- All Events Tab -->
          <section v-if="activeTab === 'all'" class="events-section all-events-section">
            <div class="section-header">
              <div class="section-title-group">
                <span class="section-icon">📅</span>
                <h2>All Future Events</h2>
                <span class="event-total-badge">{{ filteredEvents.length }} events</span>
              </div>
            </div>
            
            <EventList
              :events="filteredEvents"
              :user-location="userLocation"
              :distance-unit="distanceUnit"
              :default-collapsed="true"
              @favorite-toggled="handleFavoriteToggled"
            />
          </section>

          <!-- Favorites Tab -->
          <section v-if="activeTab === 'favorites'" class="events-section favorites-section">
            <div class="section-header">
              <div class="section-title-group">
                <span class="section-icon">❤️</span>
                <h2>Your Favorites</h2>
                <span v-if="favoriteEvents.length > 0" class="event-total-badge favorites-badge">{{ favoriteEvents.length }} saved</span>
              </div>
              <button v-if="favoriteEvents.length > 0" class="clear-favorites-btn" @click="confirmClearFavorites">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Clear All
              </button>
            </div>
            
            <div v-if="favoriteEvents.length === 0" class="empty-state favorites-empty">
              <div class="empty-icon">❤️</div>
              <h3>No favorites yet</h3>
              <p>Click the heart icon on any event to save it here for quick access</p>
              <button class="empty-action" @click="activeTab = 'all'">Browse All Events →</button>
            </div>
            
            <div v-else class="favorites-list">
              <EventCard
                v-for="event in sortedFavoriteEvents"
                :key="event.id"
                :event="event"
                :user-location="userLocation"
                :distance-unit="distanceUnit"
                :is-closest="false"
                :is-farther="false"
                :is-upcoming="false"
                @favorite-toggled="handleFavoriteToggled"
              />
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- Filter Modals -->
    <FilterModal
      :is-open="activeModal === 'eventTypes'"
      title="Filter by Event Type"
      icon="🎯"
      :options="eventTypeOptions"
      v-model="selectedEventTypes"
      @close="closeModal"
      @apply="applyFilters"
    />
    
    <FilterModal
      :is-open="activeModal === 'formats'"
      title="Filter by Format"
      icon="🃏"
      :options="formatOptions"
      :searchable="true"
      search-placeholder="Search formats..."
      v-model="selectedFormats"
      @close="closeModal"
      @apply="applyFilters"
    />
    
    <FilterModal
      :is-open="activeModal === 'states'"
      title="Filter by State"
      icon="📍"
      :options="stateOptions"
      :searchable="true"
      search-placeholder="Search states..."
      :columns="3"
      size="large"
      v-model="selectedStates"
      @close="closeModal"
      @apply="applyFilters"
    />
    
    <!-- Distance Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="activeModal === 'distance'" class="modal-overlay" @click.self="closeModal">
          <div class="distance-modal">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-icon">📏</span>
                <h3>Max Distance</h3>
              </div>
              <button class="close-btn" @click="closeModal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div class="distance-content">
              <p class="distance-description">Show events within this distance from your location</p>
              
              <div class="distance-presets">
                <button 
                  v-for="preset in distancePresets" 
                  :key="preset"
                  class="distance-preset"
                  :class="{ active: tempMaxDistance === preset }"
                  @click="tempMaxDistance = preset"
                >
                  {{ preset }} mi
                </button>
                <button 
                  class="distance-preset"
                  :class="{ active: tempMaxDistance === null }"
                  @click="tempMaxDistance = null"
                >
                  Any
                </button>
              </div>
              
              <div class="distance-input-group">
                <label>Custom distance (miles)</label>
                <input 
                  type="number" 
                  v-model.number="tempMaxDistance"
                  placeholder="Enter miles..."
                  min="1"
                  class="distance-input"
                />
              </div>
            </div>
            
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeModal">Cancel</button>
              <button class="btn-primary" @click="applyDistanceFilter">
                Apply
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <footer class="app-footer" v-if="userLocationSet">
      <p>Data updated regularly • Built for the MTG community</p>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import LocationConfig from './components/LocationConfig.vue';
import EventList from './components/EventList.vue';
import EventCard from './components/EventCard.vue';
import FilterModal from './components/FilterModal.vue';
import { getConfig, updateUserLocation } from './utils/config';
import { distanceToEvent } from './utils/distance';
import { getFavorites, getFavoriteEvents, clearAllFavorites } from './utils/favorites';

export default {
  name: 'App',
  components: {
    LocationConfig,
    EventList,
    EventCard,
    FilterModal
  },
  setup() {
    const allEvents = ref([]);
    const userLocation = ref(null);
    const userLocationSet = ref(false);
    const distanceUnit = ref('mi');
    const collapsedUpcomingDays = ref({});
    
    // Tab state
    const activeTab = ref('upcoming');
    const upcomingSortBy = ref('date'); // 'date' or 'distance'
    
    // Favorites tracking (reactive)
    const favoritesVersion = ref(0);
    
    // Filter state
    const activeModal = ref(null);
    const selectedEventTypes = ref([]);
    const selectedFormats = ref([]);
    const selectedStates = ref([]);
    const maxDistance = ref(null);
    const tempMaxDistance = ref(null);
    
    const distancePresets = [25, 50, 100, 200, 500];

    // Calculate next 3 weeks from today
    const threeWeeksFromNow = computed(() => {
      const date = new Date();
      date.setDate(date.getDate() + 21);
      return date.toISOString().split('T')[0];
    });

    const today = computed(() => {
      return new Date().toISOString().split('T')[0];
    });

    // ALL future events (no time limit)
    const allFutureEvents = computed(() => {
      return allEvents.value.filter(event => event.date >= today.value);
    });

    // Upcoming events (next 3 weeks only) - for stats
    const upcomingEventsCount = computed(() => {
      return allFutureEvents.value.filter(event => 
        event.date <= threeWeeksFromNow.value
      ).length;
    });

    // Available filter options derived from events
    const availableEventTypes = computed(() => {
      const types = new Set();
      allEvents.value.forEach(e => e.type && types.add(e.type));
      return Array.from(types).sort();
    });
    
    const availableFormats = computed(() => {
      const formats = new Set();
      allEvents.value.forEach(e => e.format && formats.add(e.format));
      return Array.from(formats).sort();
    });
    
    const availableStates = computed(() => {
      const states = new Set();
      allEvents.value.forEach(e => e.state && states.add(e.state));
      return Array.from(states).sort();
    });
    
    // Options formatted for FilterModal
    const eventTypeOptions = computed(() => {
      return availableEventTypes.value.map(type => {
        const count = allFutureEvents.value.filter(e => e.type === type).length;
        return { value: type, label: type, count };
      });
    });
    
    const formatOptions = computed(() => {
      return availableFormats.value.map(format => {
        const count = allFutureEvents.value.filter(e => e.format === format).length;
        return { value: format, label: format, count };
      });
    });
    
    const stateOptions = computed(() => {
      return availableStates.value.map(state => {
        const count = allFutureEvents.value.filter(e => e.state === state).length;
        return { value: state, label: state, count };
      });
    });

    // Check if any filters are active
    const hasActiveFilters = computed(() => {
      return (selectedEventTypes.value.length > 0 && selectedEventTypes.value.length < availableEventTypes.value.length) ||
             selectedFormats.value.length > 0 ||
             selectedStates.value.length > 0 ||
             maxDistance.value !== null;
    });

    // Filter all future events
    const filteredEvents = computed(() => {
      let filtered = [...allFutureEvents.value];
      
      // Filter by event type
      if (selectedEventTypes.value.length > 0) {
        filtered = filtered.filter(e => selectedEventTypes.value.includes(e.type));
      }
      
      // Filter by format
      if (selectedFormats.value.length > 0) {
        filtered = filtered.filter(e => selectedFormats.value.includes(e.format));
      }
      
      // Filter by state
      if (selectedStates.value.length > 0) {
        filtered = filtered.filter(e => selectedStates.value.includes(e.state));
      }
      
      // Filter by distance
      if (maxDistance.value && userLocation.value) {
        filtered = filtered.filter(e => {
          if (!e.coordinates) return true;
          const dist = distanceToEvent(userLocation.value, e, distanceUnit.value);
          return dist !== null && dist <= maxDistance.value;
        });
      }
      
      // Sort by date
      return filtered.sort((a, b) => a.date.localeCompare(b.date));
    });

    // Filtered upcoming events (next 3 weeks)
    const filteredUpcomingEvents = computed(() => {
      return filteredEvents.value.filter(event => 
        event.date <= threeWeeksFromNow.value
      );
    });
    
    // Favorite events (reactive via favoritesVersion)
    const favoriteEvents = computed(() => {
      // This dependency ensures reactivity when favorites change
      const _ = favoritesVersion.value;
      return getFavoriteEvents(allFutureEvents.value);
    });
    
    // Sorted favorite events by date
    const sortedFavoriteEvents = computed(() => {
      return [...favoriteEvents.value].sort((a, b) => {
        // Sort by date first
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        // Then by distance if available
        if (userLocation.value) {
          const distA = distanceToEvent(userLocation.value, a, distanceUnit.value) || Infinity;
          const distB = distanceToEvent(userLocation.value, b, distanceUnit.value) || Infinity;
          return distA - distB;
        }
        return 0;
      });
    });

    // Unique formats count
    const uniqueFormats = computed(() => {
      const formats = new Set();
      allEvents.value.forEach(e => e.format && formats.add(e.format));
      return formats.size;
    });

    // Sort upcoming events by date, then by distance
    const sortedUpcomingEvents = computed(() => {
      const events = [...filteredUpcomingEvents.value];
      
      return events.sort((a, b) => {
        // Primary sort by date
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        // Secondary sort by distance within same date
        if (userLocation.value) {
          const distA = distanceToEvent(userLocation.value, a, distanceUnit.value);
          const distB = distanceToEvent(userLocation.value, b, distanceUnit.value);
          if (distA !== null && distB !== null) {
            return distA - distB;
          }
          if (distA !== null && distB === null) return -1;
          if (distA === null && distB !== null) return 1;
        }
        // Fallback to venue name
        return a.venue.localeCompare(b.venue);
      });
    });

    // Group upcoming events by date
    const groupedUpcomingEvents = computed(() => {
      const groups = {};
      
      sortedUpcomingEvents.value.forEach(event => {
        const date = event.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(event);
      });
      
      // Sort events within each day by distance (closest first)
      if (userLocation.value) {
        Object.keys(groups).forEach(date => {
          groups[date].sort((a, b) => {
            const distA = distanceToEvent(userLocation.value, a, distanceUnit.value);
            const distB = distanceToEvent(userLocation.value, b, distanceUnit.value);
            
            // Events with coordinates come first, sorted by distance
            if (distA !== null && distB !== null) {
              return distA - distB;
            }
            // Events with coordinates before events without
            if (distA !== null && distB === null) return -1;
            if (distA === null && distB !== null) return 1;
            // Both without coordinates - sort by venue name
            return a.venue.localeCompare(b.venue);
          });
        });
      }
      
      return groups;
    });
    
    // Distance-sorted upcoming events (flat list, closest first)
    const distanceSortedUpcomingEvents = computed(() => {
      if (!userLocation.value) {
        return filteredUpcomingEvents.value;
      }
      
      return [...filteredUpcomingEvents.value].sort((a, b) => {
        const distA = distanceToEvent(userLocation.value, a, distanceUnit.value) || Infinity;
        const distB = distanceToEvent(userLocation.value, b, distanceUnit.value) || Infinity;
        if (distA !== distB) {
          return distA - distB;
        }
        // Secondary sort by date if same distance
        return a.date.localeCompare(b.date);
      });
    });
    
    // Check if all upcoming days are collapsed
    const allUpcomingCollapsed = computed(() => {
      const dates = Object.keys(groupedUpcomingEvents.value);
      if (dates.length === 0) return true;
      return dates.every(date => collapsedUpcomingDays.value[date]);
    });

    // Initialize collapsed state for all days
    function initializeCollapsedState() {
      const dates = Object.keys(groupedUpcomingEvents.value);
      dates.forEach(date => {
        if (collapsedUpcomingDays.value[date] === undefined) {
          collapsedUpcomingDays.value[date] = true; // Collapsed by default
        }
      });
    }
    
    // Watch for changes in grouped events to initialize collapse state
    watch(groupedUpcomingEvents, () => {
      initializeCollapsedState();
    }, { immediate: true });

    function getDayName(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    }

    function getMonthName(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    }

    function getDayNum(dateString) {
      const date = new Date(dateString);
      return date.getDate();
    }

    function getDaysUntil(dateString) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(dateString);
      eventDate.setHours(0, 0, 0, 0);
      const diffTime = eventDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : null;
    }

    function getDaysUntilText(dateString) {
      const days = getDaysUntil(dateString);
      if (days === null) return '';
      if (days === 0) return 'Today';
      if (days === 1) return 'Tomorrow';
      if (days <= 7) return `In ${days} days`;
      if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
      return `In ${Math.ceil(days / 30)} months`;
    }

    function getDaysUntilClass(dateString) {
      const days = getDaysUntil(dateString);
      if (days === null) return '';
      if (days === 0) return 'today';
      if (days === 1) return 'tomorrow';
      if (days <= 7) return 'this-week';
      if (days <= 30) return 'this-month';
      return 'later';
    }

    function formatDateShort(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function toggleUpcomingDay(date) {
      collapsedUpcomingDays.value[date] = !collapsedUpcomingDays.value[date];
    }
    
    function toggleAllUpcoming() {
      const newState = !allUpcomingCollapsed.value;
      Object.keys(groupedUpcomingEvents.value).forEach(date => {
        collapsedUpcomingDays.value[date] = newState;
      });
    }

    // Check if event is the closest on its date
    const isClosestEvent = (event) => {
      if (!userLocation.value) return false;
      
      const sameDateEvents = filteredUpcomingEvents.value.filter(e => e.date === event.date);
      if (sameDateEvents.length <= 1) return true;

      const eventDistance = distanceToEvent(userLocation.value, event, distanceUnit.value);
      if (eventDistance === null || eventDistance === undefined) return false;

      const allDistances = sameDateEvents.map(e => {
        const dist = distanceToEvent(userLocation.value, e, distanceUnit.value);
        return dist !== null && dist !== undefined ? dist : Infinity;
      });
      
      const minDistance = Math.min(...allDistances);
      return eventDistance === minDistance;
    };

    // Modal controls
    function openFilterModal(type) {
      activeModal.value = type;
      if (type === 'distance') {
        tempMaxDistance.value = maxDistance.value;
      }
    }
    
    function closeModal() {
      activeModal.value = null;
    }
    
    function applyFilters() {
      closeModal();
    }
    
    function applyDistanceFilter() {
      maxDistance.value = tempMaxDistance.value;
      closeModal();
    }
    
    function clearAllFilters() {
      selectedEventTypes.value = [];
      selectedFormats.value = [];
      selectedStates.value = [];
      maxDistance.value = null;
    }
    
    // Handle favorite toggle from EventCard
    function handleFavoriteToggled({ eventId, isFavorited }) {
      // Increment version to trigger reactivity
      favoritesVersion.value++;
    }
    
    // Clear all favorites with confirmation
    function confirmClearFavorites() {
      if (confirm('Are you sure you want to remove all favorites?')) {
        clearAllFavorites();
        favoritesVersion.value++;
      }
    }

    // Load events data
    async function loadEvents() {
      try {
        const response = await fetch('/events-metadata.json');
        if (!response.ok) {
          throw new Error(`Failed to load events: ${response.statusText}`);
        }
        const data = await response.json();
        allEvents.value = data.events || [];
        
        // Initialize event types selection with all types
        selectedEventTypes.value = [...availableEventTypes.value];
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }

    // Load user configuration
    function loadConfig() {
      const config = getConfig();
      if (config.userLocation && config.userLocation.lat && config.userLocation.lng) {
        userLocation.value = {
          lat: config.userLocation.lat,
          lng: config.userLocation.lng,
          city: config.userLocation.city,
          state: config.userLocation.state
        };
        userLocationSet.value = true;
      }
      if (config.distanceUnit) {
        distanceUnit.value = config.distanceUnit;
      }
    }

    // Handle browser geolocation
    async function handleGeolocation() {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'User-Agent': 'MTG Event Planner/1.0' } }
            );
            const data = await response.json();
            
            const location = {
              lat: latitude,
              lng: longitude,
              city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
              state: data.address?.state || data.address?.state_code || 'Unknown'
            };
            
            handleLocationSet(location);
          } catch (error) {
            const location = {
              lat: latitude,
              lng: longitude,
              city: 'Current Location',
              state: ''
            };
            handleLocationSet(location);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    }

    function handleLocationSet(location) {
      userLocation.value = location;
      userLocationSet.value = true;
      updateUserLocation(location);
    }

    function resetLocation() {
      userLocation.value = null;
      userLocationSet.value = false;
      updateUserLocation(null);
    }

    onMounted(() => {
      loadEvents();
      loadConfig();
    });

    return {
      allEvents,
      allFutureEvents,
      filteredEvents,
      filteredUpcomingEvents,
      sortedUpcomingEvents,
      groupedUpcomingEvents,
      upcomingEventsCount,
      userLocation,
      userLocationSet,
      distanceUnit,
      uniqueFormats,
      handleLocationSet,
      handleGeolocation,
      resetLocation,
      isClosestEvent,
      getDayName,
      getMonthName,
      getDayNum,
      getDaysUntilText,
      getDaysUntilClass,
      formatDateShort,
      collapsedUpcomingDays,
      toggleUpcomingDay,
      toggleAllUpcoming,
      allUpcomingCollapsed,
      // Tabs
      activeTab,
      upcomingSortBy,
      distanceSortedUpcomingEvents,
      // Favorites
      favoriteEvents,
      sortedFavoriteEvents,
      handleFavoriteToggled,
      confirmClearFavorites,
      // Filters
      activeModal,
      openFilterModal,
      closeModal,
      applyFilters,
      applyDistanceFilter,
      clearAllFilters,
      hasActiveFilters,
      selectedEventTypes,
      selectedFormats,
      selectedStates,
      maxDistance,
      tempMaxDistance,
      distancePresets,
      availableEventTypes,
      eventTypeOptions,
      formatOptions,
      stateOptions
    };
  }
}
</script>

<style scoped>
/* ============================================
   App Container
   ============================================ */
.app {
  min-height: 100vh;
  position: relative;
}

/* ============================================
   Ambient Background
   ============================================ */
.ambient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%);
  top: 50%;
  right: -100px;
  animation-delay: -7s;
}

.orb-3 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  bottom: -100px;
  left: 30%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(20px, 30px) scale(1.02); }
}

/* ============================================
   Header
   ============================================ */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(9, 9, 11, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

.logo-icon {
  font-size: 1.5rem;
}

.brand-text h1 {
  font-size: 1.375rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.tagline {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin: 0.125rem 0 0;
}

.location-chip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-base);
}

.location-chip:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.location-pin {
  font-size: 1rem;
}

.location-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.location-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.location-close:hover {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
}

/* ============================================
   Main Content
   ============================================ */
.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ============================================
   Stats Bar
   ============================================ */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1.5rem 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
  animation: slideUp 0.5s ease-out;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-item.clickable {
  cursor: pointer;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.stat-item.clickable:hover {
  background: var(--bg-card-hover);
}

.stat-value {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-primary-light), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-value.favorites-value {
  background: linear-gradient(135deg, #f87171, #fbbf24);
  -webkit-background-clip: text;
  background-clip: text;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border-default);
}

/* ============================================
   Tab Navigation
   ============================================ */
.tab-nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.375rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 1.25rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
  color: white;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}

.tab-btn svg {
  flex-shrink: 0;
}

.tab-count {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  min-width: 24px;
  text-align: center;
}

.tab-btn:not(.active) .tab-count {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.tab-count.has-favorites {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

.tab-btn.active .tab-count.has-favorites {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* ============================================
   Filter Bar
   ============================================ */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.filter-bar-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-bar-label svg {
  color: var(--accent-primary-light);
}

.filter-chips {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  flex-wrap: wrap;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-chip:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.filter-chip.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: var(--accent-primary-light);
}

.chip-icon {
  font-size: 1rem;
}

.chip-count {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  color: #f87171;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-filters-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* ============================================
   Tab Content
   ============================================ */
.tab-content {
  min-height: 400px;
}

/* ============================================
   Events Sections
   ============================================ */
.events-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.5rem;
}

.section-title-group h2 {
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-badge,
.event-total-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.375rem 0.75rem;
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-primary-light);
  border-radius: var(--radius-full);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.event-total-badge.favorites-badge {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.2);
}

.expand-all-btn {
  padding: 0.5rem 0.875rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.expand-all-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

/* Sort Toggle */
.section-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sort-toggle {
  display: flex;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0.25rem;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.sort-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.sort-btn.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
}

.sort-btn svg {
  flex-shrink: 0;
}

/* Events sorted by distance (flat list) */
.events-distance-sorted {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.clear-favorites-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  color: #f87171;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-favorites-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* ============================================
   Empty State
   ============================================ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--bg-card);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.empty-state p {
  font-size: 0.9375rem;
  color: var(--text-tertiary);
  margin: 0 0 1.5rem;
  max-width: 300px;
}

.empty-action {
  padding: 0.75rem 1.25rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.empty-action:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-primary);
  color: var(--accent-primary-light);
}

.favorites-empty .empty-icon {
  opacity: 0.3;
}

/* ============================================
   Favorites List
   ============================================ */
.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ============================================
   Events Timeline
   ============================================ */
.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-day {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
}

.timeline-day:hover {
  border-color: var(--border-default);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.timeline-header:hover {
  background: var(--bg-card-hover);
}

.timeline-date {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.timeline-date .date-month {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-primary-light);
}

.timeline-date .date-day-num {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.timeline-date .date-weekday {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.timeline-date .days-until-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
  margin-left: 0.5rem;
}

.timeline-date .days-until-badge.today {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.timeline-date .days-until-badge.tomorrow {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.timeline-date .days-until-badge.this-week {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.timeline-date .days-until-badge.this-month {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-primary-light);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.timeline-date .days-until-badge.later {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.event-count-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 0.25rem 0.625rem;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
}

.expand-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
}

.expand-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.expand-btn.collapsed {
  transform: rotate(-90deg);
}

.timeline-events {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timeline-events.collapsed {
  display: none;
}

/* ============================================
   Distance Modal
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.distance-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-icon {
  font-size: 1.25rem;
}

.modal-header h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  display: flex;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.distance-content {
  padding: 1.5rem;
}

.distance-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1.25rem;
}

.distance-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  margin-bottom: 1.25rem;
}

.distance-preset {
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.distance-preset:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.distance-preset.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: var(--accent-primary);
  color: var(--accent-primary-light);
}

.distance-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.distance-input-group label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}

.distance-input {
  padding: 0.75rem 1rem;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: all var(--transition-fast);
}

.distance-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--glow-accent);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-card);
}

.btn-secondary {
  padding: 0.625rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .distance-modal,
.modal-leave-active .distance-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .distance-modal,
.modal-leave-to .distance-modal {
  transform: scale(0.95) translateY(-10px);
}

/* ============================================
   Footer
   ============================================ */
.app-footer {
  text-align: center;
  padding: 2rem;
  margin-top: 2rem;
  border-top: 1px solid var(--border-subtle);
}

.app-footer p {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* ============================================
   Responsive Design
   ============================================ */
@media (max-width: 768px) {
  .header-container {
    padding: 1rem;
  }
  
  .app-main {
    padding: 1rem;
  }
  
  .stats-bar {
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1rem;
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-item {
    flex: 1;
    min-width: 80px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .brand-text h1 {
    font-size: 1.125rem;
  }
  
  .logo {
    width: 40px;
    height: 40px;
  }
  
  .logo-icon {
    font-size: 1.25rem;
  }
  
  .tab-nav {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: flex-start;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-chips {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .location-chip {
    width: 100%;
    justify-content: center;
  }
  
  .header-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .brand {
    justify-content: center;
  }
  
  .filter-chip {
    flex: 1;
    justify-content: center;
  }
  
  .tab-btn span:not(.tab-count) {
    display: none;
  }
  
  .tab-btn {
    padding: 0.75rem;
  }
}
</style>
