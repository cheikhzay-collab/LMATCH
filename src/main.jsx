import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Intercept Print Page route to completely bypass React and avoid unmount/redirect issues ──
if (window.location.pathname === '/print') {
  // 1. Render a clean loading UI directly in the body
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0D1117;color:#fff;font-family:sans-serif;">
      <div style="width:40px;height:40px;border-radius:50%;border:3px solid rgba(82, 84, 240, 0.15);border-top:3px solid #5254F0;animation:spinPrint 1s linear infinite;"></div>
      <h3 style="margin:20px 0 0 0;font-size:1.1rem;font-weight:700;">L'CONQ</h3>
      <p style="margin:5px 0 0 0;color:#64748b;font-size:0.85rem;">Génération de votre document PDF en cours...</p>
      <style>@keyframes spinPrint { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    </div>
  `;

  // Hide splash screen if it was shown in index.html
  if (typeof window.__hideSplash === 'function') {
    window.__hideSplash();
  }

  let intervalId;
  let timeoutId;

  const handleStorage = (e) => {
    if (e.key === 'print_html' && e.newValue) {
      checkAndPrint();
    }
  };

  const checkAndPrint = () => {
    try {
      const html = localStorage.getItem('print_html');
      if (html) {
        localStorage.removeItem('print_html');
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        window.removeEventListener('storage', handleStorage);
        
        document.open();
        document.write(html);
        document.close();
        return true;
      }
    } catch (err) {
      console.error('Error reading print HTML:', err);
    }
    return false;
  };

  if (!checkAndPrint()) {
    intervalId = setInterval(checkAndPrint, 150);
    window.addEventListener('storage', handleStorage);
    
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
      try {
        window.close();
      } catch (e) {
        window.location.href = '/';
      }
    }, 15000);
  }
} else {
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
}

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
