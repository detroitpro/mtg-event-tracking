<template>
  <section class="events-section upcoming-section">
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
            :class="{ active: sortBy === 'date' }"
            @click="$emit('update:sortBy', 'date')"
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
            :class="{ active: sortBy === 'distance' }"
            @click="$emit('update:sortBy', 'distance')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            By Distance
          </button>
        </div>
        <button 
          v-if="Object.keys(groupedEvents).length > 0 && sortBy === 'date'" 
          class="expand-all-btn" 
          @click="toggleAll"
        >
          {{ allCollapsed ? 'Expand All' : 'Collapse All' }}
        </button>
      </div>
    </div>
    
    <div v-if="events.length === 0" class="empty-state">
      <div class="empty-icon">⚡</div>
      <h3>No upcoming events</h3>
      <p>No events found in the next 3 weeks matching your filters</p>
      <button class="empty-action" @click="$emit('view-all')">View All Events →</button>
    </div>
    
    <!-- Sorted by Date (Grouped) -->
    <div v-else-if="sortBy === 'date'" class="events-timeline">
      <div
        v-for="(dayGroup, date) in groupedEvents"
        :key="date"
        class="timeline-day stagger-item"
      >
        <div class="timeline-header" @click="toggleDay(date)">
          <div class="timeline-date">
            <span class="date-month">{{ getMonthName(date) }}</span>
            <span class="date-day-num">{{ getDayNum(date) }}</span>
            <span class="date-weekday">({{ getDayName(date) }})</span>
            <span class="days-until-badge" :class="getDaysUntilClass(date)">{{ getDaysUntilText(date) }}</span>
          </div>
          <div class="timeline-meta">
            <span class="event-count-badge">{{ dayGroup.length }} event{{ dayGroup.length !== 1 ? 's' : '' }}</span>
            <button class="expand-btn" :class="{ collapsed: collapsedDays[date] }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="timeline-events" :class="{ collapsed: collapsedDays[date] }">
          <EventCard
            v-for="(event, index) in dayGroup"
            :key="event.id"
            :event="event"
            :user-location="userLocation"
            :distance-unit="distanceUnit"
            :is-closest="userLocation && index === 0"
            :is-farther="!!userLocation && index > 0"
            :is-upcoming="true"
            @favorite-toggled="$emit('favorite-toggled', $event)"
          />
        </div>
      </div>
    </div>
    
    <!-- Sorted by Distance (Flat List) -->
    <div v-else class="events-distance-sorted">
      <EventCard
        v-for="(event, index) in distanceSortedEvents"
        :key="event.id"
        :event="event"
        :user-location="userLocation"
        :distance-unit="distanceUnit"
        :is-closest="index === 0"
        :is-farther="index > 0"
        :is-upcoming="true"
        @favorite-toggled="$emit('favorite-toggled', $event)"
      />
    </div>
  </section>
</template>

<script>
import { ref, computed, watch } from 'vue';
import EventCard from './EventCard.vue';
import { distanceToEvent } from '../utils/distance';

export default {
  name: 'UpcomingEvents',
  components: {
    EventCard
  },
  props: {
    events: {
      type: Array,
      default: () => []
    },
    userLocation: {
      type: Object,
      default: null
    },
    distanceUnit: {
      type: String,
      default: 'mi'
    },
    sortBy: {
      type: String,
      default: 'date'
    }
  },
  emits: ['update:sortBy', 'view-all', 'favorite-toggled'],
  setup(props) {
    const collapsedDays = ref({});

    // Sort events by date, then by distance
    const sortedEvents = computed(() => {
      const events = [...props.events];
      
      return events.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        if (props.userLocation) {
          const distA = distanceToEvent(props.userLocation, a, props.distanceUnit);
          const distB = distanceToEvent(props.userLocation, b, props.distanceUnit);
          if (distA !== null && distB !== null) {
            return distA - distB;
          }
          if (distA !== null && distB === null) return -1;
          if (distA === null && distB !== null) return 1;
        }
        return a.venue.localeCompare(b.venue);
      });
    });

    // Group events by date
    const groupedEvents = computed(() => {
      const groups = {};
      
      sortedEvents.value.forEach(event => {
        const date = event.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(event);
      });
      
      // Sort events within each day by distance
      if (props.userLocation) {
        Object.keys(groups).forEach(date => {
          groups[date].sort((a, b) => {
            const distA = distanceToEvent(props.userLocation, a, props.distanceUnit);
            const distB = distanceToEvent(props.userLocation, b, props.distanceUnit);
            
            if (distA !== null && distB !== null) {
              return distA - distB;
            }
            if (distA !== null && distB === null) return -1;
            if (distA === null && distB !== null) return 1;
            return a.venue.localeCompare(b.venue);
          });
        });
      }
      
      return groups;
    });
    
    // Distance-sorted events (flat list)
    const distanceSortedEvents = computed(() => {
      if (!props.userLocation) {
        return props.events;
      }
      
      return [...props.events].sort((a, b) => {
        const distA = distanceToEvent(props.userLocation, a, props.distanceUnit) || Infinity;
        const distB = distanceToEvent(props.userLocation, b, props.distanceUnit) || Infinity;
        if (distA !== distB) {
          return distA - distB;
        }
        return a.date.localeCompare(b.date);
      });
    });
    
    // Check if all days are collapsed
    const allCollapsed = computed(() => {
      const dates = Object.keys(groupedEvents.value);
      if (dates.length === 0) return true;
      return dates.every(date => collapsedDays.value[date]);
    });

    // Initialize collapsed state for all days
    function initializeCollapsedState() {
      const dates = Object.keys(groupedEvents.value);
      dates.forEach(date => {
        if (collapsedDays.value[date] === undefined) {
          collapsedDays.value[date] = true;
        }
      });
    }
    
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

    function toggleDay(date) {
      collapsedDays.value[date] = !collapsedDays.value[date];
    }
    
    function toggleAll() {
      const newState = !allCollapsed.value;
      Object.keys(groupedEvents.value).forEach(date => {
        collapsedDays.value[date] = newState;
      });
    }

    return {
      collapsedDays,
      groupedEvents,
      distanceSortedEvents,
      allCollapsed,
      getDayName,
      getMonthName,
      getDayNum,
      getDaysUntilText,
      getDaysUntilClass,
      toggleDay,
      toggleAll
    };
  }
}
</script>

<style scoped>
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

.section-badge {
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

/* Empty State */
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

/* Events sorted by distance */
.events-distance-sorted {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Events Timeline */
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
</style>
