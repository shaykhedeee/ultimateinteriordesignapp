import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'frontend',
  server: {
    port: 5175,
    host: '127.0.0.1'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Split heavy vendors so they cache independently and parse in parallel.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-3d';
            if (id.includes('chart') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('pdf') || id.includes('jspdf') || id.includes('canvas')) return 'vendor-pdf';
            return 'vendor';
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios'],
    rolldownOptions: { output: { target: 'es2020' } }
  },
  esbuild: { target: 'es2020' }
});
