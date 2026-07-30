/**
 * Reglas de negocio portadas de PedidosBean.java.
 *
 * Estan tambien en el servidor (server/src/reglas.js). Aqui sirven para avisar
 * al usuario antes de mandar la peticion; la validacion que manda es la del
 * servidor.
 */
import type { LineaPedido, Pagado, TipoDocPago } from './tipos';

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

/** La cantidad no puede superar el saldo del lote (PedidosBean.crearPedido). */
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
