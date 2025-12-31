<template>
  <nav class="tab-nav">
    <button 
      class="tab-btn" 
      :class="{ active: modelValue === 'upcoming' }"
      @click="$emit('update:modelValue', 'upcoming')"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span>Upcoming</span>
      <span class="tab-count">{{ upcomingCount }}</span>
    </button>
    
    <button 
      class="tab-btn" 
      :class="{ active: modelValue === 'all' }"
      @click="$emit('update:modelValue', 'all')"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span>All Events</span>
      <span class="tab-count">{{ allCount }}</span>
    </button>
    
    <button 
      class="tab-btn" 
      :class="{ active: modelValue === 'favorites' }"
      @click="$emit('update:modelValue', 'favorites')"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" :fill="favoritesCount > 0 ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <span>Favorites</span>
      <span class="tab-count" :class="{ 'has-favorites': favoritesCount > 0 }">{{ favoritesCount }}</span>
    </button>
  </nav>
</template>

<script>
export default {
  name: 'TabNav',
  props: {
    modelValue: {
      type: String,
      default: 'upcoming'
    },
    upcomingCount: {
      type: Number,
      default: 0
    },
    allCount: {
      type: Number,
      default: 0
    },
    favoritesCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue']
}
</script>

<style scoped>
.tab-nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.375rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 1.25rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
  color: white;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}

.tab-btn svg {
  flex-shrink: 0;
}

.tab-count {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  min-width: 24px;
  text-align: center;
}

.tab-btn:not(.active) .tab-count {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.tab-count.has-favorites {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

.tab-btn.active .tab-count.has-favorites {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

@media (max-width: 768px) {
  .tab-nav {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .tab-btn span:not(.tab-count) {
    display: none;
  }
  
  .tab-btn {
    padding: 0.75rem;
  }
}
</style>
