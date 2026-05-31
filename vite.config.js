import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';

// libsodium-wrappers-sumo ships an ESM build that uses a relative dynamic
// import for its WASM file ("./libsodium-sumo.mjs") which Rollup cannot
// resolve at build time. This plugin rewrites any import of the ESM entry
// to the CJS build, which Vite wraps correctly without the broken relative ref.
function libsodiumCjsPlugin() {
  return {
    name: 'libsodium-cjs-redirect',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'libsodium-wrappers-sumo') {
        return { id: 'libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers-sumo.js', external: false };
      }
    },
  };
}

export default defineConfig({
  plugins: [
    libsodiumCjsPlugin(),
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
    rollupOptions: {
      external: [
        // Node built-ins only — npm packages must NOT be here or the
        // browser receives unresolvable bare specifiers at runtime.
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
    exclude: [],
  },

  resolve: {
    alias: {
      stream: 'stream-browserify',
      events: 'events',
      buffer: 'buffer',
    },
  },
});
