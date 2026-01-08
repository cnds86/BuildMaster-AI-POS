
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
    port: 3000,
  }
});
