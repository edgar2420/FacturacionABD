/** Tipos del dominio, equivalentes a los DTO de src/java/objetos/. */

export interface Usuario {
  login: string;
  nombre: string;
  rol: string;
  /** UNI_NEG del usuario: es el almacen con el que opera. */
  almacen: string;
  imprimeFactura: boolean;
}

/** ABD.PERSONAS. Sirve tanto para clientes como para vendedores. */
export interface Persona {
  codigo: string;
  nombre: string;
  razonSocial: string;
  ruc: string;
  ciudad: string;
  email: string | null;
  direccion: string | null;
  telefono: string | null;
  codigoVendedor?: string;
}

/** Fila de F_OBTENER_PRODUCTOS (objetos/DetalleProductos.java). */
export interface Producto {
  almacen: string;
  producto: string;
  nombre: string;
  unidad: string;
  lote: string;
  fechaVencimiento: string;
  precio: number;
  saldo: string;
}

/** Linea del pedido (objetos/DetallePedido.java). */
export interface LineaPedido {
  item: number;
  fecha: string;
  estado: string;
  codigoItem: string;
  cantidad: number;
  unidad: string;
  precioBs: number;
  importeBs: number;
  descItemBs: number;
  netoBs: number;
  porcDescuento: number;
  lote: string;
  fechaVencimiento: string;
  descripcion: string;
}

/** Cabecera del pedido (objetos/Pedido.java). */
export interface Pedido {
  almacen: string;
  numero: string;
  cliente: string;
  nombre: string;
  fecha: string;
  estado: string;
  fechaEntrega: string;
  netoBs: number;
  netoMe: number;
  codVendedor: string;
  formaPago: string;
  pagado: string;
  tipoPago: string;
  /** Banco de la transferencia. */
  analitico: string;
  razonSocial: string;
  nit: string;
  /** Datos de la factura emitida, si el pedido se pago al contado. */
  autorizacionDgi: string | null;
  numeroDgi: string | null;
  tipoFac: string | null;
  numeroFac: string | null;
  ordenFac: string | null;
}

export type TipoBusquedaCliente = 'N' | 'R' | 'C' | 'O';
export type TipoBusquedaSimple = 'N' | 'O';
export type TipoDocPago = 'EFE' | 'QR' | 'CHQ' | 'TRA';
/** Si = contado, No = a credito (CxC), En = contra entrega. */
export type Pagado = 'Si' | 'No' | 'En';

export interface Aviso {
  id: number;
  tono: 'exito' | 'error' | 'atencion' | 'info';
  titulo: string;
  detalle?: string;
}
