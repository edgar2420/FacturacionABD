/// <reference types="cypress" />

/**
 * INVENTARIO FUNCIONAL
 *
 * Este spec no juzga si la aplicacion esta bien o mal: recorre cada pantalla
 * y anota que hay realmente ahi (campos, botones, tablas, combos). Al terminar
 * escribe qa/reportes/inventario.md con el resultado.
 *
 * Es de solo lectura: abre las vistas y mira el DOM, no envia formularios.
 *
 *   npm run qa:inventario
 */
describe('02 - Inventario de pantallas', () => {
  const hallazgos = [];

  before(function () {
    if (!Cypress.env('usuario')) {
      // Sin credenciales no se puede pasar del login.
      this.skip();
    }
  });

  beforeEach(() => {
    cy.login();
  });

  it('recorre cada pantalla y registra sus controles', () => {
    cy.fixture('pantallas.json').then((pantallas) => {
      cy.wrap(pantallas).each((pantalla) => {
        cy.visit(`/faces/views/${pantalla.archivo}`, { failOnStatusCode: false });

        cy.location('pathname').then((ruta) => {
          const accesible = !ruta.includes('login.xhtml');

          const registro = {
            modulo: pantalla.modulo,
            nombre: pantalla.nombre,
            archivo: pantalla.archivo,
            descripcion: pantalla.descripcion,
            accesible,
            titulo: null,
            controles: []
          };

          if (!accesible) {
            // El usuario de pruebas no tiene permiso o la vista no existe.
            registro.titulo = 'NO ACCESIBLE (redirige a login)';
            hallazgos.push(registro);
            return;
          }

          cy.document().then((doc) => {
            registro.titulo = (doc.title || '').trim();

            pantalla.controles.forEach((control) => {
              const el = doc.querySelector(`[id="${CSS.escape(control.id)}"]`);
              // PrimeFaces a veces envuelve el input: buscamos tambien el hijo.
              const presente = !!el;
              const visible = presente && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

              registro.controles.push({
                ...control,
                presente,
                visible
              });
            });
          });

          hallazgos.push(registro);
        });
      });
    });
  });

  after(() => {
    if (hallazgos.length === 0) return;

    const lineas = [];
    lineas.push('# Inventario funcional - ABDFacturacion');
    lineas.push('');
    lineas.push(`Generado: ${new Date().toISOString()}`);
    lineas.push(`Entorno: ${Cypress.config('baseUrl')}`);
    lineas.push(`Usuario de prueba: ${Cypress.env('usuario')}`);
    lineas.push('');
    lineas.push('> Este archivo lo genera automaticamente `npm run qa:inventario`.');
    lineas.push('> Refleja lo que el usuario de prueba puede ver realmente en el entorno indicado.');
    lineas.push('');

    lineas.push('## Resumen');
    lineas.push('');
    lineas.push('| Modulo | Pantalla | Archivo | Accesible | Controles hallados |');
    lineas.push('|---|---|---|---|---|');
    hallazgos.forEach((h) => {
      const hallados = h.controles.filter((c) => c.presente).length;
      lineas.push(
        `| ${h.modulo} | ${h.nombre} | \`${h.archivo}\` | ${h.accesible ? 'si' : 'NO'} | ${hallados}/${h.controles.length} |`
      );
    });
    lineas.push('');

    hallazgos.forEach((h) => {
      lineas.push(`## ${h.nombre} (${h.modulo})`);
      lineas.push('');
      lineas.push(`- Archivo: \`web/views/${h.archivo}\``);
      lineas.push(`- Titulo de la pagina: ${h.titulo || '(sin titulo)'}`);
      lineas.push(`- Que hace: ${h.descripcion}`);
      lineas.push('');

      if (!h.accesible) {
        lineas.push('> El usuario de prueba **no pudo abrir esta pantalla**.');
        lineas.push('');
        return;
      }

      lineas.push('| Control | Tipo | Rol | Presente | Visible | Descripcion |');
      lineas.push('|---|---|---|---|---|---|');
      h.controles.forEach((c) => {
        lineas.push(
          `| \`${c.id}\` | ${c.tipo} | ${c.rol} | ${c.presente ? 'si' : 'NO'} | ${c.visible ? 'si' : 'no'} | ${c.descripcion} |`
        );
      });
      lineas.push('');

      const faltantes = h.controles.filter((c) => !c.presente);
      if (faltantes.length) {
        lineas.push(
          `> Faltan ${faltantes.length} control(es) esperados. Puede deberse a permisos del rol, ` +
            'a que se renderizan solo despues de una busqueda, o a un cambio en la vista.'
        );
        lineas.push('');
      }
    });

    const contenido = lineas.join('\n');
    cy.task('guardarReporte', { nombre: 'inventario.md', contenido }).then((destino) => {
      cy.task('log', `Inventario escrito en: ${destino}`);
    });
  });
});
