<template>
  <section class="events-section favorites-section">
    <div class="section-header">
      <div class="section-title-group">
        <span class="section-icon">❤️</span>
        <h2>Your Favorites</h2>
        <span v-if="events.length > 0" class="event-total-badge favorites-badge">{{ events.length }} saved</span>
      </div>
      <button v-if="events.length > 0" class="clear-favorites-btn" @click="$emit('clear-all')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Clear All
      </button>
    </div>
    
    <div v-if="events.length === 0" class="empty-state favorites-empty">
      <div class="empty-icon">❤️</div>
      <h3>No favorites yet</h3>
      <p>Click the heart icon on any event to save it here for quick access</p>
      <button class="empty-action" @click="$emit('browse-events')">Browse All Events →</button>
    </div>
    
    <div v-else class="favorites-list">
      <EventCard
        v-for="event in sortedEvents"
        :key="event.id"
        :event="event"
        :user-location="userLocation"
        :distance-unit="distanceUnit"
        :is-closest="false"
        :is-farther="false"
        :is-upcoming="false"
        @favorite-toggled="$emit('favorite-toggled', $event)"
      />
    </div>
  </section>
</template>

<script>
import { computed } from 'vue';
import EventCard from './EventCard.vue';
import { distanceToEvent } from '../utils/distance';

export default {
  name: 'FavoritesSection',
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
    }
  },
  emits: ['clear-all', 'browse-events', 'favorite-toggled'],
  setup(props) {
    const sortedEvents = computed(() => {
      return [...props.events].sort((a, b) => {
        // Sort by date first
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        // Then by distance if available
        if (props.userLocation) {
          const distA = distanceToEvent(props.userLocation, a, props.distanceUnit) || Infinity;
          const distB = distanceToEvent(props.userLocation, b, props.distanceUnit) || Infinity;
          return distA - distB;
        }
        return 0;
      });
    });

    return {
      sortedEvents
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

.favorites-empty .empty-icon {
  opacity: 0.3;
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

/* Favorites List */
.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
