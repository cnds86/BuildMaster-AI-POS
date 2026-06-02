
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files: .env.example → .env.frontend (VITE_* vars for client)
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for code that expects it (like Next.js code)
      'process.env': {},
      // Expose public env vars to client
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || '/api'),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || '/ws'),
      'import.meta.env.VITE_PUBLIC_URL': JSON.stringify(env.VITE_PUBLIC_URL || 'http://localhost:5176'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'opcd196.mahaxaygroup.com',
        'mhx-hr.mahaxaygroup.com',
        'mhx-pos.mahaxaygroup.com',
      ],
      proxy: {
        '/api': {
          // Bug fix 2026-06-02: was 6039, changed to 3006 to match PORT in .env
          target: 'http://127.0.0.1:3006',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://127.0.0.1:3006',
          ws: true,
        },
      },
    },
  };
});
