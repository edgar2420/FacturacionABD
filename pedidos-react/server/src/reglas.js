/**
 * Reglas de negocio portadas de PedidosBean.java.
 *
 * Se validan en el servidor aunque el navegador ya las haya comprobado:
 * la validacion del cliente es comodidad, la del servidor es la que manda.
 */

/** Convierte "dd/MM/yyyy" a Date. Devuelve null si el formato no es valido. */
function parsearFecha(texto) {
  if (typeof texto !== 'string') return null;
  const m = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const anio = Number(m[3]);

  const fecha = new Date(anio, mes - 1, dia);
  // Equivalente a SimpleDateFormat.setLenient(false): rechaza 31/02/2026.
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return null;
  }
  return fecha;
}

/**
 * PedidosBean.crearPedido: la fecha de entrega no puede ser anterior a hoy.
 * La comparacion se hace contra hoy normalizado a las 00:00.
 */
function validarFechaEntrega(texto) {
  const fecha = parsearFecha(texto);
  if (!fecha) {
    return { ok: false, mensaje: 'Formato de fecha invalido. Use dd/mm/aaaa.' };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fecha < hoy) {
    return { ok: false, mensaje: 'La fecha de entrega no puede ser anterior a la fecha actual.' };
  }
  return { ok: true, fecha };
}

/**
 * PedidosBean.crearPedido: la cantidad reservada no puede superar el saldo
 * disponible del lote.
 */
function validarCantidad(cantidad, saldo, nombreProducto) {
  const cant = Number(cantidad);
  const disp = Number(saldo);

  if (!Number.isFinite(cant) || cant <= 0) {
    return { ok: false, mensaje: 'Introduzca una cantidad mayor a cero.' };
  }
  if (Number.isFinite(disp) && cant > disp) {
    return {
      ok: false,
      mensaje: `Revise la cantidad de su reserva, no puede sobrepasar el saldo actual. Producto: ${nombreProducto} Saldo: ${saldo}`
    };
  }
  return { ok: true };
}

/**
 * PedidosBean.pagarPedido: traduce la respuesta del combo a la forma de pago
 * que espera el procedimiento de Oracle.
 *   Si -> Contado | En -> CEntrega (contra entrega) | No -> CxC (a credito)
 */
function formaPagoDesde(pagado) {
  if (String(pagado).toLowerCase() === 'si') return 'Contado';
  if (String(pagado).toLowerCase() === 'en') return 'CEntrega';
  return 'CxC';
}

/**
 * PedidosBean.onDocPagoChanged: solo la transferencia (TRA) exige banco,
 * y la lista depende de la moneda. Hoy el sistema opera en bolivianos.
 */
const BANCOS_POR_MONEDA = {
  BS: ['BCP-MN', 'BISA-MN', 'BMSC-MN', 'BUSA-MN'],
  US: ['BCP-ME']
};

function bancosPara(tipoDocPago, moneda = 'BS') {
  if (String(tipoDocPago).toUpperCase() !== 'TRA') return [];
  return BANCOS_POR_MONEDA[moneda] || [];
}

function requiereBanco(tipoDocPago) {
  return String(tipoDocPago).toUpperCase() === 'TRA';
}

/** Total del pedido: suma de netoBs, igual que PedidosBean.getTotalPrecio(). */
function totalPedido(detalle) {
  if (!Array.isArray(detalle) || detalle.length === 0) return 0;
  return detalle.reduce((suma, linea) => suma + Number(linea.netoBs || 0), 0);
}

const TIPOS_BUSQUEDA_CLIENTE = ['N', 'R', 'C', 'O'];
const TIPOS_BUSQUEDA_VENDEDOR = ['N', 'O'];
const TIPOS_BUSQUEDA_PRODUCTO = ['N', 'O'];
const TIPOS_DOC_PAGO = ['EFE', 'QR', 'CHQ', 'TRA'];

module.exports = {
  parsearFecha,
  validarFechaEntrega,
  validarCantidad,
  formaPagoDesde,
  bancosPara,
  requiereBanco,
  totalPedido,
  TIPOS_BUSQUEDA_CLIENTE,
  TIPOS_BUSQUEDA_VENDEDOR,
  TIPOS_BUSQUEDA_PRODUCTO,
  TIPOS_DOC_PAGO
};
