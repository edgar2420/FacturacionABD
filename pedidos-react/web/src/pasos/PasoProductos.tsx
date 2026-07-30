/**
 * Paso 3: buscar productos, cargarlos al pedido y revisar el detalle.
 *
 * Equivale a PedidosBean.buscarProducto() + crearPedido() +
 * adicionarItemPedido() + eliminarItemPedido().
 *
 * Detalle importante heredado del sistema actual: la PRIMERA linea se manda
 * con F_CREAR_PEDIDO (crea la cabecera y la linea a la vez) y las siguientes
 * con F_CREAR_DETALLE_PEDIDO. Por eso el boton cambia de "Crear pedido" a
 * "Adicionar producto" una vez que existe el numero de pedido.
 *
 * En pantallas anchas el pedido en curso queda fijo a la derecha (.disposicion).
 */
import { useState } from 'react';
import * as api from '../api';
import { bolivianos, validarCantidad } from '../reglas';
import { Boton, Campo, Tarjeta, Vacio } from '../componentes/ui';
import { IconoBasura, IconoBuscar, IconoCheck, IconoMas } from '../componentes/iconos';
import { Paginacion } from '../componentes/Paginacion';
import type { Confirmacion } from '../componentes/Modal';
import type { PaginaCursor } from '../api';
import type { LineaPedido, Persona, Producto, TipoBusquedaSimple } from '../tipos';

export function PasoProductos({
  cliente,
  fechaEntrega,
  vendedor,
  nroPedido,
  detalle,
  alCrearPedido,
  alCambiarDetalle,
  alTerminar,
  alAvisar,
  alConfirmar
}: {
  cliente: Persona;
  fechaEntrega: string;
  vendedor: Persona;
  nroPedido: string | null;
  detalle: LineaPedido[];
  alCrearPedido: (nro: string, detalle: LineaPedido[]) => void;
  alCambiarDetalle: (detalle: LineaPedido[]) => void;
  alTerminar: () => void;
  alAvisar: (
    tono: 'exito' | 'error' | 'atencion' | 'info',
    titulo: string,
    detalle?: string
  ) => void;
  alConfirmar: (c: Confirmacion) => void;
}) {
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TipoBusquedaSimple>('N');
  const [resultados, setResultados] = useState<PaginaCursor<Producto> | null>(null);
  const [elegido, setElegido] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cant = Number(cantidad);
  const validacion = elegido ? validarCantidad(cant, elegido.saldo, elegido.nombre) : { ok: false };

  async function traer(pagina: number, esNuevaBusqueda: boolean) {
    if (!valor.trim()) {
      alAvisar(
        'atencion',
        'Falta el dato de búsqueda',
        'Escriba el nombre o el código del producto.'
      );
      return;
    }

    setBuscando(true);
    if (esNuevaBusqueda) setElegido(null);

    try {
      const r = await api.buscarProductos(valor.trim(), tipo, cliente.codigo, fechaEntrega, pagina);
      setResultados(r);
      if (r.items.length === 0 && pagina === 1) {
        alAvisar(
          'atencion',
          'Producto no encontrado',
          'Revise los datos de búsqueda e intente de nuevo.'
        );
      }
    } catch (err) {
      alAvisar('error', 'No se pudo buscar', (err as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    void traer(1, true);
  }

  async function agregar() {
    if (!elegido) return;

    const v = validarCantidad(cant, elegido.saldo, elegido.nombre);
    if (!v.ok) {
      alAvisar('atencion', 'Cantidad no válida', v.mensaje);
      return;
    }

    setGuardando(true);
    try {
      if (!nroPedido) {
        const r = await api.crearPedido({
          cliente: cliente.codigo,
          nombreCliente: cliente.nombre,
          vendedor: vendedor.codigo,
          fechaEntrega,
          producto: elegido,
          cantidad: cant
        });
        alCrearPedido(r.nroPedido, r.detalle);
        alAvisar('exito', `Pedido Nº ${r.nroPedido} creado`, r.mensaje);
      } else {
        const r = await api.adicionarItem(nroPedido, {
          cliente: cliente.codigo,
          producto: elegido,
          cantidad: cant
        });
        alCambiarDetalle(r.detalle);
        alAvisar('exito', 'Producto adicionado', `${elegido.nombre} × ${cant}`);
      }

      setElegido(null);
      setCantidad('');
    } catch (err) {
      alAvisar('error', 'No se pudo guardar', (err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  function pedirQuitar(linea: LineaPedido) {
    if (!nroPedido) return;

    alConfirmar({
      titulo: '¿Eliminar este ítem?',
      detalle: `${linea.descripcion} · ${linea.cantidad} ${linea.unidad} · Bs ${bolivianos(
        linea.netoBs
      )}`,
      textoConfirmar: 'Eliminar',
      peligroso: true,
      alConfirmar: () => void quitar(linea)
    });
  }

  async function quitar(linea: LineaPedido) {
    if (!nroPedido) return;
    try {
      const r = await api.eliminarItem(nroPedido, linea.codigoItem);
      alCambiarDetalle(r.detalle);
      alAvisar('exito', 'Ítem eliminado', r.mensaje);
    } catch (err) {
      alAvisar('error', 'No se pudo eliminar', (err as Error).message);
    }
  }

  return (
    <div className="disposicion">
      <div className="principal">
        <Tarjeta titulo="Buscar producto">
          <form onSubmit={buscar}>
            <div className="fila">
              <Campo etiqueta="Producto">
                <input
                  type="text"
                  value={valor}
                  maxLength={60}
                  placeholder="Nombre o código"
                  onChange={(e) => setValor(e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Filtrar por">
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoBusquedaSimple)}>
                  <option value="N">Nombre</option>
                  <option value="O">Código</option>
                </select>
              </Campo>
            </div>
            <Boton type="submit" cargando={buscando} className="bloque" icono={<IconoBuscar />}>
              Buscar producto
            </Boton>
          </form>
        </Tarjeta>

        {resultados && (
          <Tarjeta titulo="Productos disponibles">
            {resultados.items.length === 0 ? (
              <Vacio mensaje="Sin coincidencias." />
            ) : (
              <div className="tabla-scroll tarjetas-movil">
                <table className="seleccionable tabla-tarjetas">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Und</th>
                      <th className="num">Precio</th>
                      <th>Vence</th>
                      <th className="num">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.items.map((p) => (
                      <tr
                        key={`${p.producto}-${p.lote}`}
                        aria-selected={elegido?.producto === p.producto && elegido?.lote === p.lote}
                        onClick={() => setElegido(p)}
                      >
                        <td className="principal-col" data-etiqueta="Descripción">{p.nombre}</td>
                        <td data-etiqueta="Unidad">{p.unidad}</td>
                        <td className="num" data-etiqueta="Precio">{bolivianos(p.precio)}</td>
                        <td data-etiqueta="Vence">{p.fechaVencimiento}</td>
                        <td className="num" data-etiqueta="Saldo">{p.saldo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Paginacion
              pagina={resultados.pagina}
              porPagina={resultados.porPagina}
              hayMas={resultados.hayMas}
              cargando={buscando}
              alCambiar={(p) => void traer(p, false)}
            />
          </Tarjeta>
        )}

        {elegido && (
          <Tarjeta titulo="Cantidad a reservar">
            <dl className="datos">
              <dt>Producto</dt>
              <dd>{elegido.nombre}</dd>
              <dt>Lote</dt>
              <dd>
                {elegido.lote} · vence {elegido.fechaVencimiento}
              </dd>
              <dt>Precio</dt>
              <dd>Bs {bolivianos(elegido.precio)}</dd>
              <dt>Saldo</dt>
              <dd>
                {elegido.saldo} {elegido.unidad}
              </dd>
            </dl>

            <div style={{ marginTop: 16 }}>
              <Campo
                etiqueta="Cantidad"
                error={cantidad && !validacion.ok ? validacion.mensaje : undefined}
                ayuda={`Máximo ${elegido.saldo} ${elegido.unidad}`}
              >
                <input
                  type="number"
                  min={1}
                  max={Number(elegido.saldo) || undefined}
                  value={cantidad}
                  placeholder="0"
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </Campo>
            </div>

            <Boton
              className="bloque"
              cargando={guardando}
              disabled={!validacion.ok}
              icono={<IconoMas />}
              onClick={agregar}
            >
              {nroPedido ? 'Adicionar al pedido' : 'Crear pedido con este producto'}
            </Boton>
          </Tarjeta>
        )}
      </div>

      {nroPedido && (
        <aside className="lateral">
          <Tarjeta titulo={`Pedido Nº ${nroPedido} · ${detalle.length} ítem(s)`}>
            {detalle.length === 0 ? (
              <Vacio mensaje="El pedido no tiene líneas." />
            ) : (
              <div className="tabla-scroll tarjetas-movil">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Descripción</th>
                      <th className="num">Cant.</th>
                      <th className="num">Neto Bs</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((l) => (
                      <tr key={`${l.item}-${l.codigoItem}`}>
                        <td>{l.item}</td>
                        <td className="principal-col">
                          {l.descripcion}
                          <br />
                          <span className="ayuda">Lote {l.lote}</span>
                        </td>
                        <td className="num">{l.cantidad}</td>
                        <td className="num">{bolivianos(l.netoBs)}</td>
                        <td>
                          <Boton
                            variante="icono"
                            title="Eliminar ítem"
                            aria-label={`Eliminar ${l.descripcion}`}
                            onClick={() => pedirQuitar(l)}
                            icono={<IconoBasura tam={17} />}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Boton
              variante="exito"
              className="bloque"
              style={{ marginTop: 16 }}
              disabled={detalle.length === 0}
              icono={<IconoCheck />}
              onClick={alTerminar}
            >
              Terminar pedido
            </Boton>
          </Tarjeta>
        </aside>
      )}
    </div>
  );
}
