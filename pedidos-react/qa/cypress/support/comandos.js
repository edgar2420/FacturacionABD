/**
 * Comandos propios.
 *
 * Se apoyan en texto visible y en roles (getByRole/label), no en clases CSS:
 * asi las pruebas siguen valiendo cuando cambie el diseño, que en este
 * proyecto cambia a menudo.
 */
import { simularApi } from './api';
import { entregaIso } from './datos';

/** Deja la sesion iniciada y la aplicacion en el paso 1. */
Cypress.Commands.add('entrar', (opciones = {}) => {
  const estado = simularApi(opciones);

  cy.visit('/');
  cy.contains('label', 'Usuario').parent().find('input').type('abd');
  cy.contains('label', 'Contraseña').parent().find('input').type('abdlab');
  cy.contains('button', 'Ingresar').click();
  cy.wait('@login');

  cy.contains('h1', 'Módulo Pedidos ABD').should('be.visible');
  return cy.wrap(estado, { log: false });
});

/** Busca un cliente y lo elige desde la ficha del modal. */
Cypress.Commands.add('elegirCliente', (texto = 'FAVIMA') => {
  cy.campo('Dato a buscar').type(texto);
  cy.contains('button', 'Buscar cliente').click();
  cy.wait('@clientes');

  cy.get('table.seleccionable tbody tr').first().click();
  cy.get('[role="dialog"]').within(() => {
    cy.contains('button', 'Elegir cliente').click();
  });
});

/** Pone la fecha de entrega y elige el vendedor. */
Cypress.Commands.add('elegirVendedor', (fechaIso = entregaIso()) => {
  cy.get('input[type="date"]').type(fechaIso);

  cy.campo('Dato a buscar').type('ROJAS');
  cy.contains('button', 'Buscar vendedor').click();
  cy.wait('@vendedores');

  cy.get('table.seleccionable tbody tr').first().click();
  cy.get('[role="dialog"]').within(() => {
    cy.contains('button', 'Elegir vendedor').click();
  });
});

/** Busca productos y deja la lista en pantalla. */
Cypress.Commands.add('buscarProductos', (texto = 'CALCUSAN') => {
  cy.campo('Producto').type(texto);
  cy.contains('button', 'Buscar producto').click();
  cy.wait('@productos');
});

/** Abre la ficha de un producto por su descripcion. */
Cypress.Commands.add('abrirProducto', (descripcion) => {
  cy.contains('table.seleccionable tbody tr', descripcion).click();
  cy.get('[role="dialog"]').should('be.visible');
});

/** Un campo del formulario por su etiqueta visible. */
Cypress.Commands.add('campo', (etiqueta) =>
  cy.contains('label', etiqueta).parent().find('input, select').first()
);

/** Recorre los tres primeros pasos y deja la pantalla de productos lista. */
Cypress.Commands.add('llegarAProductos', () => {
  cy.elegirCliente();
  cy.elegirVendedor();
  cy.contains('button', 'Buscar producto').should('be.visible');
});
