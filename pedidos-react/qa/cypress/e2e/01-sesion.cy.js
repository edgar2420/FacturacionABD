/// <reference types="cypress" />
import { simularApi } from '../support/api';

describe('Sesion', () => {
  it('pide usuario y contrasena antes de dejar entrar', () => {
    simularApi();
    cy.visit('/');

    cy.contains('button', 'Ingresar').should('be.disabled');
    cy.campo('Usuario').type('abd');
    cy.contains('button', 'Ingresar').should('be.disabled');
    cy.campo('Contraseña').type('abdlab');
    cy.contains('button', 'Ingresar').should('be.enabled');
  });

  it('muestra el logo y el nombre del modulo', () => {
    simularApi();
    cy.visit('/');

    cy.get('img[alt="Laboratorios ABD"]').should('be.visible');
    cy.contains('Módulo Pedidos ABD').should('be.visible');
  });

  it('el ojo alterna entre ver y ocultar la contrasena', () => {
    simularApi();
    cy.visit('/');

    cy.campo('Contraseña').type('abdlab').should('have.attr', 'type', 'password');
    cy.get('button[aria-label="Mostrar contraseña"]').click();
    cy.campo('Contraseña').should('have.attr', 'type', 'text');
    cy.get('button[aria-label="Ocultar contraseña"]').click();
    cy.campo('Contraseña').should('have.attr', 'type', 'password');
  });

  it('muestra el error del servidor sin dejar entrar', () => {
    simularApi({ loginFalla: true });
    cy.visit('/');

    cy.campo('Usuario').type('abd');
    cy.campo('Contraseña').type('mala');
    cy.contains('button', 'Ingresar').click();
    cy.wait('@login');

    cy.contains('Usuario o contrasena incorrectos').should('be.visible');
    cy.contains('h1', 'Módulo Pedidos ABD').should('not.exist');
  });

  it('entra y marca la sesion de desarrollo', () => {
    cy.entrar();
    cy.contains('.etiqueta', 'DEV').should('exist');
  });

  it('el pie muestra la autoria', () => {
    cy.entrar();
    cy.contains('Ing. Edgar Rojas Apaza').should('be.visible');
  });

  it('cerrar sesion devuelve a la pantalla de ingreso', () => {
    cy.entrar();
    cy.get('button[aria-label="Cerrar sesión"]').click();
    cy.wait('@logout');
    cy.contains('button', 'Ingresar').should('be.visible');
  });
});
