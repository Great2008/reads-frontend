import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/*.wasm', 'sw.js', 'workbox-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
      manifest: {
        name: '$READS — Learn. Earn. Excel.',
        short_name: '$READS',
        description: 'Blockchain-powered Learn-to-Earn education platform for Nigerian students.',
        theme_color: '#B8860B',
        background_color: '#B8860B',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['education', 'finance'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],

  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 6000,
    // No externals — all npm packages must be bundled.
    // Only true Node built-ins (never present in the browser) should be
    // external, but Vite already handles those via its own Node polyfill
    // logic, so we don't need to list them here.
    rollupOptions: {},
  },

  optimizeDeps: {
    exclude: [],
  },

  resolve: {
    alias: {
      // libsodium-wrappers-sumo ships a broken ESM build that references
      // a WASM file via relative import Rollup cannot resolve at build time.
      // Stub it out — the real crypto runs inside @meshsdk/core at runtime
      // on desktop only (ClaimPage dynamic-imports Mesh on wallet click).
      'libsodium-wrappers-sumo': path.resolve(__dirname, 'src/libsodium-stub.js'),
      // Node polyfills for packages that reference them
      stream: 'stream-browserify',
      events: 'events',
      buffer: 'buffer',
    },
  },
});
