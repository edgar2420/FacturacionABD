/**
 * Simulacion de la API.
 *
 * Todas las rutas /api se responden aqui, sin tocar Oracle. Ademas de hacer la
 * suite rapida y repetible, evita crear pedidos de verdad: el backend apunta a
 * la base de PRODUCCION y un pedido creado por una prueba seria un pedido real.
 *
 * El reparto entre lotes se calcula aqui con la misma regla que el servidor,
 * para que las pruebas comprueben la regla y no un valor escrito a mano.
 */
import {
  CLIENTE,
  CLIENTE_OTRA_REGION,
  PEDIDO,
  PRODUCTO_TRES_LOTES,
  PRODUCTO_UN_LOTE,
  USUARIO,
  VENDEDOR,
  linea
} from './datos';

const PRODUCTOS = [PRODUCTO_TRES_LOTES, PRODUCTO_UN_LOTE];

/** Espejo de server/src/lotes.js: vence antes -> menor saldo. */
function parsearVenc(texto) {
  const m = String(texto).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(anio, Number(m[2]) - 1, Number(m[1]));
}

export function repartir(lotes, cantidad) {
  const orden = [...lotes]
    .filter((l) => l.saldo > 0)
    .sort((a, b) => {
      const fa = parsearVenc(a.fechaVencimiento);
      const fb = parsearVenc(b.fechaVencimiento);
      if (fa && fb && fa.getTime() !== fb.getTime()) return fa - fb;
      if (a.saldo !== b.saldo) return a.saldo - b.saldo;
      return a.lote.localeCompare(b.lote);
    });

  const tramos = [];
  let resta = cantidad;
  for (const l of orden) {
    if (resta <= 0) break;
    const toma = Math.min(resta, l.saldo);
    tramos.push({ lote: l.lote, fechaVencimiento: l.fechaVencimiento, cantidad: toma });
    resta -= toma;
  }
  return tramos;
}

/**
 * Registra las intercepciones. `opciones` permite forzar fallos concretos
 * para probar como reacciona la pantalla.
 */
export function simularApi(opciones = {}) {
  const estado = { detalle: [], nroPedido: null };

  cy.intercept('POST', '/api/login', (req) => {
    if (opciones.loginFalla) {
      return req.reply({ statusCode: 401, body: { error: 'Usuario o contrasena incorrectos' } });
    }
    req.reply({ statusCode: 200, body: USUARIO });
  }).as('login');

  cy.intercept('GET', '/api/sesion', (req) => {
    req.reply(
      opciones.sinSesion === false || estado.autenticado
        ? { statusCode: 200, body: USUARIO }
        : { statusCode: 401, body: { error: 'Sesion no iniciada' } }
    );
  }).as('sesion');

  cy.intercept('POST', '/api/logout', { statusCode: 200, body: { ok: true } }).as('logout');

  cy.intercept('GET', '/api/clientes*', (req) => {
    const valor = (new URL(req.url).searchParams.get('valor') || '').toUpperCase();
    const todos = [CLIENTE, CLIENTE_OTRA_REGION];
    const items = valor
      ? todos.filter((c) => c.nombre.toUpperCase().includes(valor))
      : todos;

    req.reply({
      statusCode: 200,
      body: { items, total: items.length, pagina: 1, porPagina: 15 }
    });
  }).as('clientes');

  cy.intercept('GET', '/api/vendedores*', {
    statusCode: 200,
    body: { items: [VENDEDOR], total: 1, pagina: 1, porPagina: 15 }
  }).as('vendedores');

  cy.intercept('GET', '/api/productos*', (req) => {
    if (opciones.productosFalla) {
      return req.reply({ statusCode: 500, body: { error: 'Error interno del servidor' } });
    }
    req.reply({
      statusCode: 200,
      body: { items: PRODUCTOS, total: PRODUCTOS.length, pagina: 1, porPagina: 15 }
    });
  }).as('productos');

  cy.intercept('POST', '/api/pedidos', (req) => {
    const { producto, cantidad } = req.body;
    const completo = PRODUCTOS.find((p) => p.producto === producto.producto);
    const tramos = repartir(completo.lotes, cantidad);

    estado.nroPedido = PEDIDO.numero;
    estado.detalle = tramos.map((t, i) =>
      linea(i + 1, completo, t.lote, t.cantidad, t.fechaVencimiento)
    );

    req.reply({
      statusCode: 201,
      body: {
        nroPedido: estado.nroPedido,
        mensaje: `Se reservaron ${cantidad} ${completo.unidad} de ${completo.nombre} en ${tramos.length} lote(s).`,
        reparto: tramos,
        detalle: estado.detalle
      }
    });
  }).as('crearPedido');

  cy.intercept('POST', '/api/pedidos/*/items', (req) => {
    const { producto, cantidad } = req.body;
    const completo = PRODUCTOS.find((p) => p.producto === producto.producto);

    if (opciones.adicionarFalla) {
      return req.reply({
        statusCode: 422,
        body: { error: 'La cantidad supera el saldo disponible.', detalle: estado.detalle }
      });
    }

    const tramos = repartir(completo.lotes, cantidad);
    const base = estado.detalle.length;
    estado.detalle = [
      ...estado.detalle,
      ...tramos.map((t, i) => linea(base + i + 1, completo, t.lote, t.cantidad, t.fechaVencimiento))
    ];

    req.reply({
      statusCode: 200,
      body: {
        mensaje: `Se reservaron ${cantidad} ${completo.unidad} de ${completo.nombre} en ${tramos.length} lote(s).`,
        reparto: tramos,
        detalle: estado.detalle
      }
    });
  }).as('adicionarItem');

  cy.intercept('DELETE', '/api/pedidos/*/items/*', (req) => {
    // El paquete de Oracle borra por codigo de item: se van TODAS las lineas
    // del producto, sean de uno o de varios lotes.
    const codigo = decodeURIComponent(req.url.split('/').pop());
    estado.detalle = estado.detalle.filter((l) => l.codigoItem !== codigo);
    req.reply({ statusCode: 200, body: { mensaje: 'Se elimino item con exito.', detalle: estado.detalle } });
  }).as('eliminarItem');

  cy.intercept('POST', '/api/pedidos/*/terminar', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        mensaje: 'Pedido terminado.',
        pedido: { ...PEDIDO, estado: 'T' },
        detalle: estado.detalle
      }
    });
  }).as('terminarPedido');

  cy.intercept('POST', '/api/pedidos/*/pagar', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        mensaje: 'Pedido pagado.',
        pedido: { ...PEDIDO, pagado: req.body.pagado, tipoPago: req.body.tipoDocPago || '' },
        detalle: estado.detalle
      }
    });
  }).as('pagarPedido');

  return estado;
}
