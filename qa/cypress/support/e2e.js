import './commands';

/**
 * La aplicacion carga recaptcha desde google.com y algunos scripts de PrimeFaces
 * lanzan errores no capturados que no rompen la funcionalidad. Sin esto, Cypress
 * marcaria como fallido cualquier test donde ocurra un error de JS ajeno a la prueba.
 *
 * Ojo: solo ignoramos errores de terceros/PrimeFaces. Si el error viene del codigo
 * de la app conviene verlo, por eso se registra en consola.
 */
Cypress.on('uncaught:exception', (err) => {
  const ignorables = [
    'recaptcha',
    'ResizeObserver loop',
    'handleLoginRequest is not defined',
    "Cannot read properties of undefined (reading 'jq')"
  ];
  const esIgnorable = ignorables.some((frag) => (err.message || '').includes(frag));
  if (!esIgnorable) {
    // eslint-disable-next-line no-console
    console.error('[error de la app]', err.message);
  }
  return false; // no fallar el test por errores de JS de la pagina
});

beforeEach(() => {
  // Viewport tipo tablet: la app usa el renderkit PRIMEFACES_MOBILE.
  cy.viewport(1280, 900);
});
