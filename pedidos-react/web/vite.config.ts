import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Todo lo que empiece con /api se reenvia al backend Express.
// Asi el navegador ve un solo origen y la cookie de sesion viaja sin lios.
const proxy = {
  '/api': {
    target: process.env.API_URL || 'http://localhost:3001',
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host permite abrirla desde el celular con la IP de la maquina.
    host: true,
    proxy
  },
  // `npm run preview` sirve la version compilada: es la unica forma de probar
  // la instalacion como aplicacion, porque el service worker no corre en dev.
  preview: {
    port: 4173,
    host: true,
    proxy
  }
});
