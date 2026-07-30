/**
 * Paso 1: buscar y elegir el cliente.
 *
 * Equivale a PedidosBean.buscarCliente() + elegirCliente().
 * El backend ya aplica el filtro CODIGO_CLIENTE = 'SI'.
 */
import { useState } from 'react';
import * as api from '../api';
import { Boton, Campo, Tarjeta, Vacio } from '../componentes/ui';
import { IconoBuscar, IconoCheck } from '../componentes/iconos';
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
  const [seleccionado, setSeleccionado] = useState<Persona | null>(null);
  const [buscando, setBuscando] = useState(false);

  /** Trae una pagina. Al cambiar de pagina no se limpia la seleccion previa. */
  async function traer(pagina: number, esNuevaBusqueda: boolean) {
    if (!valor.trim()) {
      alAvisar('atencion', 'Falta el dato de búsqueda', 'Escriba un nombre, NIT o código de cliente.');
      return;
    }

    setBuscando(true);
    if (esNuevaBusqueda) setSeleccionado(null);

    try {
      const r = await api.buscarClientes(valor.trim(), tipo, pagina);
      setResultados(r);
      if (r.total === 0) {
        alAvisar('atencion', 'Cliente no encontrado', 'Revise los datos de búsqueda e intente de nuevo.');
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
                      <tr
                        key={c.codigo}
                        aria-selected={seleccionado?.codigo === c.codigo}
                        onClick={() => setSeleccionado(c)}
                      >
                        <td className="principal-col" data-etiqueta="Razón social">{c.nombre}</td>
                        <td data-etiqueta="NIT">{c.ruc}</td>
                        <td data-etiqueta="Ciudad">{c.ciudad}</td>
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
                alCambiar={(p) => void traer(p, false)}
              />

              {/* El nombre va aparte y no dentro del boton: hay clientes con
                  nombres larguisimos que desbordaban la tarjeta. */}
              {seleccionado && (
                <p className="elegido">
                  Seleccionado: <b>{seleccionado.nombre}</b>
                </p>
              )}

              <Boton
                className="bloque"
                style={{ marginTop: 12 }}
                disabled={!seleccionado}
                icono={<IconoCheck />}
                onClick={() => seleccionado && alElegir(seleccionado)}
              >
                {seleccionado ? 'Elegir este cliente' : 'Seleccione un cliente'}
              </Boton>
            </>
          )}
        </Tarjeta>
      )}
    </>
  );
}
