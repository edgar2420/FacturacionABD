/// <reference types="cypress" />
import { PRODUCTO_TRES_LOTES, PRODUCTO_UN_LOTE } from '../support/datos';

/**
 * Deja un pedido creado con UNA linea.
 *
 * Son 3 unidades a proposito: caben enteras en F244 (saldo 5), asi que el
 * pedido queda con una sola linea y estas pruebas pueden contar items sin
 * depender del reparto. El reparto en varias lineas se prueba en 03-lotes.
 */
function crearPedidoBase() {
  cy.buscarProductos();
  cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
  cy.get('[role="dialog"]').within(() => {
    cy.get('input[type="number"]').type('3');
    cy.contains('button', 'Crear pedido').click();
  });
  cy.wait('@crearPedido');
  cy.contains('1 ítem(s)').should('be.visible');
}

/** Busca otro producto. Se apunta por el placeholder, que es inequivoco. */
function buscarOtro(texto) {
  cy.get('input[placeholder="Nombre o código"]').clear().type(texto);
  cy.contains('button', 'Buscar producto').click();
  cy.wait('@productos');
}

describe('Paso 3 y 4: pedido y pago', () => {
  beforeEach(() => {
    cy.entrar();
    cy.llegarAProductos();
  });

  it('crea el pedido y muestra su numero', () => {
    crearPedidoBase();
    cy.contains('Pedido Nº 900123').should('be.visible');
  });

  it('la barra de total queda fija con el importe', () => {
    crearPedidoBase();
    // 3 unidades x Bs 50.
    cy.get('.total-fijo').should('be.visible').and('contain', '150,00');
  });

  it('el segundo producto se adiciona, no crea otro pedido', () => {
    crearPedidoBase();
    buscarOtro('CEFTRIAXONA');

    cy.abrirProducto(PRODUCTO_UN_LOTE.nombre);
    cy.get('[role="dialog"]').within(() => {
      // Con el pedido ya creado el boton cambia de nombre.
      cy.contains('button', 'Adicionar').should('be.visible');
      cy.get('input[type="number"]').type('2');
      cy.contains('button', 'Adicionar').click();
    });
    cy.wait('@adicionarItem');

    cy.contains('2 ítem(s)').should('be.visible');
  });

  it('manda la fecha de entrega al adicionar, que hace falta para el precio', () => {
    crearPedidoBase();
    buscarOtro('CEFTRIAXONA');
    cy.abrirProducto(PRODUCTO_UN_LOTE.nombre);
    cy.get('[role="dialog"]').within(() => {
      cy.get('input[type="number"]').type('2');
      cy.contains('button', 'Adicionar').click();
    });

    cy.wait('@adicionarItem').then(({ request }) => {
      expect(request.body.fechaEntrega).to.match(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  it('con el pedido creado no deja volver a cambiar cliente ni vendedor', () => {
    crearPedidoBase();

    cy.contains('button', 'Cliente').click();
    cy.contains('El pedido ya fue creado').should('be.visible');
  });

  it('eliminar pide confirmacion y se puede cancelar', () => {
    crearPedidoBase();

    cy.get('button[aria-label^="Eliminar"]').first().click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('¿Eliminar este ítem?').should('be.visible');
      cy.contains('button', 'Cancelar').click();
    });

    cy.contains('1 ítem(s)').should('be.visible');
  });

  it('muestra el error del servidor si no se puede adicionar', () => {
    cy.entrar({ adicionarFalla: true });
    cy.llegarAProductos();
    crearPedidoBase();
    buscarOtro('CEFTRIAXONA');

    cy.abrirProducto(PRODUCTO_UN_LOTE.nombre);
    cy.get('[role="dialog"]').within(() => {
      cy.get('input[type="number"]').type('2');
      cy.contains('button', 'Adicionar').click();
    });
    cy.wait('@adicionarItem');

    cy.contains('La cantidad supera el saldo disponible').should('be.visible');
  });

  it('terminar el pedido lleva al paso de pago', () => {
    crearPedidoBase();
    cy.contains('button', 'Terminar').click();
    cy.wait('@terminarPedido');

    cy.contains('Indique ahora si el pedido fue pagado').should('be.visible');
  });

  it('la transferencia exige elegir banco', () => {
    crearPedidoBase();
    cy.contains('button', 'Terminar').click();
    cy.wait('@terminarPedido');

    cy.campo('¿El pedido fue pagado?').select('Si');
    cy.campo('Forma de pago').select('TRA');
    cy.contains('label', 'Banco').should('be.visible');
  });

  it('el efectivo no pide banco', () => {
    crearPedidoBase();
    cy.contains('button', 'Terminar').click();
    cy.wait('@terminarPedido');

    cy.campo('¿El pedido fue pagado?').select('Si');
    cy.campo('Forma de pago').select('EFE');
    cy.contains('label', 'Banco').should('not.exist');
  });

  it('cancelar un pedido ya creado avisa que el pedido sigue existiendo', () => {
    crearPedidoBase();
    cy.contains('button', 'Cancelar').click();

    cy.get('[role="dialog"]').within(() => {
      cy.contains('ya existe en el sistema').should('be.visible');
      cy.contains('button', 'Sí, empezar de nuevo').click();
    });

    cy.contains('button', 'Buscar cliente').should('be.visible');
  });
});
