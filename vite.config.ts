import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: './',
  plugins: [VitePWA({
    registerType: 'prompt',
    injectRegister: null,
    includeAssets: ['favicon.svg', 'icons/*.png', 'icons/*.svg'],
    manifest: {
      id: './', name: 'Komorebi — Japanese Kitchen', short_name: 'Komorebi',
      description: 'Sua pequena cozinha japonesa. Doze receitas, vizinhos e dias tranquilos, também offline.',
      lang: 'pt-BR', start_url: './', scope: './', display: 'standalone', orientation: 'landscape',
      theme_color: '#435a48', background_color: '#efe3c9', categories: ['games', 'entertainment'],
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,webmanifest}'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/\/\.github\//],
      cleanupOutdatedCaches: true,
      skipWaiting: false,
      clientsClaim: true,
      // Save data lives in LocalStorage; cache management never touches it.
    },
    devOptions: { enabled: false },
  })],
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
});
