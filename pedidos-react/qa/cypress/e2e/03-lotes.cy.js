/// <reference types="cypress" />
/**
 * Lotes sumados y reparto FEFO.
 *
 * La regla que se comprueba aqui es la que pidio el usuario:
 *
 *   - En la lista se ve UNA fila por producto, con el saldo de todos sus lotes
 *     sumado, ordenada por lo que vence antes y, a igual fecha, por lo que
 *     tiene menos saldo.
 *   - Al reservar, la mercaderia sale primero del lote que vence antes; entre
 *     lotes que vencen el mismo dia, primero el de menor saldo.
 *
 * Producto de referencia (PT982, CALCUSAN):
 *   F244  30/09/26  saldo   5
 *   F245  30/09/26  saldo 120
 *   F250  31/12/26  saldo 200   -> saldo total 325
 */
import { PRODUCTO_TRES_LOTES, PRODUCTO_UN_LOTE } from '../support/datos';

describe('Lotes sumados y reparto', () => {
  beforeEach(() => {
    cy.entrar();
    cy.llegarAProductos();
    cy.buscarProductos();
  });

  describe('la lista', () => {
    it('muestra una sola fila por producto, no una por lote', () => {
      cy.get('table.seleccionable tbody tr').should('have.length', 2);
      cy.contains('table.seleccionable tbody tr', PRODUCTO_TRES_LOTES.nombre).should(
        'have.length',
        1
      );
    });

    it('el saldo es la suma de los tres lotes (325), no el de uno solo', () => {
      cy.contains('table.seleccionable tbody tr', PRODUCTO_TRES_LOTES.nombre).within(() => {
        cy.contains('325').should('be.visible');
      });
      // Ninguno de los saldos sueltos aparece como el saldo de la fila.
      cy.contains('table.seleccionable tbody tr', PRODUCTO_TRES_LOTES.nombre)
        .find('td')
        .last()
        .should('have.text', '325');
    });

    it('avisa cuantos lotes hay detras', () => {
      cy.contains('table.seleccionable tbody tr', PRODUCTO_TRES_LOTES.nombre).within(() => {
        cy.contains('3 lotes').should('exist');
      });
    });

    it('muestra el vencimiento mas proximo, no el mas lejano', () => {
      cy.contains('table.seleccionable tbody tr', PRODUCTO_TRES_LOTES.nombre).within(() => {
        cy.contains('30/09/26').should('exist');
        cy.contains('31/12/26').should('not.exist');
      });
    });

    it('explica el criterio en pantalla', () => {
      cy.contains('El saldo es la suma de todos los lotes').should('be.visible');
      cy.contains('Se despacha primero lo que vence antes').should('be.visible');
    });
  });

  describe('la ficha del producto', () => {
    it('el maximo a reservar es el saldo total', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').should('have.attr', 'max', '325');
        cy.contains('Máximo 325 PZA').should('be.visible');
      });
    });

    it('una cantidad que cabe en el lote chico sale solo de ese lote', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('3');

        cy.contains('Sale de este lote').should('be.visible');
        cy.get('.reparto li').should('have.length', 1);
        cy.get('.reparto li').first().should('contain', 'F244').and('contain', '3 PZA');
      });
    });

    it('agota el lote de menor saldo antes de tocar el siguiente', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('100');

        cy.get('.reparto li').should('have.length', 2);
        // F244 (5) se agota primero aunque vence el mismo dia que F245:
        // a igual fecha sale primero el de menor saldo.
        cy.get('.reparto li').eq(0).should('contain', 'F244').and('contain', '5 PZA');
        cy.get('.reparto li').eq(1).should('contain', 'F245').and('contain', '95 PZA');
      });
    });

    it('reparte entre los tres lotes y deja para el final el que vence mas tarde', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('300');

        cy.get('.reparto li').should('have.length', 3);
        cy.get('.reparto li').eq(0).should('contain', 'F244').and('contain', '5 PZA');
        cy.get('.reparto li').eq(1).should('contain', 'F245').and('contain', '120 PZA');
        cy.get('.reparto li').eq(2).should('contain', 'F250').and('contain', '175 PZA');

        // El ultimo es el que vence mas tarde.
        cy.get('.reparto li').eq(2).should('contain', '31/12/26');
      });
    });

    it('no deja pasar del saldo total', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('326');

        cy.contains('No puede sobrepasar el saldo actual').should('be.visible');
        cy.contains('button', 'Crear pedido').should('be.disabled');
        cy.get('.reparto').should('not.exist');
      });
    });

    it('rechaza cero y cantidades negativas', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('0');
        cy.contains('button', 'Crear pedido').should('be.disabled');

        cy.get('input[type="number"]').clear().type('-5');
        cy.contains('button', 'Crear pedido').should('be.disabled');
      });
    });

    it('el subtotal usa el precio del producto', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('10');
        cy.contains('Subtotal aproximado').should('contain', '500,00');
      });
    });

    it('un producto de un solo lote tambien muestra de donde sale', () => {
      cy.abrirProducto(PRODUCTO_UN_LOTE.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('2');
        cy.get('.reparto li').should('have.length', 1);
        cy.get('.reparto li').should('contain', '233052027');
      });
    });
  });

  describe('al guardar', () => {
    it('el pedido queda con una linea por lote', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('300');
        cy.contains('button', 'Crear pedido').click();
      });
      cy.wait('@crearPedido');

      // 300 unidades repartidas en tres lotes = tres lineas del pedido.
      cy.contains('3 ítem(s)').should('be.visible');
      cy.contains('Lote F244').should('be.visible');
      cy.contains('Lote F245').should('be.visible');
      cy.contains('Lote F250').should('be.visible');
    });

    it('manda al servidor el producto y la cantidad, no el lote elegido a mano', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('100');
        cy.contains('button', 'Crear pedido').click();
      });

      cy.wait('@crearPedido').then(({ request }) => {
        expect(request.body.cantidad).to.eq(100);
        expect(request.body.producto.producto).to.eq('PT982');
        // El reparto lo decide el servidor con los saldos del momento.
        expect(request.body).to.not.have.property('lote');
      });
    });

    it('el aviso dice en cuantos lotes quedo repartido', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('300');
        cy.contains('button', 'Crear pedido').click();
      });
      cy.wait('@crearPedido');

      cy.contains('en 3 lote(s)').should('be.visible');
    });

    it('el total suma todas las lineas del reparto', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('300');
        cy.contains('button', 'Crear pedido').click();
      });
      cy.wait('@crearPedido');

      // 300 x Bs 50 = 15.000, repartido en tres lineas pero un solo total.
      cy.get('.total-fijo').should('contain', '15.000,00');
    });

    it('eliminar el producto quita todas sus lineas de golpe', () => {
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('300');
        cy.contains('button', 'Crear pedido').click();
      });
      cy.wait('@crearPedido');
      cy.contains('3 ítem(s)').should('be.visible');

      // El paquete de Oracle borra por codigo de item, asi que se van las tres.
      cy.get('button[aria-label^="Eliminar"]').first().click();
      cy.get('[role="dialog"]').within(() => cy.contains('button', 'Eliminar').click());
      cy.wait('@eliminarItem');

      cy.contains('El pedido no tiene líneas').should('be.visible');
    });
  });
});
