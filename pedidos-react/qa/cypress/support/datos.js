/**
 * Datos de prueba.
 *
 * Los formatos son los que devuelve Oracle de verdad: la fecha de vencimiento
 * viene como texto "dd/MM/yy" y el saldo como numero. Los productos estan
 * copiados del almacen AL-VEN-ABD-FAB para que los casos de lotes multiples
 * sean realistas.
 */

export const USUARIO = {
  login: 'abd',
  nombre: 'abd',
  rol: 'DEV',
  almacen: 'AL-VEN-ABD-FAB',
  imprimeFactura: false,
  modoDesarrollo: true
};

export const CLIENTE = {
  codigo: 'I00060',
  nombre: 'IMP.AMP.FAVIMA (MAYO-09)',
  razonSocial: 'IMPORTADORA FAVIMA S.R.L.',
  ruc: '1023456789',
  ciudad: 'LA PAZ',
  email: 'ventas@favima.bo',
  direccion: 'AV. ARCE 1234',
  telefono: '2771234'
};

export const VENDEDOR = {
  codigo: 'V001',
  nombre: 'ROJAS APAZA EDGAR',
  razonSocial: '',
  ruc: '',
  ciudad: 'LA PAZ',
  email: null,
  direccion: null,
  telefono: '70011223',
  codigoVendedor: 'V001'
};

/**
 * Producto con UN solo lote. Sirve para comprobar que no se rompe el caso
 * simple, que es la mayoria.
 */
export const PRODUCTO_UN_LOTE = {
  almacen: 'AL-VEN-ABD-FAB',
  producto: 'PT740',
  nombre: 'CEFTRIAXONA 1G (CEFTRIDELT 1G.) POLVO INY.',
  unidad: 'PZA',
  precio: 35.5,
  saldoTotal: 40,
  vencimientoProximo: '30/04/26',
  cantidadLotes: 1,
  lotes: [{ lote: '233052027', fechaVencimiento: '30/04/26', saldo: 40, precio: 35.5 }]
};

/**
 * Producto con TRES lotes. Es el caso que motivo todo el cambio: el saldo
 * total (325) no esta en ningun lote suelto.
 *
 * Orden de despacho esperado:
 *   1. F244  30/09/26  saldo   5   (misma fecha que F245, pero menos saldo)
 *   2. F245  30/09/26  saldo 120
 *   3. F250  31/12/26  saldo 200
 */
export const PRODUCTO_TRES_LOTES = {
  almacen: 'AL-VEN-ABD-FAB',
  producto: 'PT982',
  nombre: 'CALCUSAN BEBE POMADA X-50 G',
  unidad: 'PZA',
  precio: 50,
  saldoTotal: 325,
  vencimientoProximo: '30/09/26',
  cantidadLotes: 3,
  lotes: [
    { lote: 'F244', fechaVencimiento: '30/09/26', saldo: 5, precio: 50 },
    { lote: 'F245', fechaVencimiento: '30/09/26', saldo: 120, precio: 50 },
    { lote: 'F250', fechaVencimiento: '31/12/26', saldo: 200, precio: 50 }
  ]
};

/** Linea del detalle del pedido, tal como la devuelve F_OBTENER_DET_PEDIDO. */
export function linea(item, producto, lote, cantidad, fechaVencimiento) {
  const neto = producto.precio * cantidad;
  return {
    item,
    fecha: '03/08/2026',
    estado: 'M',
    codigoItem: producto.producto,
    cantidad,
    unidad: producto.unidad,
    precioBs: producto.precio,
    importeBs: neto,
    descItemBs: 0,
    netoBs: neto,
    porcDescuento: 0,
    login: 'abd',
    loginMod: null,
    fechaAct: '03/08/2026',
    fechaMod: null,
    lote,
    fechaVencimiento,
    descripcion: producto.nombre
  };
}

export const PEDIDO = {
  almacen: 'AL-VEN-ABD-FAB',
  numero: '900123',
  cliente: CLIENTE.codigo,
  nombre: CLIENTE.nombre,
  fecha: '03/08/2026',
  estado: 'T',
  fechaEntrega: '10/08/2026',
  netoBs: 0,
  netoMe: 0,
  codVendedor: VENDEDOR.codigo,
  formaPago: '',
  pagado: '',
  tipoPago: '',
  analitico: '',
  razonSocial: CLIENTE.razonSocial,
  nit: CLIENTE.ruc,
  autorizacionDgi: null,
  numeroDgi: null,
  tipoFac: null,
  numeroFac: null,
  ordenFac: null
};

/** Fecha de entrega valida (manana), en el formato del <input type="date">. */
export function entregaIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}
