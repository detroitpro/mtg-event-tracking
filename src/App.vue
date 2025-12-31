<template>
  <div class="app">
    <AmbientBackground />
    
    <AppHeader 
      :user-location="userLocation" 
      @reset-location="resetLocation" 
    />

    <main class="app-main">
      <LocationConfig 
        v-if="!userLocationSet"
        @location-set="handleLocationSet"
        @use-geolocation="handleGeolocation"
      />
      
      <div v-else class="main-content animate-fadeIn">
        <StatsBar 
          :upcoming-count="upcomingEventsCount"
          :all-count="allFutureEvents.length"
          :favorites-count="favoriteEvents.length"
          @view-favorites="activeTab = 'favorites'"
        />

        <TabNav 
          v-model="activeTab"
          :upcoming-count="upcomingEventsCount"
          :all-count="allFutureEvents.length"
          :favorites-count="favoriteEvents.length"
        />

        <!-- Shared Agenda Banner -->
        <div v-if="isSharedView" class="shared-agenda-banner">
          <div class="shared-banner-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>You're viewing a shared agenda</span>
          </div>
          <button class="exit-shared-btn" @click="exitSharedView">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Exit Shared View
          </button>
        </div>

        <FilterBar 
          v-if="activeTab !== 'favorites' && !isSharedView"
          :selected-event-types="selectedEventTypes"
          :selected-formats="selectedFormats"
          :selected-states="selectedStates"
          :max-distance="maxDistance"
          :total-event-types="availableEventTypes.length"
          :show-my-agenda="showMyAgenda"
          :has-favorites="favoriteEvents.length > 0"
          @open-modal="openFilterModal"
          @clear-filters="clearAllFilters"
          @toggle-agenda="toggleMyAgenda"
          @share-agenda="shareAgenda"
        />

        <div class="tab-content">
          <UpcomingEvents 
            v-if="activeTab === 'upcoming'"
            :events="filteredUpcomingEvents"
            :user-location="userLocation"
            :distance-unit="distanceUnit"
            v-model:sort-by="upcomingSortBy"
            @view-all="activeTab = 'all'"
            @favorite-toggled="handleFavoriteToggled"
          />

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

          <FavoritesSection 
            v-if="activeTab === 'favorites'"
            :events="favoriteEvents"
            :user-location="userLocation"
            :distance-unit="distanceUnit"
            @clear-all="confirmClearFavorites"
            @browse-events="activeTab = 'all'"
            @favorite-toggled="handleFavoriteToggled"
          />
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
    
    <DistanceModal
      :is-open="activeModal === 'distance'"
      v-model="maxDistance"
      @close="closeModal"
    />

    <footer class="app-footer" v-if="userLocationSet">
      <p>Data updated regularly • Built for the MTG community</p>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import AmbientBackground from './components/AmbientBackground.vue';
import AppHeader from './components/AppHeader.vue';
import StatsBar from './components/StatsBar.vue';
import TabNav from './components/TabNav.vue';
import FilterBar from './components/FilterBar.vue';
import UpcomingEvents from './components/UpcomingEvents.vue';
import FavoritesSection from './components/FavoritesSection.vue';
import DistanceModal from './components/DistanceModal.vue';
import LocationConfig from './components/LocationConfig.vue';
import EventList from './components/EventList.vue';
import FilterModal from './components/FilterModal.vue';
import { getConfig, updateUserLocation } from './utils/config';
import { distanceToEvent } from './utils/distance';
import { getFavoriteEvents, clearAllFavorites, isFavorite } from './utils/favorites';

export default {
  name: 'App',
  components: {
    AmbientBackground,
    AppHeader,
    StatsBar,
    TabNav,
    FilterBar,
    UpcomingEvents,
    FavoritesSection,
    DistanceModal,
    LocationConfig,
    EventList,
    FilterModal
  },
  setup() {
    const allEvents = ref([]);
    const userLocation = ref(null);
    const userLocationSet = ref(false);
    const distanceUnit = ref('mi');
    
    // Tab state
    const activeTab = ref('upcoming');
    const upcomingSortBy = ref('date');
    
    // Favorites tracking (reactive)
    const favoritesVersion = ref(0);
    
    // Filter state
    const activeModal = ref(null);
    const selectedEventTypes = ref([]);
    const selectedFormats = ref([]);
    const selectedStates = ref([]);
    const maxDistance = ref(null);
    const showMyAgenda = ref(false);
    
    // Shared agenda state
    const isSharedView = ref(false);
    const sharedEventIds = ref(new Set());

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

    // Filter all future events
    // Get dates that have at least one favorited event
    const datesWithFavorites = computed(() => {
      const _ = favoritesVersion.value; // Dependency for reactivity
      const dates = new Set();
      allFutureEvents.value.forEach(event => {
        if (isFavorite(event.id)) {
          dates.add(event.date);
        }
      });
      return dates;
    });

    const filteredEvents = computed(() => {
      let filtered = [...allFutureEvents.value];
      
      if (selectedEventTypes.value.length > 0) {
        filtered = filtered.filter(e => selectedEventTypes.value.includes(e.type));
      }
      
      if (selectedFormats.value.length > 0) {
        filtered = filtered.filter(e => selectedFormats.value.includes(e.format));
      }
      
      if (selectedStates.value.length > 0) {
        filtered = filtered.filter(e => selectedStates.value.includes(e.state));
      }
      
      if (maxDistance.value && userLocation.value) {
        filtered = filtered.filter(e => {
          if (!e.coordinates) return true;
          const dist = distanceToEvent(userLocation.value, e, distanceUnit.value);
          return dist !== null && dist <= maxDistance.value;
        });
      }
      
      // Filter to only show events on days with favorites (My Agenda)
      if (showMyAgenda.value) {
        filtered = filtered.filter(e => datesWithFavorites.value.has(e.date));
      }
      
      // Filter for shared view - only show specific events
      if (isSharedView.value && sharedEventIds.value.size > 0) {
        filtered = filtered.filter(e => sharedEventIds.value.has(e.id));
      }
      
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
      const _ = favoritesVersion.value;
      return getFavoriteEvents(allFutureEvents.value);
    });

    // Modal controls
    function openFilterModal(type) {
      activeModal.value = type;
    }
    
    function closeModal() {
      activeModal.value = null;
    }
    
    function applyFilters() {
      closeModal();
    }
    
    function clearAllFilters() {
      selectedEventTypes.value = [];
      selectedFormats.value = [];
      selectedStates.value = [];
      maxDistance.value = null;
      showMyAgenda.value = false;
    }

    function toggleMyAgenda() {
      showMyAgenda.value = !showMyAgenda.value;
    }

    // Share agenda - create URL with encoded event IDs
    function shareAgenda() {
      const favorites = favoriteEvents.value.map(e => e.id);
      if (favorites.length === 0) {
        alert('No events to share. Add some favorites first!');
        return;
      }
      
      // Encode favorites as base64
      const encoded = btoa(JSON.stringify(favorites));
      const shareUrl = `${window.location.origin}${window.location.pathname}?agenda=${encoded}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Share link copied to clipboard!\n\nAnyone with this link can see your ${favorites.length} event agenda.`);
      }).catch(() => {
        // Fallback for older browsers
        prompt('Copy this link to share your agenda:', shareUrl);
      });
    }

    // Check URL for shared agenda on mount
    function checkSharedAgenda() {
      const urlParams = new URLSearchParams(window.location.search);
      const agendaParam = urlParams.get('agenda');
      
      if (agendaParam) {
        try {
          const decoded = JSON.parse(atob(agendaParam));
          if (Array.isArray(decoded) && decoded.length > 0) {
            sharedEventIds.value = new Set(decoded);
            isSharedView.value = true;
            activeTab.value = 'all'; // Show all events tab for shared view
          }
        } catch (e) {
          console.error('Invalid shared agenda URL:', e);
        }
      }
    }

    // Exit shared view and return to normal
    function exitSharedView() {
      isSharedView.value = false;
      sharedEventIds.value = new Set();
      // Remove the agenda param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('agenda');
      window.history.replaceState({}, '', url.pathname);
    }
    
    // Handle favorite toggle from EventCard
    function handleFavoriteToggled() {
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
      checkSharedAgenda();
    });

    return {
      allEvents,
      allFutureEvents,
      filteredEvents,
      filteredUpcomingEvents,
      upcomingEventsCount,
      userLocation,
      userLocationSet,
      distanceUnit,
      handleLocationSet,
      handleGeolocation,
      resetLocation,
      // Tabs
      activeTab,
      upcomingSortBy,
      // Favorites
      favoriteEvents,
      handleFavoriteToggled,
      confirmClearFavorites,
      // Filters
      activeModal,
      openFilterModal,
      closeModal,
      applyFilters,
      clearAllFilters,
      selectedEventTypes,
      selectedFormats,
      selectedStates,
      maxDistance,
      showMyAgenda,
      toggleMyAgenda,
      isSharedView,
      shareAgenda,
      exitSharedView,
      availableEventTypes,
      eventTypeOptions,
      formatOptions,
      stateOptions
    };
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  position: relative;
}

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

.tab-content {
  min-height: 400px;
}

/* Shared Agenda Banner */
.shared-agenda-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-lg);
  margin-bottom: 1rem;
}

.shared-banner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

.shared-banner-content svg {
  flex-shrink: 0;
}

.exit-shared-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.exit-shared-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

/* All Events Section */
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

/* Footer */
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

/* Responsive */
@media (max-width: 768px) {
  .app-main {
    padding: 1rem;
  }
}
</style>
