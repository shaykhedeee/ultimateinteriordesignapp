import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  server: {
    port: Number(process.env.CLIENT_PORT || 5173),
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true,
      },
      '/storage': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true,
      },
      '/reference-library': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true,
      },
      '/newinfo': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true,
      },
      '/images': {
        target: `http://127.0.0.1:${process.env.PORT || 8787}`,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend/src'),
      '@components': path.resolve(__dirname, 'frontend/src/components'),
      '@screens': path.resolve(__dirname, 'frontend/src/screens'),
      '@services': path.resolve(__dirname, 'frontend/src/services'),
      '@styles': path.resolve(__dirname, 'frontend/src/styles'),
      '@config': path.resolve(__dirname, 'frontend/src/config')
    }
  }
});
