/**
 * Reglas de negocio portadas de PedidosBean.java.
 *
 * Estan tambien en el servidor (server/src/reglas.js). Aqui sirven para avisar
 * al usuario antes de mandar la peticion; la validacion que manda es la del
 * servidor.
 */
import type { LineaPedido, Lote, Pagado, TipoDocPago, TramoLote } from './tipos';

/** "dd/MM/yyyy" -> Date. null si el formato o la fecha no son validos. */
export function parsearFecha(texto: string): Date | null {
  const m = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const anio = Number(m[3]);
  const fecha = new Date(anio, mes - 1, dia);

  // Equivalente a SimpleDateFormat.setLenient(false).
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return null;
  }
  return fecha;
}

/**
 * El <input type="date"> trabaja en ISO (aaaa-mm-dd) y Oracle espera
 * dd/MM/yyyy. Estas dos funciones traducen entre ambos.
 */
export function isoADdmmaaaa(iso: string): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}/${m}/${a}` : '';
}

export function ddmmaaaaAIso(texto: string): string {
  if (!texto) return '';
  const [d, m, a] = texto.split('/');
  return d && m && a ? `${a}-${m}-${d}` : '';
}

/** Hoy en ISO, para usarlo como minimo del calendario. */
export function hoyIso(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(
    h.getDate()
  ).padStart(2, '0')}`;
}

export function formatearFecha(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

/** La fecha de entrega no puede ser anterior a hoy (PedidosBean.crearPedido). */
export function validarFechaEntrega(texto: string): { ok: boolean; mensaje?: string } {
  const fecha = parsearFecha(texto);
  if (!fecha) return { ok: false, mensaje: 'Formato de fecha invalido. Use dd/mm/aaaa.' };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fecha < hoy) {
    return { ok: false, mensaje: 'La fecha de entrega no puede ser anterior a la fecha actual.' };
  }
  return { ok: true };
}

/**
 * La cantidad no puede superar el saldo disponible (PedidosBean.crearPedido).
 * Desde que los lotes se muestran sumados, el saldo que se compara es el
 * TOTAL del producto, no el de un lote suelto.
 */
export function validarCantidad(
  cantidad: number,
  saldo: string | number,
  nombreProducto: string
): { ok: boolean; mensaje?: string } {
  const disponible = Number(saldo);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { ok: false, mensaje: 'Introduzca una cantidad mayor a cero.' };
  }
  if (Number.isFinite(disponible) && cantidad > disponible) {
    return {
      ok: false,
      mensaje: `No puede sobrepasar el saldo actual. ${nombreProducto} · saldo ${saldo}`
    };
  }
  return { ok: true };
}

/**
 * Vista previa del reparto entre lotes.
 *
 * Es un espejo de server/src/lotes.js: sirve para que el vendedor vea de que
 * lotes va a salir la mercaderia ANTES de confirmar. El reparto que vale es el
 * que calcula el servidor con los saldos del momento, no este.
 *
 * Criterio (el que pidio el usuario): sale primero el lote que vence antes y,
 * a igual vencimiento, el de menor saldo.
 */
export function parsearVencimiento(valor: string | null | undefined): Date | null {
  if (typeof valor !== 'string') return null;

  const m = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  // El cursor manda el año en dos cifras ("30/09/26"): son vencimientos de
  // medicamentos, siempre de este siglo.
  const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);

  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return null;
  }
  return fecha;
}

/**
 * Hasta cuantas unidades se considera "resto". Tiene que valer lo mismo que
 * SALDO_RESTO en server/src/lotes.js: si se cambia alli, se cambia aqui.
 */
export const SALDO_RESTO = 3;

export function esResto(lote: Lote): boolean {
  return lote.saldo > 0 && lote.saldo <= SALDO_RESTO;
}

/**
 * Orden de despacho: primero los restos para liquidarlos, despues por
 * vencimiento (antes el que caduca antes) y, a igual fecha, el de menor saldo.
 */
export function ordenDespacho(a: Lote, b: Lote): number {
  const ra = esResto(a);
  const rb = esResto(b);
  if (ra !== rb) return ra ? -1 : 1;

  const fa = parsearVencimiento(a.fechaVencimiento);
  const fb = parsearVencimiento(b.fechaVencimiento);

  if (fa && fb && fa.getTime() !== fb.getTime()) return fa.getTime() - fb.getTime();
  if (fa && !fb) return -1;
  if (!fa && fb) return 1;

  if (a.saldo !== b.saldo) return a.saldo - b.saldo;
  return String(a.lote).localeCompare(String(b.lote));
}

export function repartirEnLotes(lotes: Lote[], cantidad: number): TramoLote[] {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return [];

  const disponibles = [...(lotes ?? [])].filter((l) => l.saldo > 0).sort(ordenDespacho);
  const tramos: TramoLote[] = [];
  let restante = cantidad;

  for (const l of disponibles) {
    if (restante <= 0) break;
    const toma = Math.min(restante, l.saldo);
    tramos.push({ lote: l.lote, fechaVencimiento: l.fechaVencimiento, cantidad: toma });
    restante -= toma;
  }

  return tramos;
}

/** Si -> Contado | En -> CEntrega | No -> CxC (PedidosBean.pagarPedido). */
export function formaPagoDesde(pagado: Pagado): string {
  if (pagado === 'Si') return 'Contado';
  if (pagado === 'En') return 'CEntrega';
  return 'CxC';
}

const BANCOS_POR_MONEDA: Record<string, string[]> = {
  BS: ['BCP-MN', 'BISA-MN', 'BMSC-MN', 'BUSA-MN'],
  US: ['BCP-ME']
};

/** Solo la transferencia pide banco (PedidosBean.onDocPagoChanged). */
export function bancosPara(tipo: TipoDocPago | '', moneda: 'BS' | 'US' = 'BS'): string[] {
  if (tipo !== 'TRA') return [];
  return BANCOS_POR_MONEDA[moneda] ?? [];
}

export function requiereBanco(tipo: TipoDocPago | ''): boolean {
  return tipo === 'TRA';
}

/** Total = suma de netoBs (PedidosBean.getTotalPrecio). */
export function totalPedido(detalle: LineaPedido[]): number {
  return detalle.reduce((suma, linea) => suma + (Number(linea.netoBs) || 0), 0);
}

export function bolivianos(monto: number): string {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(monto) ? monto : 0);
}

export const ETIQUETAS_DOC_PAGO: Record<TipoDocPago, string> = {
  EFE: 'Efectivo',
  QR: 'QR',
  CHQ: 'Cheque',
  TRA: 'Transferencia'
};

export const ETIQUETAS_PAGADO: Record<Pagado, string> = {
  Si: 'Sí, pagado (contado)',
  No: 'No, a crédito',
  En: 'Contra entrega'
};
