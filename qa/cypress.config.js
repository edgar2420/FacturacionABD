const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    // URL de la aplicacion desplegada en Payara.
    // Se puede sobreescribir con la variable de entorno CYPRESS_BASE_URL.
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:8080/ABDFacturacion',

    // JSF + Hibernate + Oracle responden lento en la primera carga de cada vista,
    // por eso los timeouts son mas altos que el default de Cypress (4s).
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 60000,
    requestTimeout: 20000,

    // La app redirige entre /faces/views/... y /login.xhtml; sin esto Cypress
    // se queja de cambios de origen en algunos despliegues con HTTPS en 8181.
    chromeWebSecurity: false,

    video: false,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },

    // Cada spec es independiente: no compartimos sesion JSF entre archivos.
    testIsolation: true,

    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',

    env: {
      // Credenciales: definirlas en cypress.env.json (ignorado por git)
      // o por variables de entorno CYPRESS_usuario / CYPRESS_password.
      usuario: '',
      password: '',

      // Interruptor de seguridad. En false (default) NO se ejecutan las pruebas
      // que graban en la base de datos (facturas, recibos, pedidos reales).
      permitirEscrituras: false,

      // Contexto de la app tal como aparece en las URLs internas.
      contexto: '/ABDFacturacion'
    },

    setupNodeEvents(on, config) {
      const dirReportes = path.join(__dirname, 'reportes');

      on('task', {
        // Usada por el spec de inventario para volcar lo que encontro.
        guardarReporte({ nombre, contenido }) {
          if (!fs.existsSync(dirReportes)) {
            fs.mkdirSync(dirReportes, { recursive: true });
          }
          const destino = path.join(dirReportes, nombre);
          fs.writeFileSync(destino, contenido, 'utf8');
          return destino;
        },

        // Permite ver en la consola de Cypress lo que se va descubriendo.
        log(mensaje) {
          console.log(mensaje);
          return null;
        }
      });

      return config;
    }
  }
});
