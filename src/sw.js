/**
 * L'CONQ — Custom Service Worker
 * Strategy: injectManifest (Vite Plugin PWA)
 * 
 * The precache manifest is injected by vite-plugin-pwa at build time
 * into the self.__WB_MANIFEST placeholder below.
 * 
 * This file is used as-is in PRODUCTION builds.
 * In DEV mode, the SW is disabled (devOptions.enabled: false in vite.config.js)
 * to avoid the Workbox Windows path/apostrophe bug.
 */

import { clientsClaim } from 'workbox-core';
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  CacheFirst,
  StaleWhileRevalidate,
  NetworkOnly,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// ── Activate immediately ───────────────────────────────────────────────────
self.skipWaiting();
clientsClaim();

// ── Precache all build assets (injected by vite-plugin-pwa) ───────────────
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ── Versioned Cache Names to prevent PWA quota exhaustion on mobile ─────────
const CACHE_VERSION = 'v2';
const CACHE_NAMES = {
  fonts: `lconq-fonts-${CACHE_VERSION}`,
  images: `lconq-images-${CACHE_VERSION}`,
  assets: `lconq-assets-${CACHE_VERSION}`,
};

// ── Clean up old versioned caches on SW activation ──────────────────────────
self.addEventListener('activate', (event) => {
  const currentCacheNames = Object.values(CACHE_NAMES);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('lconq-') && !currentCacheNames.includes(cacheName)) {
            console.log('[Service Worker] Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FIX #1: Supabase API — NEVER cache, always network ────────────────────
// Caching Supabase responses would return stale auth/data and cause the
// "can't fetch from Supabase after cache accumulation" freeze bug.
registerRoute(
  ({ url }) =>
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.io'),
  new NetworkOnly()
);

// ── FIX #2: Auth routes — always network (no cached login pages) ──────────
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/api/'),
  new NetworkOnly()
);

// ── SPA fallback: all navigation requests → index.html ────────────────────
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/\/api\//, /\/_/, /\/admin\/.+\.(json|csv|pdf)$/, /\/print/],
});
registerRoute(navigationRoute);

// ── Google Fonts — Cache First (1 year) ───────────────────────────────────
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: CACHE_NAMES.fonts,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// ── External question images — Stale While Revalidate (7 days) ────────────
// Reduced from 30 days to limit cache growth on mobile devices.
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 25, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
);

// ── App JS/CSS assets — Stale While Revalidate (3 days) ──────────────────
// FIX #5: Added CacheableResponsePlugin to prevent caching opaque/error responses.
// Without it, failed network requests (opaque responses) were stored in cache on iOS,
// gradually filling the ~50MB mobile storage quota and causing fetch failures.
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.assets,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }), // ← only cache valid responses
      new ExpirationPlugin({ maxEntries: 15, maxAgeSeconds: 60 * 60 * 24 * 3 }),
    ],
  })
);

// ── Listen for skip-waiting message from the client ───────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
