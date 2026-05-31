import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
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

  // Tell Vite/Rollup not to bundle these Node/native modules that
  // Mesh depends on but the browser doesn't need (or can't use).
  // libsodium-wrappers-sumo ships its WASM binary as a side-loaded
  // file — Rollup cannot resolve it; exclude the whole package and
  // let Mesh load it dynamically at runtime via its own lazy import.
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [
        // libsodium WASM — Mesh loads this lazily; Rollup must not bundle it
        'libsodium-wrappers-sumo',
        // Node built-ins that leak through some Mesh transitive deps
        'crypto',
        'stream',
        'events',
        'buffer',
        'path',
        'fs',
        'os',
      ],
    },
  },

  optimizeDeps: {
    exclude: ['@meshsdk/core', '@meshsdk/react', 'libsodium-wrappers-sumo'],
  },

  // Stub Node built-ins for browser — prevents "Module externalized" warnings
  // from becoming hard errors in some Vite versions
  resolve: {
    alias: {
      // empty shims so imports don't crash at parse time
      stream: 'stream-browserify',
      events: 'events',
      buffer: 'buffer',
    },
  },
});
