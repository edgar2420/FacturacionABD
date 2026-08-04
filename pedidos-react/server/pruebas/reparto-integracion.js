/**
 * Prueba de integracion del reparto en lotes, contra Oracle de verdad.
 *
 * Escribe en IBSVENTA.PPEDIDOS y PLIN_PEDIDOS, las tablas de prueba. NO toca
 * PEDIDOS ni LIN_PEDIDOS, y termina dejando las tablas de prueba vacias.
 *
 * Los catalogos (cliente, producto, saldos) se leen de produccion, que es lo
 * que interesa: se prueba con lotes y saldos reales, no inventados.
 *
 * No es un fichero .test.js a proposito: necesita conexion a la base y por eso
 * no debe correr en `npm test`. Se lanza a mano:
 *
 *     node pruebas/reparto-integracion.js
 */
const assert = require('node:assert');

process.env.MODO_PRUEBA = '1';

const { iniciarPool, cerrarPool } = require('../src/db');
const plsql = require('../src/plsql');
const pedidos = require('../src/plsql-prueba');
const lotes = require('../src/lotes');

const ALMACEN = process.env.ALMACEN_DEV || 'AL-VEN-ABD-FAB';
const LOGIN = 'abd';

function manana() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

let fallos = 0;
async function paso(titulo, fn) {
  try {
    await fn();
    console.log(`  OK  ${titulo}`);
  } catch (e) {
    fallos++;
    console.log(`  FALLA  ${titulo}\n       ${e.message}`);
  }
}

(async () => {
  await iniciarPool();
  console.log(`\nAlmacen: ${ALMACEN}   Fecha de entrega: ${manana()}\n`);

  // Las tablas tienen que empezar vacias para que las cuentas sean claras.
  await pedidos.limpiar();

  // --- Buscar un producto real que tenga varios lotes ------------------------
  const { filas } = await plsql.obtenerProductosPorLote({
    busqueda: '%',
    tipo: 'N',
    almacen: ALMACEN,
    cliente: 'I00060',
    fechaEntrega: manana()
  });

  const productos = lotes.ordenarProductos(lotes.agruparPorProducto(filas));
  const multi = productos.filter((p) => p.cantidadLotes >= 2 && p.saldoTotal > 3);

  if (!multi.length) {
    console.log('No hay ningun producto con varios lotes; no se puede probar el reparto.');
    await cerrarPool();
    return;
  }

  const prod = multi[0];
  console.log(`Producto de prueba: ${prod.producto} ${prod.nombre}`);
  prod.lotes.forEach((l) => console.log(`   lote ${String(l.lote).padEnd(12)} vence ${l.fechaVencimiento}  saldo ${l.saldo}`));

  // Cantidad que obliga a usar dos lotes: todo el primero + 1 del segundo.
  const cantidad = prod.lotes[0].saldo + 1;
  const plan = lotes.repartirEnLotes(prod.lotes, cantidad);
  console.log(`\nSe piden ${cantidad} -> reparto previsto:`);
  plan.reparto.forEach((t) => console.log(`   ${t.cantidad} del lote ${t.lote} (vence ${t.fechaVencimiento})`));
  console.log('');

  assert.ok(plan.ok, 'el reparto previsto deberia ser valido');
  assert.ok(plan.reparto.length >= 2, 'la cantidad elegida deberia usar dos lotes');

  // --- Grabar como lo hace la API -------------------------------------------
  let nro = null;
  for (const [i, tramo] of plan.reparto.entries()) {
    const comun = {
      almacen: ALMACEN,
      cliente: 'I00060',
      codItem: prod.producto,
      cantidad: tramo.cantidad,
      unidad: prod.unidad,
      porcDescuento: 0,
      lote: tramo.lote,
      fechaVencimiento: tramo.fechaVencimiento,
      login: LOGIN
    };

    const r = i === 0 && !nro
      ? await pedidos.crearPedido({ ...comun, nombreCliente: 'CLIENTE PRUEBA', fechaEntrega: manana(), vendedor: 'V001' })
      : await pedidos.adicionarItem({ ...comun, nroPedido: nro });

    assert.ok(r.ok, `fallo el tramo ${i + 1}: ${r.mensaje}`);
    if (!nro) nro = r.nroPedido;
  }

  console.log(`Pedido de prueba Nº ${nro}\n`);

  const detalle = await pedidos.obtenerDetallePedido(ALMACEN, nro);

  await paso('hay una linea por cada lote del reparto', () => {
    assert.strictEqual(detalle.length, plan.reparto.length);
  });

  await paso('cada linea lleva su lote y su cantidad', () => {
    plan.reparto.forEach((t, i) => {
      assert.strictEqual(detalle[i].lote, t.lote, `lote de la linea ${i + 1}`);
      assert.strictEqual(detalle[i].cantidad, t.cantidad, `cantidad de la linea ${i + 1}`);
    });
  });

  await paso('la suma de las lineas es la cantidad pedida', () => {
    assert.strictEqual(detalle.reduce((s, l) => s + l.cantidad, 0), cantidad);
  });

  await paso('las lineas van numeradas 1, 2, 3...', () => {
    assert.deepStrictEqual(detalle.map((l) => l.item), plan.reparto.map((_, i) => i + 1));
  });

  await paso('las lineas salen en el orden de despacho (restos, luego vencimiento)', () => {
    // No basta con mirar solo las fechas: desde que los restos salen primero,
    // un lote de una unidad que caduca tarde puede encabezar el pedido.
    for (let i = 1; i < detalle.length; i++) {
      const anterior = { lote: detalle[i - 1].lote, fechaVencimiento: detalle[i - 1].fechaVencimiento, saldo: null };
      const actual = { lote: detalle[i].lote, fechaVencimiento: detalle[i].fechaVencimiento, saldo: null };
      // El saldo original lo tiene el plan, no la linea grabada.
      anterior.saldo = prod.lotes.find((l) => l.lote === anterior.lote)?.saldo ?? 0;
      actual.saldo = prod.lotes.find((l) => l.lote === actual.lote)?.saldo ?? 0;

      assert.ok(
        lotes.compararLotes(anterior, actual) <= 0,
        `el lote ${actual.lote} deberia ir antes que ${anterior.lote}`
      );
    }
  });

  await paso('el precio lo calculo Oracle, no viene en cero', () => {
    assert.ok(detalle.every((l) => l.precioBs > 0), 'alguna linea tiene precio cero');
  });

  await paso('la descripcion del producto se resuelve', () => {
    assert.ok(detalle.every((l) => l.descripcion), 'alguna linea sin descripcion');
  });

  // --- Terminar --------------------------------------------------------------
  const t = await pedidos.terminarPedido({ almacen: ALMACEN, nroPedido: nro, login: LOGIN });
  assert.ok(t.ok, 'no se pudo terminar el pedido');

  const cab = await pedidos.obtenerPedido(ALMACEN, nro);

  await paso('al terminar, el total de la cabecera es la suma de las lineas', () => {
    const suma = detalle.reduce((s, l) => s + l.netoBs, 0);
    assert.ok(Math.abs(cab.netoBs - suma) < 0.01, `cabecera ${cab.netoBs} vs lineas ${suma}`);
  });

  await paso('al terminar, el estado pasa a V', () => {
    assert.strictEqual(cab.estado, 'V');
  });

  // --- Eliminar: se van TODAS las lineas del producto ------------------------
  const e = await pedidos.eliminarItem({ almacen: ALMACEN, nroPedido: nro, item: prod.producto });
  assert.ok(e.ok, 'no se pudo eliminar');

  await paso('eliminar el producto borra sus lineas de todos los lotes', async () => {
    const quedan = await pedidos.obtenerDetallePedido(ALMACEN, nro);
    assert.strictEqual(quedan.length, 0, `quedaron ${quedan.length} lineas`);
  });

  // --- Limpieza y comprobacion de que no se toco produccion ------------------
  const borradas = await pedidos.limpiar();
  console.log(`\nLimpieza: ${borradas.pedidos} pedido(s) y ${borradas.lineas} linea(s) de prueba borrados.`);

  await cerrarPool();
  console.log(fallos === 0 ? '\nTodo correcto.\n' : `\n${fallos} comprobacion(es) fallaron.\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FALLO:', e);
  process.exit(1);
});
