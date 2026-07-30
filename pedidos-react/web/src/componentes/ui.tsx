/** Piezas visuales reutilizables. Sin librerias externas. */
import type { ReactNode } from 'react';
import type { Aviso } from '../tipos';

export function Tarjeta({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <section className="tarjeta">
      {titulo && <header>{titulo}</header>}
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
      {error ? <span className="error-campo">{error}</span> : ayuda && <span className="ayuda">{ayuda}</span>}
    </div>
  );
}

export function Boton({
  children,
  variante = 'primario',
  cargando = false,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'peligro' | 'exito' | 'icono';
  cargando?: boolean;
}) {
  const clases = ['btn'];
  if (variante !== 'primario') clases.push(variante);
  if (resto.className) clases.push(resto.className);

  return (
    <button {...resto} className={clases.join(' ')} disabled={resto.disabled || cargando}>
      {cargando && <span className="cargando" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Vacio({ mensaje }: { mensaje: string }) {
  return <p className="vacio">{mensaje}</p>;
}

/**
 * Barra de pasos. Los pasos ya completados son clicables para volver atras;
 * los futuros no, porque dependen de datos que aun no existen.
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
      {pasos.map((nombre, i) => {
        const estado = i === actual ? 'activo' : i < actual ? 'hecho' : '';
        return (
          <button
            key={nombre}
            type="button"
            className={`paso ${estado}`}
            aria-current={i === actual ? 'step' : undefined}
            disabled={i >= actual}
            onClick={() => i < actual && alIr(i)}
          >
            <span className="linea" />
            <span>
              {i + 1}. {nombre}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function Avisos({ avisos, alCerrar }: { avisos: Aviso[]; alCerrar: (id: number) => void }) {
  if (avisos.length === 0) return null;

  return (
    <div className="avisos" role="status" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className={`aviso ${a.tono}`}>
          <div className="texto">
            <strong>{a.titulo}</strong>
            {a.detalle && <span>{a.detalle}</span>}
          </div>
          <button type="button" onClick={() => alCerrar(a.id)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
