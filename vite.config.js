import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use 'injectManifest' so we provide our own SW file,
      // bypassing the Workbox path-apostrophe bug on Windows.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB to handle compiled index bundle size
      },
      includeAssets: ['favicon.svg', 'icons/*.png'],

      // ── Manifest ──────────────────────────────────────────────────────────
      manifest: {
        name: "L'Conq — Concours Médecine",
        short_name: "L'Conq",
        description: "La plateforme SRS gamifiée pour préparer les concours de médecine au Maroc.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0D1117',
        theme_color: '#5254F0',
        lang: 'fr',
        categories: ['education', 'medical', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        shortcuts: [
          {
            name: 'Réviser maintenant',
            short_name: 'Réviser',
            url: '/study',
          },
          {
            name: 'Tableau de bord',
            short_name: 'Dashboard',
            url: '/dashboard',
          },
        ],
      },

      // ── Dev mode: disabled (avoids Workbox Windows path bug) ─────────────
      devOptions: {
        enabled: false,
      },
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        // ── Manual chunk splitting ──────────────────────────────────────────
        // Splits large vendor libraries into separate cacheable files.
        // Users re-download only the chunk that changed between deploys.
        manualChunks(id) {
          // KaTeX — math rendering (fonts + CSS loaded separately)
          if (id.includes('node_modules/katex')) return 'vendor-katex';
          // Recharts — dashboard charts
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) return 'vendor-charts';
          // PDF.js — heavy PDF processing library
          if (id.includes('node_modules/pdfjs-dist')) return 'vendor-pdfjs';
          // React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react';
          // Everything else in node_modules → vendor-misc
          if (id.includes('node_modules')) return 'vendor-misc';
        },
      },
    },
  },
})

