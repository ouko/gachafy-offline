import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  server: {
    port: 3021,
    strictPort: true,
    hmr: {
      overlay: false,
      clientPort: 3021
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          toolkit: ['@radixdlt/radix-dapp-toolkit', '@radixdlt/babylon-gateway-api-sdk'],
          ui: ['framer-motion', 'zustand']
        }
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },
  plugins: [
    react({
      fastRefresh: true,
      jsxRuntime: 'classic'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GachaFi',
        short_name: 'GachaFi',
        theme_color: '#FF006E',
        background_color: '#8338EC',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.radix/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'radix-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
