<template>
  <div class="stats-bar">
    <div class="stat-item">
      <span class="stat-value">{{ upcomingCount }}</span>
      <span class="stat-label">Next 3 Weeks</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <span class="stat-value">{{ allCount }}</span>
      <span class="stat-label">All Future</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item clickable" @click="$emit('view-favorites')">
      <span class="stat-value favorites-value">{{ favoritesCount }}</span>
      <span class="stat-label">Favorites</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsBar',
  props: {
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
  emits: ['view-favorites']
}
</script>

<style scoped>
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1.5rem 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-item.clickable {
  cursor: pointer;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.stat-item.clickable:hover {
  background: var(--bg-card-hover);
}

.stat-value {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-primary-light), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-value.favorites-value {
  background: linear-gradient(135deg, #f87171, #fbbf24);
  -webkit-background-clip: text;
  background-clip: text;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border-default);
}

@media (max-width: 768px) {
  .stats-bar {
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1rem;
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-item {
    flex: 1;
    min-width: 80px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
