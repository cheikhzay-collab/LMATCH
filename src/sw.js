/**
 * L'Match — Custom Service Worker
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
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// ── Activate immediately ───────────────────────────────────────────────────
self.skipWaiting();
clientsClaim();

// ── Precache all build assets (injected by vite-plugin-pwa) ───────────────
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ── SPA fallback: all navigation requests → index.html ────────────────────
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/\/api\//, /\/_/, /\/admin\/.+\.(json|csv|pdf)$/],
});
registerRoute(navigationRoute);

// ── Google Fonts — Cache First (1 year) ───────────────────────────────────
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'lmatch-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// ── External question images — Stale While Revalidate (30 days) ───────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'lmatch-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// ── App JS/CSS assets — Stale While Revalidate ────────────────────────────
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'lmatch-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
);

// ── Listen for skip-waiting message from the client ───────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
