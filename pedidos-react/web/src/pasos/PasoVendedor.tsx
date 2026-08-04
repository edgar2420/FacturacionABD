/**
 * Paso 2: elegir el vendedor y fijar la fecha de entrega.
 *
 * Equivale a PedidosBean.buscarVendedor() + elegirVendedor().
 * La fecha de entrega se pide aqui porque el precio de los productos depende
 * de ella (F_OBTENER_PRODUCTOS la recibe como parametro).
 *
 * Al tocar un vendedor se abre su ficha en un modal y se confirma ahi mismo.
 */
import { useState } from 'react';
import * as api from '../api';
import {
  ddmmaaaaAIso,
  formatearFecha,
  hoyIso,
  isoADdmmaaaa,
  validarFechaEntrega
} from '../reglas';
import { Boton, Campo, Tarjeta, Vacio } from '../componentes/ui';
import { Modal } from '../componentes/Modal';
import { IconoBuscar, IconoCalendario, IconoCheck } from '../componentes/iconos';
import { Paginacion } from '../componentes/Paginacion';
import type { Pagina } from '../api';
import type { Persona, TipoBusquedaSimple } from '../tipos';

export function PasoVendedor({
  cliente,
  fechaEntrega,
  alCambiarFecha,
  alElegir,
  alAvisar
}: {
  cliente: Persona;
  fechaEntrega: string;
  alCambiarFecha: (valor: string) => void;
  alElegir: (vendedor: Persona) => void;
  alAvisar: (tono: 'error' | 'atencion' | 'info', titulo: string, detalle?: string) => void;
}) {
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TipoBusquedaSimple>('N');
  const [resultados, setResultados] = useState<Pagina<Persona> | null>(null);
  const [enDetalle, setEnDetalle] = useState<Persona | null>(null);
  const [buscando, setBuscando] = useState(false);

  const validacionFecha = fechaEntrega ? validarFechaEntrega(fechaEntrega) : { ok: false };

  async function traer(pagina: number) {
    if (!valor.trim()) {
      alAvisar('atencion', 'Falta el dato de búsqueda', 'Escriba un nombre o código de vendedor.');
      return;
    }

    setBuscando(true);
    try {
      const r = await api.buscarVendedores(valor.trim(), tipo, pagina);
      setResultados(r);
      if (r.total === 0) {
        alAvisar(
          'atencion',
          'Vendedor no encontrado',
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
    void traer(1);
  }

  /** Confirma el vendedor del modal, validando antes la fecha de entrega. */
  function confirmar(vendedor: Persona) {
    const v = validarFechaEntrega(fechaEntrega);
    if (!v.ok) {
      setEnDetalle(null);
      alAvisar('error', 'Falta la fecha de entrega', v.mensaje ?? 'Indique la fecha de entrega.');
      return;
    }
    alElegir(vendedor);
  }

  return (
    <>
      {/* Igual que en el paso del cliente: en escritorio los datos y la
          busqueda a la izquierda, los resultados a la derecha. */}
      <div className="disposicion busqueda">
      <aside className="lateral">
      <Tarjeta titulo="Cliente elegido">
        <dl className="datos">
          <dt>Código</dt>
          <dd>{cliente.codigo}</dd>
          <dt>Nombre</dt>
          <dd>{cliente.nombre}</dd>
          <dt>NIT</dt>
          <dd>{cliente.ruc || '—'}</dd>
          <dt>Ciudad</dt>
          <dd>{cliente.ciudad || '—'}</dd>
        </dl>
      </Tarjeta>

      <Tarjeta titulo="Fecha de entrega">
        {/* type="date" abre el calendario propio del dispositivo: en celular
            es el selector nativo, mucho mas comodo que teclear la fecha. */}
        <Campo
          etiqueta="Fecha de entrega"
          ayuda="No puede ser anterior a hoy. Define el precio de los productos."
          error={fechaEntrega && !validacionFecha.ok ? validacionFecha.mensaje : undefined}
        >
          <input
            type="date"
            className="campo-fecha"
            min={hoyIso()}
            value={ddmmaaaaAIso(fechaEntrega)}
            onChange={(e) => alCambiarFecha(isoADdmmaaaa(e.target.value))}
            onClick={(e) => {
              // Al tocar cualquier parte del campo se abre el calendario, no
              // solo el iconito, que en celular es un blanco diminuto.
              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
              try {
                el.showPicker?.();
              } catch {
                /* algunos navegadores solo lo permiten por gesto directo */
              }
            }}
          />
        </Campo>

        <div className="acciones-fecha">
          <Boton
            variante="secundario"
            icono={<IconoCalendario />}
            onClick={() => alCambiarFecha(formatearFecha(new Date()))}
          >
            Hoy
          </Boton>
          <Boton
            variante="secundario"
            icono={<IconoCalendario />}
            onClick={() => {
              const m = new Date();
              m.setDate(m.getDate() + 1);
              alCambiarFecha(formatearFecha(m));
            }}
          >
            Mañana
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Vendedor">
        <form onSubmit={buscar}>
          <div className="fila">
            <Campo etiqueta="Dato a buscar">
              <input
                type="text"
                value={valor}
                maxLength={60}
                placeholder="Nombre o código de vendedor"
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
            Buscar vendedor
          </Boton>
        </form>
      </Tarjeta>
      </aside>

      <div className="principal">
      {!resultados && (
        <div className="espera-busqueda solo-escritorio">
          <div>
            <IconoBuscar tam={30} />
            <b>Todavía no hay búsqueda</b>
            <span>Indique la fecha de entrega y busque el vendedor.</span>
          </div>
        </div>
      )}

      {resultados && (
        <Tarjeta titulo={`Vendedores (${resultados.total})`}>
          {resultados.total === 0 ? (
            <Vacio mensaje="Sin coincidencias." />
          ) : (
            <>
              <p className="pista">Toque un vendedor para elegirlo.</p>

              <div className="tabla-scroll tarjetas-movil">
                <table className="seleccionable tabla-tarjetas">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Ciudad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.items.map((v) => (
                      <tr key={v.codigo} onClick={() => setEnDetalle(v)}>
                        <td className="principal-col" data-etiqueta="Nombre">
                          {v.nombre}
                        </td>
                        <td data-etiqueta="Código">{v.codigo}</td>
                        <td data-etiqueta="Ciudad">{v.ciudad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Paginacion
                pagina={resultados.pagina}
                porPagina={resultados.porPagina}
                total={resultados.total}
                cargando={buscando}
                alCambiar={(p) => void traer(p)}
              />
            </>
          )}
        </Tarjeta>
      )}
      </div>
      </div>

      {enDetalle && (
        <Modal
          titulo={enDetalle.nombre}
          subtitulo={`Código ${enDetalle.codigo}`}
          ancho="detalle"
          alCerrar={() => setEnDetalle(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setEnDetalle(null)}>
                Cancelar
              </Boton>
              <Boton icono={<IconoCheck />} onClick={() => confirmar(enDetalle)}>
                Elegir vendedor
              </Boton>
            </>
          }
        >
          <dl className="datos">
            <dt>Ciudad</dt>
            <dd>{enDetalle.ciudad || '—'}</dd>
            <dt>Teléfono</dt>
            <dd>{enDetalle.telefono || '—'}</dd>
            <dt>Entrega</dt>
            <dd>{fechaEntrega || 'sin definir'}</dd>
          </dl>

          {!validacionFecha.ok && (
            <p className="nota-modal">
              Falta indicar una fecha de entrega válida antes de continuar.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
