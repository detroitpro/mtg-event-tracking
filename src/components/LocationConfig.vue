<template>
  <div class="location-config">
    <!-- Decorative background elements -->
    <div class="config-bg">
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
    </div>
    
    <div class="config-card">
      <!-- Card Header -->
      <div class="card-header">
        <div class="header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h2>Set Your Location</h2>
        <p class="header-description">
          Find the closest Magic: The Gathering tournaments and events near you
        </p>
      </div>
      
      <!-- Geolocation Option -->
      <div class="geolocation-section">
        <button 
          @click="handleGeolocation" 
          :disabled="geolocating" 
          class="geolocation-btn"
        >
          <span class="btn-icon">
            <svg v-if="!geolocating" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
            <svg v-else class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
          </span>
          <span class="btn-text">
            {{ geolocating ? 'Getting location...' : 'Use Current Location' }}
          </span>
        </button>
        
        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">or enter manually</span>
          <span class="divider-line"></span>
        </div>
      </div>
      
      <!-- Manual Form -->
      <form @submit.prevent="handleSubmit" class="location-form">
        <div class="form-row">
          <div class="form-group">
            <label for="city">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M9 22V12h6v10M3 22h18"/>
                <path d="M9 12V7a3 3 0 0 1 6 0v5"/>
              </svg>
              City
            </label>
            <input
              id="city"
              v-model="city"
              type="text"
              placeholder="Chicago"
              required
              autocomplete="address-level2"
            />
          </div>
          
          <div class="form-group form-group-small">
            <label for="state">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              State
            </label>
            <input
              id="state"
              v-model="state"
              type="text"
              placeholder="IL"
              maxlength="2"
              required
              autocomplete="address-level1"
            />
          </div>
        </div>
        
        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="!loading">
            Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
          <span v-else class="loading-text">
            <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            Looking up location...
          </span>
        </button>
      </form>
      
      <!-- Error Message -->
      <transition name="fade">
        <div v-if="error" class="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>
      </transition>
      
      <!-- Footer note -->
      <p class="privacy-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Your location is stored locally and never shared
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { geocodeVenue } from '../utils/geocoding';

export default {
  name: 'LocationConfig',
  emits: ['location-set', 'use-geolocation'],
  setup(props, { emit }) {
    const city = ref('');
    const state = ref('');
    const loading = ref(false);
    const geolocating = ref(false);
    const error = ref('');

    function handleGeolocation() {
      geolocating.value = true;
      error.value = '';
      emit('use-geolocation');
      
      // Reset after timeout in case something goes wrong
      setTimeout(() => {
        geolocating.value = false;
      }, 10000);
    }

    async function handleSubmit() {
      if (!city.value || !state.value) {
        error.value = 'Please enter both city and state';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        const result = await geocodeVenue('', city.value, state.value.toUpperCase());
        
        if (result.found && result.coordinates) {
          emit('location-set', {
            lat: result.coordinates.lat,
            lng: result.coordinates.lng,
            city: city.value,
            state: state.value.toUpperCase()
          });
        } else {
          // Try with a generic query
          const query = encodeURIComponent(`${city.value}, ${state.value.toUpperCase()}, USA`);
          const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
          
          const response = await fetch(url, {
            headers: { 'User-Agent': 'MTG Event Planner/1.0' }
          });
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            emit('location-set', {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              city: city.value,
              state: state.value.toUpperCase()
            });
          } else {
            error.value = 'Could not find location. Please check your city and state.';
          }
        }
      } catch (err) {
        error.value = 'Error looking up location. Please try again.';
        console.error(err);
      } finally {
        loading.value = false;
      }
    }

    return {
      city,
      state,
      loading,
      geolocating,
      error,
      handleSubmit,
      handleGeolocation
    };
  }
}
</script>

<style scoped>
/* ============================================
   Location Config Container
   ============================================ */
.location-config {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 2rem;
  position: relative;
}

/* ============================================
   Background Effects
   ============================================ */
.config-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
}

.bg-glow-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
}

.bg-glow-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
  bottom: -50px;
  right: 10%;
}

/* ============================================
   Config Card
   ============================================ */
.config-card {
  position: relative;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 2.5rem;
  max-width: 440px;
  width: 100%;
  box-shadow: var(--shadow-xl), 0 0 60px rgba(139, 92, 246, 0.1);
  animation: slideUp 0.5s ease-out;
}

/* ============================================
   Card Header
   ============================================ */
.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
  border-radius: var(--radius-lg);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
}

.header-icon svg {
  color: white;
}

.card-header h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.header-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* ============================================
   Geolocation Section
   ============================================ */
.geolocation-section {
  margin-bottom: 1.5rem;
}

.geolocation-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-dark));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}

.geolocation-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
}

.geolocation-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Spinner animation */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--border-default);
}

.divider-text {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* ============================================
   Form Styles
   ============================================ */
.location-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group-small {
  flex: 0 0 100px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-group label svg {
  color: var(--text-muted);
}

.form-group input {
  padding: 0.875rem 1rem;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.form-group input:hover {
  border-color: var(--border-strong);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--glow-accent);
}

.form-group-small input {
  text-transform: uppercase;
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn span {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.submit-btn:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
}

/* ============================================
   Error Message
   ============================================ */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 1rem;
  padding: 0.875rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  color: #f87171;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-message svg {
  flex-shrink: 0;
}

/* ============================================
   Privacy Note
   ============================================ */
.privacy-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.privacy-note svg {
  color: var(--success);
}

/* ============================================
   Transitions
   ============================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================
   Responsive Design
   ============================================ */
@media (max-width: 480px) {
  .config-card {
    padding: 2rem 1.5rem;
    border-radius: var(--radius-lg);
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .form-group-small {
    flex: 1;
  }
  
  .form-group-small input {
    text-align: left;
  }
}
</style>
