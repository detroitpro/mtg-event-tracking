<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
        <div class="distance-modal">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-icon">📏</span>
              <h3>Max Distance</h3>
            </div>
            <button class="close-btn" @click="$emit('close')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="distance-content">
            <p class="distance-description">Show events within this distance from your location</p>
            
            <div class="distance-presets">
              <button 
                v-for="preset in presets" 
                :key="preset"
                class="distance-preset"
                :class="{ active: internalValue === preset }"
                @click="internalValue = preset"
              >
                {{ preset }} mi
              </button>
              <button 
                class="distance-preset"
                :class="{ active: internalValue === null }"
                @click="internalValue = null"
              >
                Any
              </button>
            </div>
            
            <div class="distance-input-group">
              <label>Custom distance (miles)</label>
              <input 
                type="number" 
                v-model.number="internalValue"
                placeholder="Enter miles..."
                min="1"
                class="distance-input"
              />
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn-secondary" @click="$emit('close')">Cancel</button>
            <button class="btn-primary" @click="apply">
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
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'DistanceModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    modelValue: {
      type: Number,
      default: null
    },
    presets: {
      type: Array,
      default: () => [25, 50, 100, 200, 500]
    }
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    const internalValue = ref(props.modelValue);

    watch(() => props.modelValue, (newVal) => {
      internalValue.value = newVal;
    });

    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        internalValue.value = props.modelValue;
      }
    });

    function apply() {
      emit('update:modelValue', internalValue.value);
      emit('close');
    }

    return {
      internalValue,
      apply
    };
  }
}
</script>

<style scoped>
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
</style>
