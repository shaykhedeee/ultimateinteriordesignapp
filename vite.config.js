import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  server: {
    port: 5175,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/^three($|[\\/])/.test(id)) return 'three';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor';
          if (id.includes('lucide-react')) return 'ui';
        }
      }
    }
  },
  envDir: '..'
});
