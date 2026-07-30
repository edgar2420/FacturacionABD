import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Todo lo que empiece con /api se reenvia al backend Express.
    // Asi el navegador ve un solo origen y la cookie de sesion viaja sin lios.
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
