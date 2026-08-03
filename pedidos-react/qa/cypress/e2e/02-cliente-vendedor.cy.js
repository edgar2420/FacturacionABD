/// <reference types="cypress" />
import { entregaIso } from '../support/datos';

describe('Paso 1 y 2: cliente y vendedor', () => {
  beforeEach(() => cy.entrar());

  it('avisa en modal si se busca sin escribir nada', () => {
    cy.contains('button', 'Buscar cliente').click();

    cy.get('[role="dialog"]').within(() => {
      cy.contains('Falta el dato de búsqueda').should('be.visible');
      cy.contains('button', 'Entendido').click();
    });
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('al tocar una fila abre la ficha del cliente, no un boton al pie', () => {
    cy.campo('Dato a buscar').type('FAVIMA');
    cy.contains('button', 'Buscar cliente').click();
    cy.wait('@clientes');

    cy.get('table.seleccionable tbody tr').first().click();

    cy.get('[role="dialog"]').within(() => {
      cy.contains('IMP.AMP.FAVIMA').should('be.visible');
      // Datos que solo se ven en la ficha
      cy.contains('AV. ARCE 1234').should('be.visible');
      cy.contains('2771234').should('be.visible');
      cy.contains('ventas@favima.bo').should('be.visible');
    });
  });

  it('cancelar la ficha no elige el cliente', () => {
    cy.campo('Dato a buscar').type('FAVIMA');
    cy.contains('button', 'Buscar cliente').click();
    cy.wait('@clientes');
    cy.get('table.seleccionable tbody tr').first().click();

    cy.get('[role="dialog"]').within(() => cy.contains('button', 'Cancelar').click());
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('button', 'Buscar cliente').should('be.visible');
  });

  it('la tecla Escape cierra la ficha', () => {
    cy.campo('Dato a buscar').type('FAVIMA');
    cy.contains('button', 'Buscar cliente').click();
    cy.wait('@clientes');
    cy.get('table.seleccionable tbody tr').first().click();

    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('elegir cliente avanza al paso del vendedor', () => {
    cy.elegirCliente();
    cy.contains('Cliente elegido').should('be.visible');
    cy.contains('Fecha de entrega').should('be.visible');
  });

  it('no deja elegir vendedor sin fecha de entrega', () => {
    cy.elegirCliente();

    cy.campo('Dato a buscar').type('ROJAS');
    cy.contains('button', 'Buscar vendedor').click();
    cy.wait('@vendedores');
    cy.get('table.seleccionable tbody tr').first().click();
    cy.get('[role="dialog"]').within(() => cy.contains('button', 'Elegir vendedor').click());

    cy.contains('Falta la fecha de entrega').should('be.visible');
  });

  it('rechaza una fecha de entrega anterior a hoy', () => {
    cy.elegirCliente();

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const iso = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(
      ayer.getDate()
    ).padStart(2, '0')}`;

    cy.get('input[type="date"]').type(iso);
    cy.contains('no puede ser anterior a la fecha actual').should('be.visible');
  });

  it('el atajo "Hoy" llena la fecha', () => {
    cy.elegirCliente();
    cy.contains('button', 'Hoy').click();
    cy.get('input[type="date"]').should('not.have.value', '');
  });

  it('el calendario tiene hoy como minimo', () => {
    cy.elegirCliente();
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
      hoy.getDate()
    ).padStart(2, '0')}`;
    cy.get('input[type="date"]').should('have.attr', 'min', iso);
  });

  it('con fecha valida se elige vendedor y se llega a productos', () => {
    cy.elegirCliente();
    cy.elegirVendedor(entregaIso());
    cy.contains('button', 'Buscar producto').should('be.visible');
  });

  it('se puede volver a un paso anterior desde la barra de pasos', () => {
    cy.elegirCliente();
    cy.elegirVendedor();

    cy.contains('button', 'Cliente').click();
    cy.contains('button', 'Buscar cliente').should('be.visible');
  });
});
