import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy: redireciona /api para o backend — sem hardcode de URL
    proxy: {
      '/api': {
        target:      'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});
