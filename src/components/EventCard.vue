<template>
  <article 
    class="event-card" 
    :class="[
      eventTypeClass, 
      { 
        'is-closest': isClosest, 
        'is-farther': isFarther, 
        'is-upcoming': isUpcoming,
        'is-favorited': isFavorited
      }
    ]"
  >
    <!-- Glow effect for closest -->
    <div v-if="isClosest" class="card-glow"></div>
    
    <!-- Favorite Button -->
    <button 
      class="favorite-btn" 
      :class="{ active: isFavorited }"
      @click.stop="handleToggleFavorite"
      :title="isFavorited ? 'Remove from favorites' : 'Add to favorites'"
    >
      <svg v-if="isFavorited" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
    
    <!-- Prominent Date Banner -->
    <div class="date-banner" :class="dateBannerClass">
      <div class="date-main">
        <span class="date-month">{{ monthName }}</span>
        <span class="date-day">{{ dayOfMonth }}</span>
        <span class="date-weekday">({{ weekdayName }})</span>
      </div>
      <div v-if="event.time" class="date-meta">
        <span class="event-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {{ event.time }}
        </span>
      </div>
    </div>
    
    <!-- Card Header with badges -->
    <div class="card-header">
      <div class="badges">
        <span class="type-badge" :class="typeBadgeClass">
          {{ event.type }}
        </span>
        <span v-if="isClosest" class="closest-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
          </svg>
          Closest
        </span>
      </div>
      
      <div v-if="distance !== null" class="distance-pill">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{{ formatDistance(distance, distanceUnit) }}</span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <div class="venue-info">
        <h3 class="venue-name">{{ event.venue }}</h3>
        <p class="venue-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {{ event.city }}, {{ event.state }}
        </p>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Format</span>
          <span class="detail-value format-value">{{ event.format }}</span>
        </div>
        
        <div v-if="event.address" class="detail-item full-width">
          <span class="detail-label">Address</span>
          <span class="detail-value">{{ event.address }}</span>
        </div>
        
        <div v-if="event.notes" class="detail-item full-width">
          <span class="detail-label">Notes</span>
          <span class="detail-value notes">{{ event.notes }}</span>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="card-footer" v-if="event.eventLink || event.website">
      <a 
        v-if="event.eventLink" 
        :href="event.eventLink" 
        target="_blank"
        rel="noopener noreferrer"
        class="action-link primary"
      >
        <span>Event Details</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17l9.2-9.2M17 17V7H7"/>
        </svg>
      </a>
      <a 
        v-if="event.website && event.website !== event.eventLink" 
        :href="event.website" 
        target="_blank"
        rel="noopener noreferrer"
        class="action-link secondary"
      >
        <span>Store Website</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17l9.2-9.2M17 17V7H7"/>
        </svg>
      </a>
    </div>
  </article>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { distanceToEvent, formatDistance } from '../utils/distance';
import { getOrCalculateDistance } from '../utils/distanceCache';
import { isFavorite, toggleFavorite } from '../utils/favorites';

export default {
  name: 'EventCard',
  props: {
    event: {
      type: Object,
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
    isClosest: {
      type: Boolean,
      default: false
    },
    isUpcoming: {
      type: Boolean,
      default: false
    }
  },
  emits: ['favorite-toggled'],
  setup(props, { emit }) {
    const distance = ref(null);
    const isFavorited = ref(false);

    const eventTypeClass = computed(() => {
      return `type-${props.event.type.toLowerCase().replace(/\s+/g, '-')}`;
    });

    const typeBadgeClass = computed(() => {
      const type = props.event.type.toLowerCase();
      if (type === 'rcq') return 'badge-success';
      if (type === 'rc') return 'badge-primary';
      if (type === 'magic spotlight') return 'badge-warning';
      return 'badge-default';
    });

    const isFarther = computed(() => {
      return props.isUpcoming && !props.isClosest && props.userLocation;
    });

    // Date parsing for prominent display
    const eventDate = computed(() => new Date(props.event.date));
    
    const weekdayName = computed(() => {
      return eventDate.value.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    const dayOfMonth = computed(() => {
      return eventDate.value.getDate();
    });
    
    const monthName = computed(() => {
      return eventDate.value.toLocaleDateString('en-US', { month: 'short' });
    });
    
    // Days until event
    const daysUntil = computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const event = new Date(props.event.date);
      event.setHours(0, 0, 0, 0);
      const diffTime = event - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : null;
    });
    
    const daysUntilText = computed(() => {
      if (daysUntil.value === null) return '';
      if (daysUntil.value === 0) return 'Today';
      if (daysUntil.value === 1) return 'Tomorrow';
      if (daysUntil.value <= 7) return `In ${daysUntil.value} days`;
      if (daysUntil.value <= 30) return `In ${Math.ceil(daysUntil.value / 7)} weeks`;
      return `In ${Math.ceil(daysUntil.value / 30)} months`;
    });
    
    const daysUntilClass = computed(() => {
      if (daysUntil.value === null) return '';
      if (daysUntil.value === 0) return 'today';
      if (daysUntil.value === 1) return 'tomorrow';
      if (daysUntil.value <= 7) return 'this-week';
      if (daysUntil.value <= 30) return 'this-month';
      return 'later';
    });
    
    const dateBannerClass = computed(() => {
      if (daysUntil.value === 0) return 'date-today';
      if (daysUntil.value === 1) return 'date-tomorrow';
      if (daysUntil.value <= 7) return 'date-soon';
      return '';
    });

    const formattedDate = computed(() => {
      const date = new Date(props.event.date);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    });

    // Calculate distance with caching
    function calculateDistance() {
      if (props.userLocation && props.event.coordinates) {
        distance.value = getOrCalculateDistance(
          props.userLocation,
          props.event,
          () => distanceToEvent(props.userLocation, props.event, props.distanceUnit)
        );
      } else {
        distance.value = null;
      }
    }
    
    // Check favorite status
    function checkFavorite() {
      isFavorited.value = isFavorite(props.event.id);
    }
    
    // Handle favorite toggle
    function handleToggleFavorite() {
      const newStatus = toggleFavorite(props.event.id);
      isFavorited.value = newStatus;
      emit('favorite-toggled', { eventId: props.event.id, isFavorited: newStatus });
    }

    // Watch for location changes - immediate to ensure calculation on first render
    watch(() => props.userLocation, () => {
      calculateDistance();
    }, { deep: true, immediate: true });
    
    // Watch for event changes
    watch(() => props.event, () => {
      calculateDistance();
      checkFavorite();
    }, { deep: true, immediate: true });
    
    // Watch for distance unit changes
    watch(() => props.distanceUnit, () => {
      calculateDistance();
    });

    onMounted(() => {
      checkFavorite();
    });

    return {
      distance,
      eventTypeClass,
      typeBadgeClass,
      formattedDate,
      formatDistance,
      isFarther,
      isFavorited,
      handleToggleFavorite,
      weekdayName,
      dayOfMonth,
      monthName,
      daysUntil,
      daysUntilText,
      daysUntilClass,
      dateBannerClass
    };
  }
}
</script>

<style scoped>
/* ============================================
   Event Card - Glassmorphism Style
   ============================================ */
.event-card {
  position: relative;
  background: rgba(23, 23, 28, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--transition-base);
}

.event-card:hover {
  background: rgba(30, 30, 38, 0.6);
  border-color: var(--border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Favorited styling */
.event-card.is-favorited {
  border-color: rgba(239, 68, 68, 0.3);
}

/* Closest Event Styling */
.event-card.is-closest {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(30, 30, 38, 0.7);
}

.event-card.is-closest:hover {
  border-color: rgba(245, 158, 11, 0.5);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary), var(--accent-secondary));
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

/* Farther Events (de-emphasized) */
.event-card.is-farther {
  opacity: 0.65;
}

.event-card.is-farther:hover {
  opacity: 0.9;
}

/* ============================================
   Favorite Button
   ============================================ */
.favorite-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
  transform: scale(1.1);
}

.favorite-btn.active {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
}

.favorite-btn.active:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* ============================================
   Prominent Date Banner
   ============================================ */
.date-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  padding-right: 3.5rem; /* Space for favorite button */
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05));
  border-bottom: 1px solid var(--border-subtle);
}

.date-banner.date-today {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.1));
}

.date-banner.date-tomorrow {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.08));
}

.date-banner.date-soon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
}

.date-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.date-month {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-primary-light);
  text-transform: uppercase;
}

.date-day {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.date-weekday {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.date-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.375rem;
}

.event-time {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.event-time svg {
  color: var(--text-muted);
}

.days-until {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
}

.days-until.today {
  background: rgba(245, 158, 11, 0.2);
  color: var(--accent-secondary-light);
}

.days-until.tomorrow {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success-light);
}

.days-until.this-week {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.days-until.this-month {
  background: rgba(139, 92, 246, 0.2);
  color: var(--accent-primary-light);
}

.days-until.later {
  background: var(--bg-elevated);
  color: var(--text-tertiary);
}

/* ============================================
   Card Header
   ============================================ */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1.25rem;
  gap: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3125rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-sm);
}

.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success-light);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge-primary {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-primary-light);
  border: 1px solid rgba(139, 92, 246, 0.25);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-secondary-light);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.badge-default {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.closest-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
  color: var(--accent-secondary-light);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-sm);
}

.closest-badge svg {
  color: var(--accent-secondary);
}

.distance-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.distance-pill svg {
  color: var(--accent-primary-light);
}

/* ============================================
   Card Body
   ============================================ */
.card-body {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.venue-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.venue-name {
  font-family: 'Outfit', sans-serif;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.venue-location {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.venue-location svg {
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ============================================
   Details Grid
   ============================================ */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.detail-value.format-value {
  color: var(--text-primary);
  font-weight: 500;
}

.detail-value.highlight {
  color: var(--accent-primary-light);
  font-weight: 500;
}

.detail-value.notes {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

/* ============================================
   Card Footer
   ============================================ */
.card-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-subtle);
  background: rgba(15, 15, 20, 0.3);
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.action-link.primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
  color: white;
}

.action-link.primary:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.action-link.secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.action-link.secondary:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.action-link svg {
  transition: transform var(--transition-fast);
}

.action-link:hover svg {
  transform: translate(2px, -2px);
}

/* ============================================
   Responsive Design
   ============================================ */
@media (max-width: 640px) {
  .date-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding-right: 3.5rem;
  }
  
  .date-meta {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .distance-pill {
    align-self: flex-start;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .card-footer {
    flex-direction: column;
  }
  
  .action-link {
    justify-content: center;
  }
}
</style>
