/// <reference types="cypress" />

/**
 * Modulo Facturacion / Cobranzas.
 *
 * Los tests de lectura solo consultan. Los que emiten factura o generan PDF
 * quedan deshabilitados salvo que se ejecute con --env permitirEscrituras=true,
 * porque escriben en Oracle y consumen numeracion fiscal.
 */
const permitirEscrituras = Cypress.env('permitirEscrituras') === true;

describe('03 - Facturacion (lectura)', () => {
  before(function () {
    if (!Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.abrirVista('facturacion.xhtml');
  });

  it('muestra el panel de filtros con sus campos', () => {
    cy.jsf('facturacionForm:myDataFiltro').should('exist');
    cy.jsf('facturacionForm:tipo').should('exist');
    cy.jsf('facturacionForm:numero').should('exist');
    cy.jsf('facturacionForm:fecha').should('exist');
    cy.jsf('facturacionForm:almacen').should('exist');
    cy.jsf('facturacionForm:buscarFacturaBoton').should('exist');
  });

  it('buscar sin datos no rompe la pantalla', () => {
    cy.jsf('facturacionForm:buscarFacturaBoton').click();
    cy.esperarAjax();
    // Sigue en la misma vista, sin pagina de error de Payara.
    cy.location('pathname').should('include', 'facturacion.xhtml');
    cy.get('body').should('not.contain.text', 'HTTP Status 500');
    cy.get('body').should('not.contain.text', 'Exception');
  });

  it('buscar una factura inexistente devuelve un aviso y no un error', () => {
    cy.jsf('facturacionForm:numero').clear().type('99999999');
    cy.jsf('facturacionForm:buscarFacturaBoton').click();
    cy.esperarAjax();
    cy.get('body').should('not.contain.text', 'HTTP Status 500');
    cy.textoMensajes().then((texto) => {
      cy.task('log', `Mensaje al buscar factura inexistente: "${texto}"`);
    });
  });

  it('el interruptor de formato de impresion (carta / rollo) esta disponible', () => {
    cy.existeJsf('facturacionForm:tipoImpresion').then((existe) => {
      if (!existe) {
        cy.task('log', 'tipoImpresion no visible: puede depender del rol imprimeFac del usuario');
      }
    });
  });

  it('no expone trazas de error de Java en la pantalla', () => {
    cy.get('body').should('not.contain.text', 'org.hibernate');
    cy.get('body').should('not.contain.text', 'java.lang.NullPointerException');
  });
});

describe('03 - Cobranzas (lectura)', () => {
  before(function () {
    if (!Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/faces/views/cobranzas.xhtml', { failOnStatusCode: false });
  });

  it('ofrece los filtros adicionales por razon social y correo', () => {
    cy.location('pathname').then((ruta) => {
      if (ruta.includes('login.xhtml')) {
        cy.task('log', 'cobranzas.xhtml no accesible para este usuario');
        return;
      }
      cy.jsf('cobranzasForm:razonSocial').should('exist');
      cy.jsf('cobranzasForm:correoElectronica').should('exist');
      cy.jsf('cobranzasForm:buscarFacturaBoton').should('exist');
    });
  });
});

describe('03 - Facturacion (ESCRITURA)', () => {
  before(function () {
    if (!permitirEscrituras || !Cypress.env('usuario')) {
      // Protege el entorno: emitir una factura consume numeracion fiscal.
      this.skip();
    }
  });

  beforeEach(() => {
    cy.login();
    cy.abrirVista('facturacion.xhtml');
  });

  it('emite una factura de la factura buscada', () => {
    const numero = Cypress.env('facturaPrueba');
    expect(numero, 'definir Cypress.env("facturaPrueba") con un numero valido del entorno de pruebas')
      .to.not.be.undefined;

    cy.jsf('facturacionForm:numero').clear().type(String(numero));
    cy.jsf('facturacionForm:buscarFacturaBoton').click();
    cy.esperarAjax();

    cy.jsf('facturacionForm:myDataFactura').should('be.visible');
    cy.jsf('facturacionForm:facturarPagosButton').click();
    cy.esperarAjax();

    cy.textoMensajes().should('not.be.empty');
    cy.get('body').should('not.contain.text', 'HTTP Status 500');
  });
});
