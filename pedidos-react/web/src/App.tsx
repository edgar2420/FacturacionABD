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
import { useCallback, useEffect, useState } from 'react';
import * as api from './api';
import { Login } from './Login';
import { BarraPasos, Boton } from './componentes/ui';
import { ModalAviso, ModalConfirmacion } from './componentes/Modal';
import { Toasts } from './componentes/Toast';
import { PieApp } from './componentes/PieApp';
import type { Confirmacion } from './componentes/Modal';
import { IconoCarrito, IconoLuna, IconoSalir, IconoSol } from './componentes/iconos';
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
  /**
   * El tema arranca SIEMPRE en claro; no se sigue la preferencia del sistema.
   * Si el usuario eligio oscuro antes, se respeta esa eleccion.
   */
  const [tema, setTema] = useState<'claro' | 'oscuro'>(
    () => (localStorage.getItem('tema-pedidos') === 'oscuro' ? 'oscuro' : 'claro')
  );

  // --- Estado del pedido en curso ---
  const [paso, setPaso] = useState(0);
  const [cliente, setCliente] = useState<Persona | null>(null);
  const [vendedor, setVendedor] = useState<Persona | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [nroPedido, setNroPedido] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<LineaPedido[]>([]);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [terminando, setTerminando] = useState(false);

  /**
   * Los mensajes van en modal, de a uno. Se encolan para que dos avisos
   * seguidos no se pisen: el segundo aparece al cerrar el primero.
   */
  const [colaAvisos, setColaAvisos] = useState<Aviso[]>([]);
  const [toasts, setToasts] = useState<Aviso[]>([]);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  /**
   * Lo que salio bien va en un toast que se va solo y no interrumpe.
   * Los errores y las advertencias van en modal, porque ahi si hace falta
   * que la persona lea y confirme.
   */
  const avisar = useCallback((tono: Aviso['tono'], titulo: string, detalleTexto?: string) => {
    const aviso = { id: Date.now() + Math.random(), tono, titulo, detalle: detalleTexto };

    if (tono === 'exito' || tono === 'info') {
      setToasts((previos) => [...previos, aviso]);
    } else {
      setColaAvisos((previos) => [...previos, aviso]);
    }
  }, []);

  const cerrarAviso = useCallback(() => setColaAvisos((p) => p.slice(1)), []);
  const cerrarToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const confirmar = useCallback((c: Confirmacion) => setConfirmacion(c), []);

  // Retomar la sesion si la cookie sigue viva.
  useEffect(() => {
    api
      .sesionActual()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargandoSesion(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem('tema-pedidos', tema);
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

  /** Cancelar descarta lo que hay en pantalla; conviene confirmarlo. */
  function pedirCancelar() {
    if (!nroPedido && detalle.length === 0) {
      reiniciar();
      return;
    }
    confirmar({
      titulo: '¿Descartar este pedido?',
      detalle: nroPedido
        ? `El pedido Nº ${nroPedido} ya existe en el sistema y seguirá ahí. Solo se limpia la pantalla para empezar uno nuevo.`
        : 'Se perderán los datos cargados en pantalla.',
      textoConfirmar: 'Sí, empezar de nuevo',
      peligroso: true,
      alConfirmar: reiniciar
    });
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
  const avisoActual = colaAvisos[0];
  // La barra de total es fija y taparia el pie, asi que cuando esta visible se
  // le reserva sitio al final de la pagina.
  const hayBarraTotal = Boolean(nroPedido) || detalle.length > 0;

  return (
    <div className={`app ${hayBarraTotal ? 'con-total' : ''}`}>
      <header className="barra">
        <div className="marca-app">
          {/* El logo institucional, el mismo archivo que usa el sistema JSF. */}
          <img src="/logo-abd.png" alt="Laboratorios ABD" className="logo-abd" />
          <h1>Módulo Pedidos ABD</h1>
        </div>

        <span className="crece" />

        {usuario.modoDesarrollo && (
          <span className="etiqueta dev" title="Sesión sin usuario en ABD.USUARIOS">
            DEV
          </span>
        )}

        <div className="usuario">
          <b>{usuario.nombre}</b>
          <span>{usuario.almacen}</span>
        </div>

        <Boton
          variante="fantasma"
          onClick={() => setTema(tema === 'oscuro' ? 'claro' : 'oscuro')}
          aria-label={tema === 'oscuro' ? 'Usar tema claro' : 'Usar tema oscuro'}
          title={tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}
          icono={tema === 'oscuro' ? <IconoSol /> : <IconoLuna />}
        />

        <Boton
          variante="fantasma"
          onClick={salir}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          icono={<IconoSalir />}
        />
      </header>

      <main className="contenido">
        <BarraPasos
          pasos={PASOS}
          actual={paso}
          alIr={(i) => {
            // Con el pedido ya creado no se cambia cliente ni vendedor:
            // la cabecera ya existe en Oracle con esos datos.
            if (nroPedido && i < 2) {
              avisar(
                'atencion',
                'El pedido ya fue creado',
                'El cliente y el vendedor quedaron guardados en la cabecera. Para cambiarlos hay que empezar un pedido nuevo.'
              );
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
            alConfirmar={confirmar}
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

      <PieApp />

      {/* Barra inferior: el total siempre visible, como pide un pedido en tablet. */}
      {hayBarraTotal && (
        <div className="total-fijo">
          <div className="interior">
            <div className="cifra">
              <small>
                <IconoCarrito tam={13} />
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
                <Boton variante="secundario" onClick={pedirCancelar}>
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

      <Toasts avisos={toasts} alCerrar={cerrarToast} />

      {avisoActual && <ModalAviso aviso={avisoActual} alCerrar={cerrarAviso} />}

      {confirmacion && (
        <ModalConfirmacion confirmacion={confirmacion} alCerrar={() => setConfirmacion(null)} />
      )}
    </div>
  );
}
