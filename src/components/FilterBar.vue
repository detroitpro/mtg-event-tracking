<template>
  <div class="filter-bar">
    <div class="filter-bar-label">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      <span>Filters</span>
    </div>
    
    <div class="filter-chips">
      <button 
        class="filter-chip" 
        :class="{ active: hasEventTypeFilter }"
        @click="$emit('open-modal', 'eventTypes')"
      >
        <span class="chip-icon">🎯</span>
        <span class="chip-label">Event Types</span>
        <span v-if="hasEventTypeFilter" class="chip-count">{{ selectedEventTypes.length }}</span>
      </button>
      
      <button 
        class="filter-chip"
        :class="{ active: selectedFormats.length > 0 }"
        @click="$emit('open-modal', 'formats')"
      >
        <span class="chip-icon">🃏</span>
        <span class="chip-label">Formats</span>
        <span v-if="selectedFormats.length > 0" class="chip-count">{{ selectedFormats.length }}</span>
      </button>
      
      <button 
        class="filter-chip"
        :class="{ active: selectedStates.length > 0 }"
        @click="$emit('open-modal', 'states')"
      >
        <span class="chip-icon">📍</span>
        <span class="chip-label">States</span>
        <span v-if="selectedStates.length > 0" class="chip-count">{{ selectedStates.length }}</span>
      </button>
      
      <button 
        class="filter-chip"
        :class="{ active: maxDistance !== null }"
        @click="$emit('open-modal', 'distance')"
      >
        <span class="chip-icon">📏</span>
        <span class="chip-label">Distance</span>
        <span v-if="maxDistance" class="chip-count">{{ maxDistance }}mi</span>
      </button>
      
      <button 
        class="filter-chip agenda-chip"
        :class="{ active: showMyAgenda }"
        @click="$emit('toggle-agenda')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" :fill="showMyAgenda ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span class="chip-label">My Agenda</span>
      </button>
      
      <button 
        v-if="hasFavorites"
        class="filter-chip share-chip"
        @click="$emit('share-agenda')"
        title="Share your agenda"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <span class="chip-label">Share</span>
      </button>
    </div>
    
    <button 
      v-if="hasActiveFilters" 
      class="clear-filters-btn"
      @click="$emit('clear-filters')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      Clear
    </button>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'FilterBar',
  props: {
    selectedEventTypes: {
      type: Array,
      default: () => []
    },
    selectedFormats: {
      type: Array,
      default: () => []
    },
    selectedStates: {
      type: Array,
      default: () => []
    },
    maxDistance: {
      type: Number,
      default: null
    },
    totalEventTypes: {
      type: Number,
      default: 0
    },
    showMyAgenda: {
      type: Boolean,
      default: false
    },
    hasFavorites: {
      type: Boolean,
      default: false
    }
  },
  emits: ['open-modal', 'clear-filters', 'toggle-agenda', 'share-agenda'],
  setup(props) {
    const hasEventTypeFilter = computed(() => {
      return props.selectedEventTypes.length > 0 && 
             props.selectedEventTypes.length < props.totalEventTypes;
    });

    const hasActiveFilters = computed(() => {
      return hasEventTypeFilter.value ||
             props.selectedFormats.length > 0 ||
             props.selectedStates.length > 0 ||
             props.maxDistance !== null ||
             props.showMyAgenda;
    });

    return {
      hasEventTypeFilter,
      hasActiveFilters
    };
  }
}
</script>

<style scoped>
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

.filter-chip.agenda-chip.active {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.3);
  color: #f87171;
}

.filter-chip.agenda-chip svg {
  flex-shrink: 0;
}

.filter-chip.share-chip {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.filter-chip.share-chip:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.filter-chip.share-chip svg {
  flex-shrink: 0;
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

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-chips {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .filter-chip {
    flex: 1;
    justify-content: center;
  }
}
</style>
