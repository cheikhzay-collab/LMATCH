import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logErrorToSupabase } from './services/logger'

// ── Global Error Listeners (captures unhandled runtime errors & promise rejections) ──
window.addEventListener('error', (event) => {
  // Only log if it's an actual unhandled error (some third party libraries throw non-Error objects)
  const errorObj = event.error || new Error(event.message || 'Global Window Error');
  logErrorToSupabase(errorObj);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const errorObj = reason instanceof Error 
    ? reason 
    : new Error(reason ? String(reason) : 'Unhandled Promise Rejection');
  logErrorToSupabase(errorObj);
});

// ── Mount React normally ──
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ── Hide Splash Screen once React has mounted ──
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    if (typeof window.__hideSplash === 'function') {
      window.__hideSplash();
    }
  });
});

// ── Programmatic Service Worker & Cache Removal (Radical mobile cache solution) ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister().then(() => {
        console.log('[PWA] Unregistered service worker programmatically.');
      });
    }
  }).catch(err => {
    console.warn('[PWA] Failed to get SW registrations:', err);
  });
}

if ('caches' in window) {
  caches.keys().then(names => {
    for (let name of names) {
      caches.delete(name).then(() => {
        console.log('[Cache] Deleted cache bucket:', name);
      });
    }
  }).catch(err => {
    console.warn('[Cache] Failed to clear caches:', err);
  });
}

// ── Break BFcache (Back-Forward Cache) on Mobile Safari/Chrome ──
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    console.log('[BFcache] Page restored from cache. Forcing clean reload...');
    window.location.reload();
  }
});
