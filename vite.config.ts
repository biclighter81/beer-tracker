import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      selfDestroying: true,
      manifest: {
        name: 'Beer Tracker',
        short_name: 'Beer Tracker',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        categories: ['entertainment', 'lifestyle', 'utilities'],
        description:
          'A simple app to track your beer consumption and share it with your friends.',
        display: 'standalone',
        icons: [
          {
            src: '/bottle.png',
            sizes: '240x240',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/bottle.png',
            sizes: '240x240',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
});
