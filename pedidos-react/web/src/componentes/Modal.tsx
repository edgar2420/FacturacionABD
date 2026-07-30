/**
 * Modales. Reemplazan a los avisos flotantes: un mensaje importante no deberia
 * poder pasarse por alto ni desaparecer solo.
 *
 * Accesibilidad: role="dialog" + aria-modal, foco automatico en el boton
 * principal, Escape para cerrar y el foco atrapado dentro del cuadro mientras
 * esta abierto.
 */
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Boton } from './ui';
import { IconoAlerta, IconoCerrar, IconoError, IconoExito, IconoInfo } from './iconos';
import type { Aviso } from '../tipos';

export function Modal({
  titulo,
  subtitulo,
  children,
  pie,
  alCerrar,
  tono,
  ancho
}: {
  titulo: string;
  subtitulo?: string;
  children?: ReactNode;
  pie: ReactNode;
  alCerrar: () => void;
  tono?: Aviso['tono'];
  /** "detalle" da mas espacio: se usa para fichas de cliente o producto. */
  ancho?: 'normal' | 'detalle';
}) {
  const cuadro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;

    // Si el modal pide un dato (p.ej. la cantidad), el foco va al campo;
    // si no, al primer boton del pie, que es la accion principal.
    const campo = cuadro.current?.querySelector<HTMLElement>('.cuerpo-modal input, .cuerpo-modal select');
    const primerBoton = cuadro.current?.querySelector<HTMLElement>('.pie-modal button');
    (campo ?? primerBoton)?.focus();

    function alTeclado(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        alCerrar();
        return;
      }

      if (e.key !== 'Tab' || !cuadro.current) return;

      // Atrapar el foco: del ultimo elemento vuelve al primero y viceversa.
      const focusables = cuadro.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alTeclado);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alTeclado);
      document.body.style.overflow = '';
      anterior?.focus();
    };
  }, [alCerrar]);

  const iconos = {
    exito: IconoExito,
    error: IconoError,
    atencion: IconoAlerta,
    info: IconoInfo
  };
  const Icono = tono ? iconos[tono] : null;

  return (
    <div className="fondo-modal" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <div
        className={`modal ${tono ?? ''} ${ancho === 'detalle' ? 'detalle' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        ref={cuadro}
      >
        <header>
          {Icono && (
            <span className={`marca-modal ${tono}`}>
              <Icono tam={22} />
            </span>
          )}
          <div className="titulos-modal">
            <h2 id="titulo-modal">{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" className="cerrar-modal" onClick={alCerrar} aria-label="Cerrar">
            <IconoCerrar tam={18} />
          </button>
        </header>

        {children && <div className="cuerpo-modal">{children}</div>}

        <footer className="pie-modal">{pie}</footer>
      </div>
    </div>
  );
}

/** Modal de un solo boton para mostrar el resultado de una operacion. */
export function ModalAviso({ aviso, alCerrar }: { aviso: Aviso; alCerrar: () => void }) {
  return (
    <Modal
      titulo={aviso.titulo}
      tono={aviso.tono}
      alCerrar={alCerrar}
      pie={
        <Boton onClick={alCerrar} variante={aviso.tono === 'error' ? 'peligro' : 'primario'}>
          Entendido
        </Boton>
      }
    >
      {aviso.detalle && <p>{aviso.detalle}</p>}
    </Modal>
  );
}

export interface Confirmacion {
  titulo: string;
  detalle?: string;
  textoConfirmar?: string;
  peligroso?: boolean;
  alConfirmar: () => void;
}

/** Modal de confirmacion. Reemplaza al confirm() del navegador. */
export function ModalConfirmacion({
  confirmacion,
  alCerrar
}: {
  confirmacion: Confirmacion;
  alCerrar: () => void;
}) {
  return (
    <Modal
      titulo={confirmacion.titulo}
      tono="atencion"
      alCerrar={alCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante={confirmacion.peligroso ? 'peligro' : 'primario'}
            onClick={() => {
              confirmacion.alConfirmar();
              alCerrar();
            }}
          >
            {confirmacion.textoConfirmar ?? 'Confirmar'}
          </Boton>
        </>
      }
    >
      {confirmacion.detalle && <p>{confirmacion.detalle}</p>}
    </Modal>
  );
}
