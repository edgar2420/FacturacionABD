/// <reference types="cypress" />

/**
 * Comandos propios para trabajar con JSF / PrimeFaces.
 *
 * Detalle clave: JSF genera los id del cliente como "idDelForm:idDelComponente",
 * y los dos puntos son un caracter especial en CSS. Por eso NUNCA usamos
 * cy.get('#loginForm:usuario') sino el selector por atributo.
 */

// --- Selectores -------------------------------------------------------------

/** cy.jsf('loginForm:usuario') -> elemento con ese id de cliente JSF */
Cypress.Commands.add('jsf', (idCliente, opciones = {}) => {
  return cy.get(`[id="${idCliente}"]`, opciones);
});

/** Igual que jsf() pero sin fallar si no existe (devuelve coleccion vacia). */
Cypress.Commands.add('jsfSiExiste', (idCliente) => {
  return cy.get('body').then(($body) => {
    const $el = $body.find(`[id="${idCliente}"]`);
    return cy.wrap($el, { log: false });
  });
});

/** Comprueba si un id de cliente JSF esta presente en el DOM. Devuelve boolean. */
Cypress.Commands.add('existeJsf', (idCliente) => {
  return cy.get('body').then(($body) => $body.find(`[id="${idCliente}"]`).length > 0);
});

// --- Sincronizacion con AJAX de PrimeFaces ----------------------------------

/**
 * Espera a que la cola de peticiones AJAX de PrimeFaces quede vacia.
 * PrimeFaces 6 expone PrimeFaces.ajax.Queue.isEmpty().
 * Si la variable global no existe (pagina sin PF cargado) no espera nada.
 */
Cypress.Commands.add('esperarAjax', () => {
  cy.window({ log: false }).then((win) => {
    if (!win.PrimeFaces || !win.PrimeFaces.ajax || !win.PrimeFaces.ajax.Queue) {
      return;
    }
    return cy.waitUntilVacia(win);
  });
});

Cypress.Commands.add('waitUntilVacia', (win) => {
  return cy.wrap(null, { log: false }).should(() => {
    expect(win.PrimeFaces.ajax.Queue.isEmpty(), 'cola AJAX de PrimeFaces vacia').to.be.true;
  });
});

// --- Autenticacion ----------------------------------------------------------

/**
 * Login por la interfaz. La vista de login usa el renderkit PRIMEFACES_MOBILE
 * y el bean hace un redirect del lado del servidor a /faces/views/facturacion.xhtml
 * cuando las credenciales son correctas (ver LoginBean.login).
 */
Cypress.Commands.add('loginUI', (usuario, password) => {
  const user = usuario || Cypress.env('usuario');
  const pass = password || Cypress.env('password');

  expect(user, 'Cypress.env("usuario") debe estar definido (ver cypress.env.json)').to.be.a('string')
    .and.not.be.empty;

  cy.visit('/login.xhtml');
  cy.jsf('loginForm:usuario').should('be.visible').clear().type(user);
  cy.jsf('loginForm:password').should('be.visible').clear().type(pass, { log: false });
  cy.jsf('loginForm:loginButton').click();
});

/**
 * Login reutilizable entre tests del mismo spec. cy.session cachea las cookies
 * (JSESSIONID) para no repetir el flujo completo en cada test.
 */
Cypress.Commands.add('login', (usuario, password) => {
  const user = usuario || Cypress.env('usuario');
  const pass = password || Cypress.env('password');

  cy.session(
    ['abd', user],
    () => {
      cy.loginUI(user, pass);
      // El exito se confirma porque el servidor redirige fuera de login.xhtml
      cy.location('pathname', { timeout: 30000 }).should('include', '/views/facturacion.xhtml');
    },
    {
      cacheAcrossSpecs: false,
      validate() {
        // Si la sesion JSF expiro, al pedir una vista protegida el
        // AutenticationListener nos devuelve a login.xhtml.
        cy.visit('/faces/views/facturacion.xhtml');
        cy.location('pathname').should('not.include', 'login.xhtml');
      }
    }
  );
});

/** Abre una vista protegida asumiendo que ya hay sesion iniciada. */
Cypress.Commands.add('abrirVista', (archivo) => {
  cy.visit(`/faces/views/${archivo}`);
  cy.location('pathname', { timeout: 30000 }).should('include', archivo);
});

// --- Mensajes de la aplicacion ----------------------------------------------

/**
 * Texto acumulado de los avisos <p:growl id="mensajes"> y <p:messages id="msg">.
 * Devuelve string vacio si no hay ninguno visible.
 */
Cypress.Commands.add('textoMensajes', () => {
  return cy.get('body').then(($body) => {
    const partes = [];
    $body.find('.ui-growl-item, .ui-messages-info, .ui-messages-warn, .ui-messages-error')
      .each((_, el) => partes.push(el.innerText.trim()));
    return partes.join(' | ');
  });
});
