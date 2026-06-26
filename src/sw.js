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
    cacheName: 'lconq-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// ── External question images — Stale While Revalidate (7 days) ────────────
// Reduced from 30 days to limit cache growth on mobile devices.
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'lconq-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
);

// ── App JS/CSS assets — Stale While Revalidate (3 days) ──────────────────
// Reduced from 7 days so mobile users pick up updates faster.
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'lconq-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 3 }),
    ],
  })
);

// ── Listen for skip-waiting message from the client ───────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
