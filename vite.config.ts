import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/tags': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true
      },
      '/api/chat': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true
      },
      '/api/generate': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true
      },
      '/api/version': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true
      }
    }
  }
});
