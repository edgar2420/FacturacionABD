/** Piezas visuales reutilizables. Sin librerias externas. */
import type { ReactNode } from 'react';
import { IconoCheck } from './iconos';

export function Tarjeta({
  titulo,
  accion,
  children
}: {
  titulo?: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="tarjeta">
      {titulo && (
        <header>
          <span>{titulo}</span>
          {accion}
        </header>
      )}
      <div className="cuerpo">{children}</div>
    </section>
  );
}

export function Campo({
  etiqueta,
  ayuda,
  error,
  children
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="campo">
      <label>{etiqueta}</label>
      {children}
      {error ? (
        <span className="error-campo">{error}</span>
      ) : (
        ayuda && <span className="ayuda">{ayuda}</span>
      )}
    </div>
  );
}

export function Boton({
  children,
  variante = 'primario',
  cargando = false,
  icono,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'peligro' | 'exito' | 'fantasma' | 'icono';
  cargando?: boolean;
  icono?: ReactNode;
}) {
  const clases = ['btn'];
  if (variante !== 'primario') clases.push(variante);
  if (resto.className) clases.push(resto.className);

  return (
    <button {...resto} className={clases.join(' ')} disabled={resto.disabled || cargando}>
      {cargando ? <span className="cargando" aria-hidden="true" /> : icono}
      {children}
    </button>
  );
}

export function Vacio({ mensaje }: { mensaje: string }) {
  return <p className="vacio">{mensaje}</p>;
}

/**
 * Barra de pasos. Los completados son clicables para volver atras; los futuros
 * no, porque dependen de datos que aun no existen.
 */
export function BarraPasos({
  pasos,
  actual,
  alIr
}: {
  pasos: string[];
  actual: number;
  alIr: (indice: number) => void;
}) {
  return (
    <nav className="pasos" aria-label="Progreso del pedido">
      <ol>
        {pasos.map((nombre, i) => {
          const estado = i === actual ? 'activo' : i < actual ? 'hecho' : 'pendiente';
          return (
            <li key={nombre} className={estado}>
              <button
                type="button"
                aria-current={i === actual ? 'step' : undefined}
                disabled={i >= actual}
                onClick={() => i < actual && alIr(i)}
              >
                <span className="ficha">{i < actual ? <IconoCheck tam={14} /> : i + 1}</span>
                <span className="nombre">{nombre}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
