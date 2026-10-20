import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:7001',
      '/check': 'http://127.0.0.1:7001',
      '/runtime-config.js': 'http://127.0.0.1:7001',
    },
  },
});
