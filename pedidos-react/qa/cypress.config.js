const { defineConfig } = require('cypress');

/**
 * QA del modulo de Pedidos en React.
 *
 * IMPORTANTE: por defecto TODAS las llamadas a /api se interceptan con datos
 * de prueba (cypress/support/api.js). La suite no toca Oracle y no crea
 * pedidos de verdad, que es lo que hay que evitar porque el backend apunta a
 * la base de produccion.
 *
 * Solo hace falta tener el frontend levantado:  cd ../web && npm run dev
 */
module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.URL_WEB || 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 }
  }
});
