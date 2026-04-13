import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        lossless: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'El Atlante - Reservas',
        short_name: 'El Atlante',
        description: 'Sistema de gestión de reservas para El Atlante',
        theme_color: '#1e3a8a',
        background_color: '#1e3a8a',
        display: 'standalone',
        scope: '/admin/',
        start_url: '/admin/',
        icons: [
          {
            src: '/assets/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/assets/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/assets/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [
          /^\/assets\/pdf\//,
          /^\/send-confirmation/,
          /^\/confirm/,
          /^\/cancel/,
          /^\/notify-owner/,
          /^\/test-report/,
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'recharts', 'react-international-phone'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
