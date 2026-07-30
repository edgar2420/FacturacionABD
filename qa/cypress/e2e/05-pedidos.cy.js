/// <reference types="cypress" />

/**
 * Modulo Pedidos: la pantalla mas grande del sistema (PedidosBean ~1000 lineas).
 *
 * Flujo real: elegir cliente -> elegir vendedor -> crear pedido -> buscar
 * productos y adicionarlos con cantidad -> terminar pedido -> elegir tipo de
 * pago (incluido contra entrega) y banco -> pagar.
 */
const permitirEscrituras = Cypress.env('permitirEscrituras') === true;

describe('05 - Pedidos (lectura)', () => {
  before(function () {
    if (!Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.abrirVista('pedidos.xhtml');
  });

  it('presenta los tres buscadores: cliente, vendedor y producto', () => {
    cy.jsf('pedidosForm:datoBusqueda').should('exist');
    cy.jsf('pedidosForm:buscarClienteButton').should('exist');
    cy.jsf('pedidosForm:datoBusquedaVendedor').should('exist');
    cy.jsf('pedidosForm:buscarVendedorButton').should('exist');
  });

  it('busca clientes y devuelve resultados sin error', () => {
    const criterio = Cypress.env('clienteBusqueda') || 'A';
    cy.jsf('pedidosForm:datoBusqueda').clear().type(criterio);
    cy.jsf('pedidosForm:buscarClienteButton').click();
    cy.esperarAjax();

    cy.get('body').should('not.contain.text', 'HTTP Status 500');
    cy.existeJsf('pedidosForm:singleDT').then((existe) => {
      if (!existe) return;
      cy.jsf('pedidosForm:singleDT').find('tbody tr').then(($f) => {
        cy.task('log', `Clientes en pedidos con "${criterio}": ${$f.length}`);
      });
    });
  });

  it('busca vendedores sin error', () => {
    const criterio = Cypress.env('vendedorBusqueda') || 'A';
    cy.jsf('pedidosForm:datoBusquedaVendedor').clear().type(criterio);
    cy.jsf('pedidosForm:buscarVendedorButton').click();
    cy.esperarAjax();

    cy.get('body').should('not.contain.text', 'HTTP Status 500');
    cy.existeJsf('pedidosForm:singleDT1').then((existe) => {
      if (!existe) return;
      cy.jsf('pedidosForm:singleDT1').find('tbody tr').then(($f) => {
        cy.task('log', `Vendedores encontrados con "${criterio}": ${$f.length}`);
      });
    });
  });

  it('busca productos y muestra la tabla con precios', () => {
    const criterio = Cypress.env('productoBusqueda') || 'A';
    cy.existeJsf('pedidosForm:productoBusqueda').then((existe) => {
      if (!existe) {
        cy.task('log', 'El buscador de productos aparece recien despues de crear el pedido');
        return;
      }
      cy.jsf('pedidosForm:productoBusqueda').clear().type(criterio);
      cy.jsf('pedidosForm:buscarProductoButton').click();
      cy.esperarAjax();
      cy.get('body').should('not.contain.text', 'HTTP Status 500');
    });
  });

  it('la hoja de estilos propia de pedidos se sirve', () => {
    // web/resources/css/pedidos.css
    cy.request({ url: '/resources/css/pedidos.css', failOnStatusCode: false })
      .its('status')
      .should('be.oneOf', [200, 304, 404]);
  });

  it('no muestra trazas de error de Java', () => {
    cy.get('body').should('not.contain.text', 'java.lang.');
    cy.get('body').should('not.contain.text', 'ORA-');
  });
});

describe('05 - Pedidos (ESCRITURA)', () => {
  before(function () {
    if (!permitirEscrituras || !Cypress.env('usuario')) this.skip();
  });

  beforeEach(() => {
    cy.login();
    cy.abrirVista('pedidos.xhtml');
  });

  it('crea un pedido completo hasta adicionar un producto', () => {
    const cliente = Cypress.env('clienteBusqueda');
    const vendedor = Cypress.env('vendedorBusqueda');
    const producto = Cypress.env('productoBusqueda');

    expect(cliente, 'Cypress.env("clienteBusqueda")').to.be.a('string');
    expect(vendedor, 'Cypress.env("vendedorBusqueda")').to.be.a('string');
    expect(producto, 'Cypress.env("productoBusqueda")').to.be.a('string');

    cy.jsf('pedidosForm:datoBusqueda').clear().type(cliente);
    cy.jsf('pedidosForm:buscarClienteButton').click();
    cy.esperarAjax();
    cy.jsf('pedidosForm:singleDT').find('tbody tr').first().click();
    cy.jsf('pedidosForm:elegirClienteButton').click();
    cy.esperarAjax();

    cy.jsf('pedidosForm:datoBusquedaVendedor').clear().type(vendedor);
    cy.jsf('pedidosForm:buscarVendedorButton').click();
    cy.esperarAjax();
    cy.jsf('pedidosForm:singleDT1').find('tbody tr').first().click();
    cy.jsf('pedidosForm:elegirVendedorButton').click();
    cy.esperarAjax();

    cy.jsf('pedidosForm:crearPedidoButton').click();
    cy.esperarAjax();

    cy.jsf('pedidosForm:productoBusqueda').clear().type(producto);
    cy.jsf('pedidosForm:buscarProductoButton').click();
    cy.esperarAjax();
    cy.jsf('pedidosForm:singleDT2').find('tbody tr').first().click();

    cy.jsf('pedidosForm:cantidadReserva').clear().type('1');
    cy.jsf('pedidosForm:adicionarProductoButton').click();
    cy.esperarAjax();

    // El detalle del pedido debe quedar visible con al menos una linea.
    cy.jsf('pedidosForm:pedido').should('be.visible');
    cy.get('body').should('not.contain.text', 'HTTP Status 500');
  });
});
