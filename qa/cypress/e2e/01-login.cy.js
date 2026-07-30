/// <reference types="cypress" />

/**
 * Autenticacion. Necesita credenciales validas en cypress.env.json.
 * No graba datos de negocio, pero SI deja rastro: LoginBean registra cada
 * intento en el log y en la tabla de auditoria (AudControlLoginGeo).
 */
describe('01 - Login', () => {
  const hayCredenciales = !!Cypress.env('usuario');

  it('rechaza una contrasena incorrecta', () => {
    cy.visit('/login.xhtml');
    cy.jsf('loginForm:usuario').type(Cypress.env('usuario') || 'usuario_qa');
    cy.jsf('loginForm:password').type('clave-incorrecta-qa-000');
    cy.jsf('loginForm:loginButton').click();

    // LoginBean responde con un growl y NO redirige fuera del login.
    cy.location('pathname', { timeout: 20000 }).should('include', 'login.xhtml');
    cy.textoMensajes().should((texto) => {
      expect(texto.toLowerCase()).to.match(/no v[aá]lid|incorrect|no existe usuario/);
    });
  });

  it('avisa cuando el usuario no existe', () => {
    cy.visit('/login.xhtml');
    cy.jsf('loginForm:usuario').type('usuario_inexistente_qa_zzz');
    cy.jsf('loginForm:password').type('cualquiera');
    cy.jsf('loginForm:loginButton').click();

    cy.location('pathname', { timeout: 20000 }).should('include', 'login.xhtml');
    cy.textoMensajes().should((texto) => {
      expect(texto.toLowerCase()).to.include('no existe usuario');
    });
  });

  it('no autentica con los campos vacios', () => {
    cy.visit('/login.xhtml');
    cy.jsf('loginForm:loginButton').click();
    cy.location('pathname', { timeout: 20000 }).should('include', 'login.xhtml');
  });

  (hayCredenciales ? it : it.skip)('entra con credenciales validas y aterriza en Facturacion', () => {
    cy.loginUI();
    cy.location('pathname', { timeout: 30000 }).should('include', '/views/facturacion.xhtml');
  });

  (hayCredenciales ? it : it.skip)('crea la cookie de sesion JSESSIONID', () => {
    cy.loginUI();
    cy.location('pathname', { timeout: 30000 }).should('include', '/views/facturacion.xhtml');
    cy.getCookie('JSESSIONID').should('exist');
  });

  (hayCredenciales ? it : it.skip)('el logout invalida la sesion', () => {
    cy.login();
    cy.abrirVista('facturacion.xhtml');

    // El servlet servlet.Logout esta mapeado en /Logout (ver web.xml).
    cy.visit(`${Cypress.env('contexto')}/Logout`, { failOnStatusCode: false });

    // Tras el logout, una vista protegida debe volver a pedir login.
    cy.visit('/faces/views/facturacion.xhtml', { failOnStatusCode: false });
    cy.location('pathname', { timeout: 30000 }).should('include', 'login.xhtml');
  });
});
