import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
