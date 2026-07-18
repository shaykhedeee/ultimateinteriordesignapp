import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'frontend',
  server: {
    port: 5175,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true
      },
      '/storage': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true
      },
      '/uploads': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
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
            // 3D stack first (before the generic react match) so @react-three
            // isn't mis-bucketed into vendor-react.
            if (id.includes('/three/') || id.includes('three-stdlib') || id.includes('@react-three')) return 'vendor-3d';
            // React core + its runtime peers MUST share one chunk. Libraries like
            // use-sync-external-store (zustand, react-router) touch React.useState at
            // module-eval time; if they load before the react chunk, React is
            // undefined and the whole app fails to mount. Keeping them together
            // guarantees React initializes first.
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/') ||
              id.includes('use-sync-external-store') ||
              id.includes('react-router') ||
              id.includes('/zustand/')
            ) return 'vendor-react';
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
  esbuild: { target: 'es2020' },
});
