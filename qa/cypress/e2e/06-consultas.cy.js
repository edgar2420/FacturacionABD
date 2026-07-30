/// <reference types="cypress" />

/**
 * Pantallas de consulta y reimpresion: Mis Pedidos e Impresion de Recibos.
 * Son de solo lectura por naturaleza, salvo la generacion del PDF.
 */
describe('06 - Mis Pedidos', () => {
  before(function () {
    if (!Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/faces/views/MisPedidos.xhtml', { failOnStatusCode: false });
  });

  it('abre el reporte con su filtro de almacen', () => {
    cy.location('pathname').then((ruta) => {
      if (ruta.includes('login.xhtml')) {
        cy.task('log', 'MisPedidos.xhtml no accesible para este usuario');
        return;
      }
      cy.jsf('facturacionForm:almacen').should('exist');
      cy.jsf('facturacionForm:buscarpedidosButton').should('exist');
    });
  });

  it('consulta pedidos y no arroja error de servidor', () => {
    cy.location('pathname').then((ruta) => {
      if (ruta.includes('login.xhtml')) return;

      cy.jsf('facturacionForm:buscarpedidosButton').click();
      cy.esperarAjax();
      cy.get('body').should('not.contain.text', 'HTTP Status 500');
      cy.get('body').should('not.contain.text', 'ORA-');
    });
  });
});

describe('06 - Impresion de Recibos', () => {
  before(function () {
    if (!Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/faces/views/impRecibos.xhtml', { failOnStatusCode: false });
  });

  it('ofrece los filtros deposito, cliente, fecha y usuario', () => {
    cy.location('pathname').then((ruta) => {
      if (ruta.includes('login.xhtml')) {
        cy.task('log', 'impRecibos.xhtml no accesible para este usuario');
        return;
      }
      cy.jsf('facturacionForm:deposito').should('exist');
      cy.jsf('facturacionForm:cliente').should('exist');
      cy.jsf('facturacionForm:fecha').should('exist');
      cy.jsf('facturacionForm:login').should('exist');
      cy.jsf('facturacionForm:buscarRecibosBoton').should('exist');
    });
  });

  it('buscar recibos responde sin error', () => {
    cy.location('pathname').then((ruta) => {
      if (ruta.includes('login.xhtml')) return;

      cy.jsf('facturacionForm:buscarRecibosBoton').click();
      cy.esperarAjax();
      cy.get('body').should('not.contain.text', 'HTTP Status 500');
    });
  });
});
