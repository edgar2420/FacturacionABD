/**
 * Modulo de Pedidos.
 *
 * El JSF original manejaba la pantalla con una decena de banderas booleanas
 * (dataBusqueda, dataClientes, dataPedidoCrear, dataPedidoTerminar...). Aqui
 * eso se reemplaza por un unico indice de paso mas los datos acumulados, que
 * es la misma maquina de estados pero explicita.
 *
 * Pasos: Cliente -> Vendedor -> Productos -> Pago
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './api';
import { Login } from './Login';
import { Avisos, BarraPasos, Boton } from './componentes/ui';
import { PasoCliente } from './pasos/PasoCliente';
import { PasoVendedor } from './pasos/PasoVendedor';
import { PasoProductos } from './pasos/PasoProductos';
import { PasoPago } from './pasos/PasoPago';
import { bolivianos, totalPedido } from './reglas';
import type { Aviso, LineaPedido, Pedido, Persona, Usuario } from './tipos';

const PASOS = ['Cliente', 'Vendedor', 'Productos', 'Pago'];

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [tema, setTema] = useState<'claro' | 'oscuro' | null>(null);

  // --- Estado del pedido en curso ---
  const [paso, setPaso] = useState(0);
  const [cliente, setCliente] = useState<Persona | null>(null);
  const [vendedor, setVendedor] = useState<Persona | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [nroPedido, setNroPedido] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<LineaPedido[]>([]);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [terminando, setTerminando] = useState(false);

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const contador = useRef(0);

  /** Muestra un aviso flotante; los de exito e info se van solos. */
  const avisar = useCallback(
    (tono: Aviso['tono'], titulo: string, detalleTexto?: string) => {
      const id = ++contador.current;
      setAvisos((previos) => [...previos, { id, tono, titulo, detalle: detalleTexto }]);

      if (tono === 'exito' || tono === 'info') {
        setTimeout(() => setAvisos((p) => p.filter((a) => a.id !== id)), 4000);
      }
    },
    []
  );

  const cerrarAviso = useCallback((id: number) => {
    setAvisos((p) => p.filter((a) => a.id !== id));
  }, []);

  // Retomar la sesion si la cookie sigue viva.
  useEffect(() => {
    api
      .sesionActual()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargandoSesion(false));
  }, []);

  // Tema: por defecto el del sistema; el boton lo fuerza.
  useEffect(() => {
    if (tema) document.documentElement.dataset.tema = tema;
  }, [tema]);

  function reiniciar() {
    setPaso(0);
    setCliente(null);
    setVendedor(null);
    setFechaEntrega('');
    setNroPedido(null);
    setDetalle([]);
    setPedido(null);
  }

  async function salir() {
    await api.cerrarSesion().catch(() => undefined);
    reiniciar();
    setUsuario(null);
  }

  async function terminarPedido() {
    if (!nroPedido) return;

    setTerminando(true);
    try {
      const r = await api.terminarPedido(nroPedido);
      setPedido(r.pedido);
      setDetalle(r.detalle);
      setPaso(3);
      avisar('exito', 'Pedido procesado', 'Indique ahora si el pedido fue pagado.');
    } catch (err) {
      avisar('error', 'No se pudo terminar el pedido', (err as Error).message);
    } finally {
      setTerminando(false);
    }
  }

  if (cargandoSesion) {
    return (
      <main className="login">
        <span className="cargando" aria-label="Cargando" />
      </main>
    );
  }

  if (!usuario) {
    return <Login alEntrar={setUsuario} />;
  }

  const total = totalPedido(detalle);
  const finalizado = Boolean(pedido?.pagado);

  return (
    <div className="app">
      <header className="barra">
        <h1>Pedidos · ABD</h1>
        <span className="crece" />
        <span className="usuario">
          {usuario.nombre} · {usuario.almacen}
        </span>
        <Boton
          variante="secundario"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}
          onClick={() => setTema(tema === 'oscuro' ? 'claro' : 'oscuro')}
          aria-label="Cambiar tema"
        >
          {tema === 'oscuro' ? '☀' : '☾'}
        </Boton>
        <Boton
          variante="secundario"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,.35)' }}
          onClick={salir}
        >
          Salir
        </Boton>
      </header>

      <Avisos avisos={avisos} alCerrar={cerrarAviso} />

      <main className="contenido">
        <BarraPasos
          pasos={PASOS}
          actual={paso}
          alIr={(i) => {
            // Con el pedido ya creado no se vuelve a cambiar cliente o vendedor:
            // la cabecera ya existe en Oracle con esos datos.
            if (nroPedido && i < 2) {
              avisar('atencion', 'El pedido ya fue creado', 'Cancele el pedido para empezar de nuevo.');
              return;
            }
            setPaso(i);
          }}
        />

        {paso === 0 && (
          <PasoCliente
            alAvisar={avisar}
            alElegir={(c) => {
              setCliente(c);
              setPaso(1);
            }}
          />
        )}

        {paso === 1 && cliente && (
          <PasoVendedor
            cliente={cliente}
            fechaEntrega={fechaEntrega}
            alCambiarFecha={setFechaEntrega}
            alAvisar={avisar}
            alElegir={(v) => {
              setVendedor(v);
              setPaso(2);
            }}
          />
        )}

        {paso === 2 && cliente && vendedor && (
          <PasoProductos
            cliente={cliente}
            vendedor={vendedor}
            fechaEntrega={fechaEntrega}
            nroPedido={nroPedido}
            detalle={detalle}
            alAvisar={avisar}
            alCrearPedido={(nro, det) => {
              setNroPedido(nro);
              setDetalle(det);
            }}
            alCambiarDetalle={setDetalle}
            alTerminar={terminarPedido}
          />
        )}

        {paso === 3 && cliente && nroPedido && (
          <PasoPago
            nroPedido={nroPedido}
            cliente={cliente}
            detalle={detalle}
            pedido={pedido}
            alAvisar={avisar}
            alFinalizar={(p, d) => {
              setPedido(p);
              setDetalle(d);
            }}
          />
        )}
      </main>

      {/* Barra inferior: el total siempre visible, como pide un pedido en tablet. */}
      {(nroPedido || detalle.length > 0) && (
        <div className="total-fijo">
          <div className="interior">
            <div className="cifra">
              <small>
                {nroPedido ? `Pedido Nº ${nroPedido}` : 'Pedido nuevo'} · {detalle.length} ítem(s)
              </small>
              <strong>Bs {bolivianos(total)}</strong>
            </div>

            {finalizado ? (
              <Boton variante="exito" onClick={reiniciar}>
                Nuevo pedido
              </Boton>
            ) : (
              <>
                <Boton variante="secundario" onClick={reiniciar}>
                  Cancelar
                </Boton>
                {paso === 2 && (
                  <Boton
                    variante="exito"
                    cargando={terminando}
                    disabled={detalle.length === 0}
                    onClick={terminarPedido}
                  >
                    Terminar
                  </Boton>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
