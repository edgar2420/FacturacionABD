/**
 * Pruebas de las reglas de negocio portadas de PedidosBean.java.
 * Usa el runner incorporado de Node (node --test), sin dependencias.
 *
 *   npm test
 */
const test = require('node:test');
const assert = require('node:assert');
const reglas = require('../src/reglas');

/** Fecha relativa a hoy en formato dd/MM/yyyy. */
function fecha(diasDesdeHoy) {
  const d = new Date();
  d.setDate(d.getDate() + diasDesdeHoy);
  return (
    String(d.getDate()).padStart(2, '0') +
    '/' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '/' +
    d.getFullYear()
  );
}

test('fecha de entrega: no puede ser anterior a hoy', () => {
  assert.equal(reglas.validarFechaEntrega(fecha(0)).ok, true, 'hoy debe valer');
  assert.equal(reglas.validarFechaEntrega(fecha(1)).ok, true, 'manana debe valer');
  assert.equal(reglas.validarFechaEntrega(fecha(-1)).ok, false, 'ayer debe rechazarse');
});

test('fecha de entrega: formato estricto dd/MM/yyyy', () => {
  // Equivalente a SimpleDateFormat.setLenient(false) del bean original.
  assert.equal(reglas.validarFechaEntrega('31/02/2030').ok, false, '31 de febrero no existe');
  assert.equal(reglas.validarFechaEntrega('2030-01-01').ok, false, 'formato ISO no se acepta');
  assert.equal(reglas.validarFechaEntrega('1/1/2030').ok, false, 'faltan los ceros');
});

test('cantidad: no puede sobrepasar el saldo del lote', () => {
  assert.equal(reglas.validarCantidad(5, '10', 'X').ok, true);
  assert.equal(reglas.validarCantidad(10, '10', 'X').ok, true, 'el limite exacto se permite');
  assert.equal(reglas.validarCantidad(11, '10', 'X').ok, false);
  assert.equal(reglas.validarCantidad(0, '10', 'X').ok, false, 'cero no es cantidad valida');
});

test('forma de pago: traduccion del combo (PedidosBean.pagarPedido)', () => {
  assert.equal(reglas.formaPagoDesde('Si'), 'Contado');
  assert.equal(reglas.formaPagoDesde('En'), 'CEntrega');
  assert.equal(reglas.formaPagoDesde('No'), 'CxC');
});

test('bancos: solo la transferencia los pide (onDocPagoChanged)', () => {
  assert.deepEqual(reglas.bancosPara('TRA', 'BS'), ['BCP-MN', 'BISA-MN', 'BMSC-MN', 'BUSA-MN']);
  assert.deepEqual(reglas.bancosPara('TRA', 'US'), ['BCP-ME']);
  assert.deepEqual(reglas.bancosPara('EFE', 'BS'), [], 'efectivo no pide banco');
  assert.equal(reglas.requiereBanco('TRA'), true);
  assert.equal(reglas.requiereBanco('QR'), false);
});

test('total del pedido: suma de netoBs (getTotalPrecio)', () => {
  assert.equal(reglas.totalPedido([{ netoBs: 10.5 }, { netoBs: 4.5 }]), 15);
  assert.equal(reglas.totalPedido([]), 0);
  assert.equal(reglas.totalPedido(null), 0);
});
