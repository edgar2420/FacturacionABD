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
  const [resultados, setResultados] = useState<Persona[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<Persona | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!valor.trim()) {
      alAvisar('atencion', 'Falta el dato de búsqueda', 'Escriba un nombre, NIT o código de cliente.');
      return;
    }

    setBuscando(true);
    setSeleccionado(null);
    try {
      const lista = await api.buscarClientes(valor.trim(), tipo);
      setResultados(lista);
      if (lista.length === 0) {
        alAvisar('atencion', 'Cliente no encontrado', 'Revise los datos de búsqueda e intente de nuevo.');
      }
    } catch (err) {
      alAvisar('error', 'No se pudo buscar', (err as Error).message);
    } finally {
      setBuscando(false);
    }
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
        <Tarjeta titulo={`Resultados (${resultados.length})`}>
          {resultados.length === 0 ? (
            <Vacio mensaje="Sin coincidencias. Pruebe con otro filtro." />
          ) : (
            <>
              <div className="tabla-scroll">
                <table className="seleccionable">
                  <thead>
                    <tr>
                      <th>Razón social</th>
                      <th>NIT</th>
                      <th>Ciudad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((c) => (
                      <tr
                        key={c.codigo}
                        aria-selected={seleccionado?.codigo === c.codigo}
                        onClick={() => setSeleccionado(c)}
                      >
                        <td className="principal-col">{c.nombre}</td>
                        <td>{c.ruc}</td>
                        <td>{c.ciudad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Boton
                className="bloque"
                style={{ marginTop: 16 }}
                disabled={!seleccionado}
                icono={<IconoCheck />}
                onClick={() => seleccionado && alElegir(seleccionado)}
              >
                {seleccionado ? `Elegir a ${seleccionado.nombre}` : 'Seleccione un cliente'}
              </Boton>
            </>
          )}
        </Tarjeta>
      )}
    </>
  );
}
