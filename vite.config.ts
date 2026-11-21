import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /psychedelic-visions/
export default defineConfig({
  base: '/psychedelic-visions/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: { tone: ['tone'], react: ['react', 'react-dom', 'react-router-dom'] } },
    },
  },
});
