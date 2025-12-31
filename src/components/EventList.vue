<template>
  <div class="event-list">
    <!-- List Header -->
    <div class="list-header">
      <div class="results-info">
        <h3>{{ events.length }} <span>event{{ events.length !== 1 ? 's' : '' }} found</span></h3>
      </div>
      
      <div class="list-actions">
        <button class="expand-collapse-btn" @click="toggleAll">
          {{ allCollapsed ? 'Expand All' : 'Collapse All' }}
        </button>
        
        <div class="sort-controls">
          <label for="sort-by">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="16" y2="12"/>
              <line x1="4" y1="18" x2="12" y2="18"/>
            </svg>
            Sort
          </label>
          <select id="sort-by" v-model="sortBy" @change="applySort" class="sort-select">
            <option value="date">Date</option>
            <option value="distance">Distance</option>
            <option value="venue">Venue</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="events.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <h3>No events found</h3>
      <p>Try adjusting your filters to see more results</p>
    </div>

    <!-- Events Grid -->
    <div v-else class="events-container">
      <div
        v-for="(dayGroup, date) in groupedEvents"
        :key="date"
        class="day-section stagger-item"
      >
        <!-- Day Header -->
        <div class="day-header" @click="toggleDay(date)">
          <div class="day-info">
            <div class="day-indicator">
              <span class="day-month">{{ getMonthName(date) }}</span>
              <span class="day-num">{{ getDayNum(date) }}</span>
              <span class="day-weekday">({{ getDayName(date) }})</span>
              <span class="days-until-badge" :class="getDaysUntilClass(date)">{{ getDaysUntilText(date) }}</span>
            </div>
          </div>
          
          <div class="day-actions">
            <svg v-if="hasGroupFavorite(dayGroup)" class="group-favorite-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span class="events-count">{{ dayGroup.length }}</span>
            <button class="collapse-btn" :class="{ collapsed: collapsedDays[date] }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Day Events -->
        <div class="day-events" :class="{ collapsed: collapsedDays[date] }">
          <EventCard
            v-for="(event, index) in dayGroup"
            :key="event.id"
            :event="event"
            :user-location="userLocation"
            :distance-unit="distanceUnit"
            :is-closest="!!userLocation && index === 0"
            :is-farther="!!userLocation && index > 0"
            @favorite-toggled="$emit('favorite-toggled', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import EventCard from './EventCard.vue';
import { distanceToEvent } from '../utils/distance';
import { isFavorite } from '../utils/favorites';

export default {
  name: 'EventList',
  components: {
    EventCard
  },
  props: {
    events: {
      type: Array,
      required: true
    },
    userLocation: {
      type: Object,
      default: null
    },
    distanceUnit: {
      type: String,
      default: 'mi'
    },
    defaultCollapsed: {
      type: Boolean,
      default: true
    }
  },
  emits: ['favorite-toggled'],
  setup(props, { emit }) {
    const sortBy = ref('date');
    const collapsedDays = ref({});

    const sortedEvents = computed(() => {
      const events = [...props.events];
      
      switch (sortBy.value) {
        case 'distance':
          return events.sort((a, b) => {
            if (!props.userLocation) return 0;
            const distA = distanceToEvent(props.userLocation, a, props.distanceUnit);
            const distB = distanceToEvent(props.userLocation, b, props.distanceUnit);
            // Events with coordinates come first
            if (distA !== null && distB !== null) return distA - distB;
            if (distA !== null && distB === null) return -1;
            if (distA === null && distB !== null) return 1;
            // Fallback to date
            return a.date.localeCompare(b.date);
          });
        case 'venue':
          return events.sort((a, b) => a.venue.localeCompare(b.venue));
        case 'date':
        default:
          return events.sort((a, b) => {
            // Primary sort by date
            if (a.date !== b.date) {
              return a.date.localeCompare(b.date);
            }
            // Secondary sort by distance within same date
            if (props.userLocation) {
              const distA = distanceToEvent(props.userLocation, a, props.distanceUnit);
              const distB = distanceToEvent(props.userLocation, b, props.distanceUnit);
              if (distA !== null && distB !== null) {
                return distA - distB;
              }
              if (distA !== null && distB === null) return -1;
              if (distA === null && distB !== null) return 1;
            }
            // Tertiary sort by time
            if (a.time && b.time) {
              return a.time.localeCompare(b.time);
            }
            // Final fallback to venue name
            return a.venue.localeCompare(b.venue);
          });
      }
    });

    const groupedEvents = computed(() => {
      const groups = {};
      
      sortedEvents.value.forEach(event => {
        const date = event.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(event);
      });
      
      // Sort events within each day by distance (closest first)
      if (props.userLocation) {
        Object.keys(groups).forEach(date => {
          groups[date].sort((a, b) => {
            const distA = distanceToEvent(props.userLocation, a, props.distanceUnit);
            const distB = distanceToEvent(props.userLocation, b, props.distanceUnit);
            
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
    
    // Check if all days are collapsed
    const allCollapsed = computed(() => {
      const dates = Object.keys(groupedEvents.value);
      if (dates.length === 0) return true;
      return dates.every(date => collapsedDays.value[date]);
    });
    
    // Initialize collapsed state for new dates
    function initializeCollapsedState() {
      const dates = Object.keys(groupedEvents.value);
      dates.forEach(date => {
        if (collapsedDays.value[date] === undefined) {
          collapsedDays.value[date] = props.defaultCollapsed;
        }
      });
    }
    
    // Watch for changes in grouped events
    watch(groupedEvents, () => {
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

    function formatDateCompact(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }

    function formatDateHeader(dateString) {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    function applySort() {
      // Sort is handled by computed property
    }

    function toggleDay(date) {
      collapsedDays.value[date] = !collapsedDays.value[date];
    }
    
    function toggleAll() {
      const newState = !allCollapsed.value;
      Object.keys(groupedEvents.value).forEach(date => {
        collapsedDays.value[date] = newState;
      });
    }

    // Check if any event in a group is favorited
    function hasGroupFavorite(events) {
      return events.some(event => isFavorite(event.id));
    }

    return {
      sortBy,
      sortedEvents,
      groupedEvents,
      hasGroupFavorite,
      collapsedDays,
      allCollapsed,
      getDayName,
      getMonthName,
      getDayNum,
      getDaysUntilText,
      getDaysUntilClass,
      formatDateCompact,
      formatDateHeader,
      applySort,
      toggleDay,
      toggleAll
    };
  }
}
</script>

<style scoped>
/* ============================================
   Event List Container
   ============================================ */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ============================================
   List Header
   ============================================ */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-subtle);
}

.results-info h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.results-info h3 span {
  color: var(--text-tertiary);
  font-weight: 400;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.expand-collapse-btn {
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

.expand-collapse-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sort-controls label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.sort-controls svg {
  color: var(--text-muted);
}

.sort-select {
  padding: 0.5rem 0.875rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  appearance: none;
  padding-right: 2rem;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
}

.sort-select:hover {
  border-color: var(--border-strong);
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--glow-accent);
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
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon svg {
  color: var(--text-muted);
}

.empty-state h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.empty-state p {
  font-size: 0.9375rem;
  color: var(--text-tertiary);
  margin: 0;
}

/* ============================================
   Events Container
   ============================================ */
.events-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ============================================
   Day Section
   ============================================ */
.day-section {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);
}

.day-section:hover {
  border-color: var(--border-default);
}

/* ============================================
   Day Header
   ============================================ */
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--border-subtle);
}

.day-header:hover {
  background: var(--bg-card-hover);
}

.day-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.day-indicator {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
}

.day-month {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-primary-light);
}

.day-num {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.day-weekday {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.days-until-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
  margin-left: 0.5rem;
}

.days-until-badge.today {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.days-until-badge.tomorrow {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.days-until-badge.this-week {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.days-until-badge.this-month {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-primary-light);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.days-until-badge.later {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.day-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-favorite-icon {
  color: #f87171;
  flex-shrink: 0;
}

.events-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-primary-light);
  background: rgba(139, 92, 246, 0.15);
  border-radius: var(--radius-full);
}

.collapse-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
}

.collapse-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.collapse-btn.collapsed {
  transform: rotate(-90deg);
}

/* ============================================
   Day Events
   ============================================ */
.day-events {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
}

.day-events.collapsed {
  display: none;
}

/* ============================================
   Responsive Design
   ============================================ */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .list-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .sort-select {
    flex: 1;
    max-width: 150px;
  }
}
</style>
