/// <reference types="cypress" />

/**
 * Pruebas de humo. No necesitan credenciales ni tocan la base de datos.
 * Sirven para responder: "el WAR esta desplegado y respondiendo?".
 */
describe('00 - Disponibilidad de la aplicacion', () => {
  it('la pagina de login responde con HTTP 200', () => {
    cy.request('/login.xhtml').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body, 'la respuesta contiene el titulo de la app').to.include('Laboratorios ABD');
    });
  });

  it('la pagina de login renderiza usuario, password y boton Ingresar', () => {
    cy.visit('/login.xhtml');
    cy.contains('FACTURACION ABD').should('be.visible');
    cy.jsf('loginForm:usuario').should('be.visible');
    cy.jsf('loginForm:password').should('be.visible');
    cy.jsf('loginForm:loginButton').should('be.visible').and('contain.text', 'Ingresar');
  });

  it('PrimeFaces se cargo en el navegador', () => {
    cy.visit('/login.xhtml');
    cy.window().should('have.property', 'PrimeFaces');
  });

  it('el logo y el favicon se sirven correctamente', () => {
    cy.request('/resources/images/icons/logo-dark.png').its('status').should('eq', 200);
    cy.request({ url: '/resources/images/icons/favicon.ico', failOnStatusCode: false })
      .its('status')
      .should('be.oneOf', [200, 304]);
  });

  it('el pie muestra la marca del sistema', () => {
    cy.visit('/login.xhtml');
    cy.contains('Laboratorios ABD').should('exist');
  });
});

describe('00 - Control de acceso a vistas protegidas', () => {
  // El PhaseListener security.AutenticationListener redirige a login.xhtml
  // cualquier vista bajo /views/ cuando no hay "usuario" en la sesion.
  const vistasProtegidas = [
    'facturacion.xhtml',
    'cobranzas.xhtml',
    'recibos.xhtml',
    'impRecibos.xhtml',
    'pedidos.xhtml',
    'MisPedidos.xhtml'
  ];

  vistasProtegidas.forEach((vista) => {
    it(`sin sesion, /views/${vista} redirige al login`, () => {
      cy.clearCookies();
      cy.visit(`/faces/views/${vista}`, { failOnStatusCode: false });
      cy.location('pathname', { timeout: 30000 }).should('include', 'login.xhtml');
    });
  });
});
