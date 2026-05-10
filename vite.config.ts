
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for code that expects it (like Next.js code)
    'process.env': {}
  },
  server: {
    host: '0.0.0.0',
    port: 5176,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'opcd196.mahaxaygroup.com',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3006',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:3006',
        ws: true
      }
    }
  }
});
