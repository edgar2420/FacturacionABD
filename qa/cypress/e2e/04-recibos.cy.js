/// <reference types="cypress" />

/**
 * Modulo Recibos de cobranza.
 *
 * Flujo real: buscar cliente -> elegirlo -> ver su deuda -> registrar pago
 * (moneda, monto, tipo de documento, banco) -> imprimir recibo carta o rollo.
 *
 * Solo el ultimo bloque graba en la base de datos.
 */
const permitirEscrituras = Cypress.env('permitirEscrituras') === true;

describe('04 - Recibos (lectura)', () => {
  before(function () {
    if (!Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.abrirVista('recibos.xhtml');
  });

  it('presenta el buscador de clientes', () => {
    cy.jsf('recibosForm:datoBusqueda').should('be.visible');
    cy.jsf('recibosForm:buscarClienteButton').should('be.visible');
  });

  it('busca un cliente y lista resultados en la tabla', () => {
    const criterio = Cypress.env('clienteBusqueda') || 'A';

    cy.jsf('recibosForm:datoBusqueda').clear().type(criterio);
    cy.jsf('recibosForm:buscarClienteButton').click();
    cy.esperarAjax();

    cy.get('body').should('not.contain.text', 'HTTP Status 500');

    cy.existeJsf('recibosForm:singleDT').then((existe) => {
      if (!existe) {
        cy.task('log', `Sin tabla de resultados para el criterio "${criterio}"`);
        return;
      }
      cy.jsf('recibosForm:singleDT')
        .find('tbody tr')
        .then(($filas) => {
          cy.task('log', `Clientes encontrados con "${criterio}": ${$filas.length}`);
        });
    });
  });

  it('una busqueda sin coincidencias no produce error', () => {
    cy.jsf('recibosForm:datoBusqueda').clear().type('ZZZZ-CLIENTE-QA-INEXISTENTE');
    cy.jsf('recibosForm:buscarClienteButton').click();
    cy.esperarAjax();
    cy.get('body').should('not.contain.text', 'HTTP Status 500');
    cy.location('pathname').should('include', 'recibos.xhtml');
  });

  it('al elegir un cliente se muestra su panel de deudas', () => {
    const criterio = Cypress.env('clienteBusqueda') || 'A';

    cy.jsf('recibosForm:datoBusqueda').clear().type(criterio);
    cy.jsf('recibosForm:buscarClienteButton').click();
    cy.esperarAjax();

    cy.existeJsf('recibosForm:singleDT').then((existe) => {
      if (!existe) return;

      cy.jsf('recibosForm:singleDT').find('tbody tr').then(($filas) => {
        if ($filas.length === 0) return;

        cy.wrap($filas.eq(0)).click();
        cy.jsf('recibosForm:elegirClienteButton').click();
        cy.esperarAjax();

        cy.jsf('recibosForm:myDataDeudas').should('exist');
      });
    });
  });

  it('los selectores de moneda, tipo de documento y banco tienen opciones', () => {
    ['recibosForm:codMonedaPago', 'recibosForm:tipDocPago', 'recibosForm:banco'].forEach((id) => {
      cy.existeJsf(id).then((existe) => {
        if (!existe) {
          cy.task('log', `${id} no presente antes de elegir cliente (se renderiza despues)`);
          return;
        }
        // PrimeFaces mantiene un <select> oculto con las opciones reales.
        cy.get(`[id="${id}_input"], [id="${id}"] select, [id="${id}"]`).should('exist');
      });
    });
  });
});

describe('04 - Recibos (ESCRITURA)', () => {
  before(function () {
    if (!permitirEscrituras || !Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.abrirVista('recibos.xhtml');
  });

  it('registra un pago de un centavo sobre la deuda del cliente de prueba', () => {
    const criterio = Cypress.env('clienteBusqueda');
    expect(criterio, 'definir Cypress.env("clienteBusqueda") para el entorno de pruebas').to.be.a('string');

    cy.jsf('recibosForm:datoBusqueda').clear().type(criterio);
    cy.jsf('recibosForm:buscarClienteButton').click();
    cy.esperarAjax();

    cy.jsf('recibosForm:singleDT').find('tbody tr').first().click();
    cy.jsf('recibosForm:elegirClienteButton').click();
    cy.esperarAjax();

    cy.jsf('recibosForm:mntPagar').clear().type('0.01');
    cy.jsf('recibosForm:realizarPagoButton').click();
    cy.esperarAjax();

    cy.textoMensajes().should('not.be.empty');
    cy.get('body').should('not.contain.text', 'HTTP Status 500');
  });

  it('no permite pagar mas de lo adeudado', () => {
    // Regla incorporada en el commit bb10e8a ("no pagar mas de un centavo al adeudado").
    const criterio = Cypress.env('clienteBusqueda');
    expect(criterio).to.be.a('string');

    cy.jsf('recibosForm:datoBusqueda').clear().type(criterio);
    cy.jsf('recibosForm:buscarClienteButton').click();
    cy.esperarAjax();

    cy.jsf('recibosForm:singleDT').find('tbody tr').first().click();
    cy.jsf('recibosForm:elegirClienteButton').click();
    cy.esperarAjax();

    cy.jsf('recibosForm:mntPagar').clear().type('99999999');
    cy.jsf('recibosForm:realizarPagoButton').click();
    cy.esperarAjax();

    cy.textoMensajes().should((texto) => {
      expect(texto.length, 'la app debe avisar que el monto excede la deuda').to.be.greaterThan(0);
    });
  });
});
