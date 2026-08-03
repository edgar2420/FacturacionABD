/**
 * Paso 1: buscar y elegir el cliente.
 *
 * Equivale a PedidosBean.buscarCliente() + elegirCliente().
 * El backend ya aplica el filtro CODIGO_CLIENTE = 'SI'.
 *
 * Al tocar una fila se abre su ficha en un modal y se confirma ahi mismo.
 * Antes habia que seleccionar arriba y bajar hasta un boton al pie, que en
 * celular obliga a desplazarse y con nombres largos se desbordaba.
 */
import { useState } from 'react';
import * as api from '../api';
import { Boton, Campo, Tarjeta, Vacio } from '../componentes/ui';
import { Modal } from '../componentes/Modal';
import { IconoAlerta, IconoBuscar, IconoCheck } from '../componentes/iconos';
import { Paginacion } from '../componentes/Paginacion';
import type { Pagina } from '../api';
import type { Persona, TipoBusquedaCliente } from '../tipos';

const FILTROS: { valor: TipoBusquedaCliente; etiqueta: string }[] = [
  { valor: 'N', etiqueta: 'Nombre' },
  { valor: 'R', etiqueta: 'Razón social' },
  { valor: 'C', etiqueta: 'Carnet / NIT' },
  { valor: 'O', etiqueta: 'Código' }
];

export function PasoCliente({
  alElegir,
  alAvisar
}: {
  alElegir: (cliente: Persona) => void;
  alAvisar: (tono: 'error' | 'atencion' | 'info', titulo: string, detalle?: string) => void;
}) {
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TipoBusquedaCliente>('N');
  const [resultados, setResultados] = useState<Pagina<Persona> | null>(null);
  const [enDetalle, setEnDetalle] = useState<Persona | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function traer(pagina: number) {
    if (!valor.trim()) {
      alAvisar(
        'atencion',
        'Falta el dato de búsqueda',
        'Escriba un nombre, NIT o código de cliente.'
      );
      return;
    }

    setBuscando(true);
    try {
      const r = await api.buscarClientes(valor.trim(), tipo, pagina);
      setResultados(r);
      if (r.total === 0) {
        alAvisar(
          'atencion',
          'Cliente no encontrado',
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

  return (
    <>
      <Tarjeta titulo="Cliente">
        <form onSubmit={buscar}>
          <div className="fila">
            <Campo etiqueta="Dato a buscar">
              <input
                type="text"
                value={valor}
                maxLength={60}
                autoFocus
                placeholder="Nombre, NIT o código"
                onChange={(e) => setValor(e.target.value)}
              />
            </Campo>
            <Campo etiqueta="Filtrar por">
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoBusquedaCliente)}>
                {FILTROS.map((f) => (
                  <option key={f.valor} value={f.valor}>
                    {f.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <Boton type="submit" cargando={buscando} className="bloque" icono={<IconoBuscar />}>
            Buscar cliente
          </Boton>
        </form>
      </Tarjeta>

      {resultados && (
        <Tarjeta titulo={`Resultados (${resultados.total})`}>
          {resultados.total === 0 ? (
            <Vacio mensaje="Sin coincidencias. Pruebe con otro filtro." />
          ) : (
            <>
              <p className="pista">Toque un cliente para ver sus datos y elegirlo.</p>

              <div className="tabla-scroll tarjetas-movil">
                <table className="seleccionable tabla-tarjetas">
                  <thead>
                    <tr>
                      <th>Razón social</th>
                      <th>NIT</th>
                      <th>Ciudad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.items.map((c) => (
                      <tr key={c.codigo} onClick={() => setEnDetalle(c)}>
                        <td className="principal-col" data-etiqueta="Razón social">
                          {c.nombre}
                        </td>
                        <td data-etiqueta="NIT">{c.ruc}</td>
                        <td data-etiqueta="Ciudad">
                          {c.ciudad}
                          {c.zona?.estado === 'otra-region' && (
                            <span className="marca-otra-region" title={c.zona.mensaje}>
                              <IconoAlerta tam={14} />
                              otra región
                            </span>
                          )}
                        </td>
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
              <Boton icono={<IconoCheck />} onClick={() => alElegir(enDetalle)}>
                Elegir cliente
              </Boton>
            </>
          }
        >
          <dl className="datos">
            <dt>Razón social</dt>
            <dd>{enDetalle.razonSocial || enDetalle.nombre}</dd>
            <dt>NIT</dt>
            <dd>{enDetalle.ruc || '—'}</dd>
            <dt>Ciudad</dt>
            <dd>{enDetalle.ciudad || '—'}</dd>
            <dt>Dirección</dt>
            <dd>{enDetalle.direccion || '—'}</dd>
            <dt>Teléfono</dt>
            <dd>{enDetalle.telefono || '—'}</dd>
            <dt>Correo</dt>
            <dd>{enDetalle.email || '—'}</dd>
          </dl>

          {/* Aviso, no bloqueo: decide el vendedor. La ciudad de ABD.PERSONAS
              es texto libre y esta demasiado sucia para impedir una venta. */}
          {enDetalle.zona?.estado === 'otra-region' && (
            <p className="aviso-zona">
              <IconoAlerta tam={18} />
              <span>{enDetalle.zona.mensaje}</span>
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
