import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Mount React ────────────────────────────────────────────────────────────
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ── Hide Splash Screen once React has mounted ─────────────────────────────
// Double rAF ensures at least one paint cycle has completed.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    if (typeof window.__hideSplash === 'function') {
      window.__hideSplash();
    }
  });
});

// ── PWA Service Worker Registration (Production only) ─────────────────────
// SW is disabled in dev (devOptions.enabled: false in vite.config.js) to avoid
// a Workbox bug with apostrophes in Windows file paths.
// In production (npm run build), the SW is fully generated and active.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        // Silent auto-update — new SW takes over on next navigation
        console.log('[PWA] Nouvelle version disponible — mise à jour silencieuse...');
      },
      onOfflineReady() {
        console.log('[PWA] Application disponible hors ligne');
      },
      onRegistered(r) {
        if (r) {
          // Poll for updates every hour
          setInterval(() => r.update(), 60 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.warn('[PWA] Service Worker non enregistré:', error);
      },
      immediate: true,
    });
  });
}
