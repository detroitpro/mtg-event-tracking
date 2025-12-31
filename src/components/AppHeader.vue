<template>
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
      
      <div v-if="userLocation" class="location-chip" @click="$emit('reset-location')">
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
</template>

<script>
export default {
  name: 'AppHeader',
  props: {
    userLocation: {
      type: Object,
      default: null
    }
  },
  emits: ['reset-location']
}
</script>

<style scoped>
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

@media (max-width: 768px) {
  .header-container {
    padding: 1rem;
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
}
</style>
