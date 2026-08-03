import './comandos';

/**
 * La aplicacion arranca SIEMPRE en tema claro salvo que la persona haya
 * elegido oscuro. Se limpia localStorage antes de cada prueba para que una no
 * herede el tema de otra.
 */
beforeEach(() => {
  cy.clearLocalStorage();
});

/**
 * React en desarrollo puede lanzar avisos que no son fallos de la aplicacion.
 * Solo se ignoran los de ResizeObserver, que son ruido conocido del navegador;
 * cualquier otro error de JS tiene que hacer fallar la prueba, que para eso
 * estamos buscando bugs.
 */
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver loop')) return false;
  return true;
});
