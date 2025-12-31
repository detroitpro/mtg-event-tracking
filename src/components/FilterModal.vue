<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-container" :class="modalSizeClass">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-icon">{{ icon }}</span>
              <h3>{{ title }}</h3>
            </div>
            <button class="close-btn" @click="close" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Search (optional) -->
          <div v-if="searchable" class="modal-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              :placeholder="searchPlaceholder"
              class="search-input"
            />
          </div>
          
          <!-- Modal Content -->
          <div class="modal-content">
            <!-- Quick Actions -->
            <div class="quick-actions">
              <button class="quick-btn" @click="selectAll">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Select All
              </button>
              <button class="quick-btn" @click="clearAll">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
                Clear All
              </button>
            </div>
            
            <!-- Options Grid -->
            <div class="options-grid" :class="gridClass">
              <button
                v-for="option in filteredOptions"
                :key="option.value"
                class="option-chip"
                :class="{ selected: isSelected(option.value) }"
                @click="toggleOption(option.value)"
              >
                <span class="option-check">
                  <svg v-if="isSelected(option.value)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span class="option-label">{{ option.label }}</span>
                <span v-if="option.count !== undefined" class="option-count">{{ option.count }}</span>
              </button>
            </div>
          </div>
          
          <!-- Modal Footer -->
          <div class="modal-footer">
            <div class="selected-count">
              <span class="count-number">{{ selectedValues.length }}</span>
              <span class="count-label">selected</span>
            </div>
            <div class="footer-actions">
              <button class="btn-secondary" @click="close">Cancel</button>
              <button class="btn-primary" @click="apply">
                Apply Filters
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'FilterModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Filter'
    },
    icon: {
      type: String,
      default: '🔍'
    },
    options: {
      type: Array,
      required: true
      // Array of { value: string, label: string, count?: number }
    },
    modelValue: {
      type: Array,
      default: () => []
    },
    searchable: {
      type: Boolean,
      default: false
    },
    searchPlaceholder: {
      type: String,
      default: 'Search...'
    },
    columns: {
      type: Number,
      default: 2
    },
    size: {
      type: String,
      default: 'medium' // small, medium, large
    }
  },
  emits: ['update:modelValue', 'close', 'apply'],
  setup(props, { emit }) {
    const searchQuery = ref('');
    const selectedValues = ref([...props.modelValue]);
    
    // Watch for external changes
    watch(() => props.modelValue, (newVal) => {
      selectedValues.value = [...newVal];
    });
    
    // Reset search when modal opens
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        searchQuery.value = '';
        selectedValues.value = [...props.modelValue];
      }
    });
    
    const filteredOptions = computed(() => {
      if (!searchQuery.value) return props.options;
      
      const query = searchQuery.value.toLowerCase();
      return props.options.filter(opt => 
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
      );
    });
    
    const modalSizeClass = computed(() => `modal-${props.size}`);
    
    const gridClass = computed(() => `grid-cols-${props.columns}`);
    
    function isSelected(value) {
      return selectedValues.value.includes(value);
    }
    
    function toggleOption(value) {
      const index = selectedValues.value.indexOf(value);
      if (index === -1) {
        selectedValues.value.push(value);
      } else {
        selectedValues.value.splice(index, 1);
      }
    }
    
    function selectAll() {
      selectedValues.value = filteredOptions.value.map(opt => opt.value);
    }
    
    function clearAll() {
      selectedValues.value = [];
    }
    
    function close() {
      emit('close');
    }
    
    function apply() {
      emit('update:modelValue', [...selectedValues.value]);
      emit('apply', [...selectedValues.value]);
      emit('close');
    }
    
    return {
      searchQuery,
      selectedValues,
      filteredOptions,
      modalSizeClass,
      gridClass,
      isSelected,
      toggleOption,
      selectAll,
      clearAll,
      close,
      apply
    };
  }
}
</script>

<style scoped>
/* ============================================
   Modal Overlay
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

/* ============================================
   Modal Container
   ============================================ */
.modal-container {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl), 0 0 60px rgba(139, 92, 246, 0.15);
  overflow: hidden;
}

.modal-small { width: 100%; max-width: 360px; }
.modal-medium { width: 100%; max-width: 500px; }
.modal-large { width: 100%; max-width: 640px; }

/* ============================================
   Modal Header
   ============================================ */
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
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

/* ============================================
   Modal Search
   ============================================ */
.modal-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-card);
}

.modal-search svg {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 0.9375rem;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* ============================================
   Modal Content
   ============================================ */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.quick-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

/* Options Grid */
.options-grid {
  display: grid;
  gap: 0.625rem;
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

.option-chip {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.option-chip:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.option-chip.selected {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
}

.option-check {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-strong);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.option-chip.selected .option-check {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.option-check svg {
  color: white;
}

.option-label {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.option-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
}

/* ============================================
   Modal Footer
   ============================================ */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-card);
}

.selected-count {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.count-number {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-primary-light);
}

.count-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
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

/* ============================================
   Modal Transitions
   ============================================ */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* ============================================
   Responsive
   ============================================ */
@media (max-width: 640px) {
  .modal-container {
    max-height: 90vh;
  }
  
  .options-grid {
    grid-template-columns: 1fr !important;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 1rem;
  }
  
  .footer-actions {
    width: 100%;
  }
  
  .btn-secondary,
  .btn-primary {
    flex: 1;
    justify-content: center;
  }
}
</style>
