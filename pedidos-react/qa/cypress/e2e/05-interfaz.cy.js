/// <reference types="cypress" />
/**
 * Comportamiento de la interfaz: tema, responsive, modales e instalacion.
 * Son los puntos que el usuario fue pidiendo y que conviene no perder.
 */
import { simularApi } from '../support/api';
import { PRODUCTO_TRES_LOTES } from '../support/datos';

describe('Interfaz', () => {
  describe('tema', () => {
    it('arranca SIEMPRE en claro, aunque el sistema este en oscuro', () => {
      simularApi();
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win, 'matchMedia')
            .withArgs('(prefers-color-scheme: dark)')
            .returns({ matches: true, addEventListener() {}, removeEventListener() {} });
        }
      });
      cy.get('html').should('have.attr', 'data-tema', 'claro');
    });

    it('recuerda el tema oscuro si la persona lo eligio', () => {
      cy.entrar();
      cy.get('button[aria-label="Usar tema oscuro"]').click();
      cy.get('html').should('have.attr', 'data-tema', 'oscuro');

      cy.reload();
      cy.get('html').should('have.attr', 'data-tema', 'oscuro');
    });
  });

  describe('modales', () => {
    it('quedan centrados, no pegados abajo', () => {
      cy.viewport('samsung-note9');
      cy.entrar();
      cy.contains('button', 'Buscar cliente').click();

      cy.get('[role="dialog"]').then(($m) => {
        const caja = $m[0].getBoundingClientRect();
        const alto = Cypress.config('viewportHeight');
        const centroModal = caja.top + caja.height / 2;

        // El centro del modal tiene que estar cerca del centro de la pantalla.
        expect(Math.abs(centroModal - alto / 2)).to.be.lessThan(alto * 0.12);
      });
    });

    it('el fondo bloquea el desplazamiento de la pagina', () => {
      cy.entrar();
      cy.contains('button', 'Buscar cliente').click();
      cy.get('body').should('have.css', 'overflow', 'hidden');
    });

    it('tocar fuera del modal lo cierra', () => {
      cy.entrar();
      cy.contains('button', 'Buscar cliente').click();
      cy.get('.fondo-modal').click('topLeft');
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('los avisos de exito salen en toast y se van solos', () => {
      cy.entrar();
      cy.llegarAProductos();
      cy.buscarProductos();
      cy.abrirProducto(PRODUCTO_TRES_LOTES.nombre);
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="number"]').type('10');
        cy.contains('button', 'Crear pedido').click();
      });
      cy.wait('@crearPedido');

      cy.get('.toast').should('be.visible');
      cy.get('.toast', { timeout: 8000 }).should('not.exist');
    });
  });

  describe('celular', () => {
    beforeEach(() => cy.viewport('samsung-note9'));

    it('las tablas se ven como tarjetas, con etiqueta y valor', () => {
      cy.entrar();
      cy.llegarAProductos();
      cy.buscarProductos();

      cy.contains('table.seleccionable tbody tr', PRODUCTO_TRES_LOTES.nombre).within(() => {
        // El valor tiene que verse, no solo la etiqueta: fue un fallo real.
        cy.contains(PRODUCTO_TRES_LOTES.nombre).should('be.visible');
        cy.contains('325').should('be.visible');
      });
    });

    it('la pagina no se desplaza en horizontal', () => {
      cy.entrar();
      cy.llegarAProductos();
      cy.buscarProductos();

      cy.window().then((win) => {
        expect(win.document.documentElement.scrollWidth).to.be.at.most(
          win.document.documentElement.clientWidth + 1
        );
      });
    });

    it('la barra no se descuadra: el titulo no se parte letra por letra', () => {
      cy.entrar();

      // Si el titulo se aplasta, cada letra cae en una linea y la barra crece
      // hasta ocupar un cuarto de la pantalla. Fue un fallo real.
      // Dos filas: logo y titulo arriba, chapas y botones abajo. Con el fallo
      // llegaba a rozar los 200 px.
      cy.get('.barra').then(($b) => {
        expect($b[0].getBoundingClientRect().height, 'alto de la barra').to.be.lessThan(120);
      });

      cy.contains('h1', 'Módulo Pedidos ABD').then(($h) => {
        const caja = $h[0].getBoundingClientRect();
        // Una sola linea de texto: si se partiera, el alto seria mucho mayor.
        expect(caja.height, 'alto del titulo').to.be.lessThan(30);
        expect(caja.width, 'ancho del titulo').to.be.greaterThan(90);
      });
    });

    it('el almacen y el titulo siguen visibles en celular', () => {
      cy.entrar();
      cy.contains('h1', 'Módulo Pedidos ABD').should('be.visible');
      cy.get('.chapa-almacen').should('be.visible').and('contain', 'Fábrica');
      cy.get('button[aria-label="Cerrar sesión"]').should('be.visible');
    });

    it('los botones tienen area tactil suficiente', () => {
      cy.entrar();
      cy.contains('button', 'Buscar cliente').then(($b) => {
        expect($b[0].getBoundingClientRect().height).to.be.at.least(40);
      });
    });
  });

  describe('instalable', () => {
    it('publica el manifest con los iconos', () => {
      simularApi();
      cy.visit('/');
      cy.get('link[rel="manifest"]').should('have.attr', 'href', '/manifest.webmanifest');

      cy.request('/manifest.webmanifest').then((r) => {
        expect(r.body.name).to.eq('Módulo Pedidos ABD');
        expect(r.body.display).to.eq('standalone');

        const tamanos = r.body.icons.map((i) => i.sizes);
        expect(tamanos).to.include('192x192');
        expect(tamanos).to.include('512x512');
        expect(r.body.icons.some((i) => i.purpose === 'maskable')).to.eq(true);
      });
    });

    it('los iconos y el logo existen', () => {
      for (const ruta of ['/icono-192.png', '/icono-512.png', '/logo-abd.png']) {
        cy.request(ruta).its('status').should('eq', 200);
      }
    });
  });
});
