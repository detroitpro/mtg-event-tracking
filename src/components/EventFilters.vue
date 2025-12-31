<template>
  <div class="event-filters">
    <div class="filters-header">
      <button class="toggle-filters-btn" @click="filtersExpanded = !filtersExpanded">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span>{{ filtersExpanded ? 'Hide Filters' : 'Show Filters' }}</span>
        <svg 
          class="chevron" 
          :class="{ expanded: filtersExpanded }"
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      
      <button 
        v-if="hasActiveFilters" 
        @click="clearFilters" 
        class="clear-filters-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
        Clear All
      </button>
    </div>
    
    <transition name="expand">
      <div v-show="filtersExpanded" class="filters-panel">
        <div class="filters-grid">
          <!-- Event Types -->
          <div class="filter-group">
            <label class="filter-label">Event Types</label>
            <div class="checkbox-list">
              <label 
                v-for="type in eventTypes" 
                :key="type" 
                class="checkbox-item"
                :class="{ active: selectedEventTypes.includes(type) }"
              >
                <input
                  type="checkbox"
                  :value="type"
                  :checked="selectedEventTypes.includes(type)"
                  @change="updateEventTypes"
                />
                <span class="checkbox-custom">
                  <svg v-if="selectedEventTypes.includes(type)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span class="checkbox-text">{{ type }}</span>
              </label>
            </div>
          </div>

          <!-- Formats -->
          <div class="filter-group">
            <label class="filter-label">Formats</label>
            <div class="checkbox-list scrollable">
              <label 
                v-for="format in formats" 
                :key="format" 
                class="checkbox-item"
                :class="{ active: selectedFormats.includes(format) }"
              >
                <input
                  type="checkbox"
                  :value="format"
                  :checked="selectedFormats.includes(format)"
                  @change="updateFormats"
                />
                <span class="checkbox-custom">
                  <svg v-if="selectedFormats.includes(format)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span class="checkbox-text">{{ format }}</span>
              </label>
            </div>
          </div>

          <!-- Date Range -->
          <div class="filter-group">
            <label class="filter-label" for="date-start">Start Date</label>
            <div class="input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input
                id="date-start"
                type="date"
                :value="dateStart"
                @change="updateDateRange"
                class="filter-input"
              />
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label" for="date-end">End Date</label>
            <div class="input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input
                id="date-end"
                type="date"
                :value="dateEnd"
                @change="updateDateRange"
                class="filter-input"
              />
            </div>
          </div>

          <!-- Location -->
          <div class="filter-group">
            <label class="filter-label" for="location">Location</label>
            <div class="input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <input
                id="location"
                type="text"
                v-model="locationFilter"
                placeholder="State or City..."
                @input="updateLocation"
                class="filter-input"
              />
            </div>
          </div>

          <!-- Max Distance -->
          <div class="filter-group">
            <label class="filter-label" for="max-distance">Max Distance</label>
            <div class="input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2v10l4.5 4.5"/>
              </svg>
              <input
                id="max-distance"
                type="number"
                v-model.number="maxDistance"
                placeholder="Miles..."
                min="0"
                @input="updateDistance"
                class="filter-input"
              />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';

export default {
  name: 'EventFilters',
  props: {
    events: {
      type: Array,
      required: true
    }
  },
  emits: ['filter-change'],
  setup(props, { emit }) {
    const filtersExpanded = ref(false);
    const selectedEventTypes = ref(['RCQ', 'RC', 'Magic Spotlight']);
    const selectedFormats = ref([]);
    const dateStart = ref('');
    const dateEnd = ref('');
    const locationFilter = ref('');
    const maxDistance = ref(null);

    // Check if any filters are active
    const hasActiveFilters = computed(() => {
      return selectedEventTypes.value.length !== eventTypes.value.length ||
             selectedFormats.value.length > 0 ||
             dateStart.value ||
             dateEnd.value ||
             locationFilter.value ||
             maxDistance.value;
    });

    // Extract unique event types and formats from events
    const eventTypes = computed(() => {
      const types = new Set();
      props.events.forEach(event => {
        if (event.type) types.add(event.type);
      });
      return Array.from(types).sort();
    });

    const formats = computed(() => {
      const formatSet = new Set();
      props.events.forEach(event => {
        if (event.format) formatSet.add(event.format);
      });
      return Array.from(formatSet).sort();
    });

    function updateEventTypes(event) {
      const value = event.target.value;
      if (event.target.checked) {
        selectedEventTypes.value.push(value);
      } else {
        selectedEventTypes.value = selectedEventTypes.value.filter(t => t !== value);
      }
      emitFilters();
    }

    function updateFormats(event) {
      const value = event.target.value;
      if (event.target.checked) {
        selectedFormats.value.push(value);
      } else {
        selectedFormats.value = selectedFormats.value.filter(f => f !== value);
      }
      emitFilters();
    }

    function updateDateRange() {
      emitFilters();
    }

    function updateLocation() {
      emitFilters();
    }

    function updateDistance() {
      emitFilters();
    }

    function clearFilters() {
      selectedEventTypes.value = [...eventTypes.value];
      selectedFormats.value = [];
      dateStart.value = '';
      dateEnd.value = '';
      locationFilter.value = '';
      maxDistance.value = null;
      emitFilters();
    }

    function emitFilters() {
      emit('filter-change', {
        eventTypes: selectedEventTypes.value,
        formats: selectedFormats.value,
        dateRange: {
          start: dateStart.value || null,
          end: dateEnd.value || null
        },
        location: locationFilter.value || null,
        maxDistance: maxDistance.value || null
      });
    }

    // Emit initial filters
    onMounted(() => {
      emitFilters();
    });

    return {
      filtersExpanded,
      eventTypes,
      formats,
      selectedEventTypes,
      selectedFormats,
      dateStart,
      dateEnd,
      locationFilter,
      maxDistance,
      hasActiveFilters,
      updateEventTypes,
      updateFormats,
      updateDateRange,
      updateLocation,
      updateDistance,
      clearFilters
    };
  }
}
</script>

<style scoped>
/* ============================================
   Filters Container
   ============================================ */
.event-filters {
  margin-bottom: 1.5rem;
}

/* ============================================
   Filters Header
   ============================================ */
.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.toggle-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-filters-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.toggle-filters-btn svg:first-child {
  color: var(--accent-primary-light);
}

.chevron {
  transition: transform var(--transition-fast);
  color: var(--text-muted);
}

.chevron.expanded {
  transform: rotate(180deg);
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.clear-filters-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

/* ============================================
   Filters Panel
   ============================================ */
.filters-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  overflow: hidden;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

/* ============================================
   Filter Group
   ============================================ */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

/* ============================================
   Checkbox List
   ============================================ */
.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.checkbox-list.scrollable {
  max-height: 180px;
  overflow-y: auto;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.checkbox-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.checkbox-item.active {
  background: rgba(139, 92, 246, 0.1);
}

.checkbox-item input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-strong);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.checkbox-item.active .checkbox-custom {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.checkbox-custom svg {
  color: white;
}

.checkbox-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.checkbox-item.active .checkbox-text {
  color: var(--text-primary);
}

/* ============================================
   Input Styles
   ============================================ */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper svg {
  position: absolute;
  left: 0.875rem;
  color: var(--text-muted);
  pointer-events: none;
  z-index: 1;
}

.filter-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.filter-input::placeholder {
  color: var(--text-muted);
}

.filter-input:hover {
  border-color: var(--border-strong);
}

.filter-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--glow-accent);
}

/* Date input styling for dark theme */
.filter-input[type="date"] {
  color-scheme: dark;
}

/* ============================================
   Expand Transition
   ============================================ */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0;
  margin: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ============================================
   Responsive Design
   ============================================ */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-header {
    flex-wrap: wrap;
  }
  
  .toggle-filters-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
