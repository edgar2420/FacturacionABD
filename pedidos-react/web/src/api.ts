/** Cliente HTTP de la API de Pedidos. */
import type { LineaPedido, Pedido, Persona, Producto, Usuario } from './tipos';

/** Error con el mensaje que devolvio el servidor, listo para mostrar. */
export class ErrorApi extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

async function pedir<T>(url: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opciones.headers ?? {}) },
    ...opciones
  });

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      if (cuerpo?.error) mensaje = cuerpo.error;
    } catch {
      /* la respuesta no era JSON */
    }
    throw new ErrorApi(mensaje, respuesta.status);
  }

  if (respuesta.status === 204) return undefined as T;
  return respuesta.json() as Promise<T>;
}

const qs = (params: Record<string, string>) => new URLSearchParams(params).toString();

/** Respuesta paginada con total conocido (consultas SQL). */
export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Respuesta paginada sin total (viene de un REF CURSOR, no se puede contar). */
export interface PaginaCursor<T> {
  items: T[];
  pagina: number;
  porPagina: number;
  hayMas: boolean;
}

// --- Sesion -----------------------------------------------------------------

export const iniciarSesion = (usuario: string, password: string) =>
  pedir<Usuario>('/api/login', { method: 'POST', body: JSON.stringify({ usuario, password }) });

export const sesionActual = () => pedir<Usuario>('/api/sesion');

export const cerrarSesion = () => pedir<{ ok: boolean }>('/api/logout', { method: 'POST' });

// --- Catalogos --------------------------------------------------------------

export const buscarClientes = (valor: string, tipo: string, pagina = 1) =>
  pedir<Pagina<Persona>>(`/api/clientes?${qs({ valor, tipo, pagina: String(pagina) })}`);

export const buscarVendedores = (valor: string, tipo: string, pagina = 1) =>
  pedir<Pagina<Persona>>(`/api/vendedores?${qs({ valor, tipo, pagina: String(pagina) })}`);

export const buscarProductos = (
  valor: string,
  tipo: string,
  cliente: string,
  fechaEntrega: string,
  pagina = 1
) =>
  pedir<PaginaCursor<Producto>>(
    `/api/productos?${qs({ valor, tipo, cliente, fechaEntrega, pagina: String(pagina) })}`
  );

// --- Pedidos ----------------------------------------------------------------

interface RespuestaPedido {
  nroPedido: string;
  mensaje: string;
  detalle: LineaPedido[];
}

export const crearPedido = (datos: {
  cliente: string;
  nombreCliente: string;
  vendedor: string;
  fechaEntrega: string;
  producto: Producto;
  cantidad: number;
}) => pedir<RespuestaPedido>('/api/pedidos', { method: 'POST', body: JSON.stringify(datos) });

export const adicionarItem = (
  nroPedido: string,
  datos: { cliente: string; producto: Producto; cantidad: number }
) =>
  pedir<{ nroLinea: string; mensaje: string; detalle: LineaPedido[] }>(
    `/api/pedidos/${nroPedido}/items`,
    { method: 'POST', body: JSON.stringify(datos) }
  );

export const eliminarItem = (nroPedido: string, item: string) =>
  pedir<{ mensaje: string; detalle: LineaPedido[] }>(
    `/api/pedidos/${nroPedido}/items/${encodeURIComponent(item)}`,
    { method: 'DELETE' }
  );

export const terminarPedido = (nroPedido: string) =>
  pedir<{ mensaje: string; pedido: Pedido; detalle: LineaPedido[] }>(
    `/api/pedidos/${nroPedido}/terminar`,
    { method: 'POST' }
  );

export const pagarPedido = (
  nroPedido: string,
  datos: {
    pagado: string;
    tipoDocPago?: string;
    banco?: string;
    razonSocial?: string;
    nit?: string;
  }
) =>
  pedir<{ mensaje: string; pedido: Pedido; detalle: LineaPedido[] }>(
    `/api/pedidos/${nroPedido}/pagar`,
    { method: 'POST', body: JSON.stringify(datos) }
  );
