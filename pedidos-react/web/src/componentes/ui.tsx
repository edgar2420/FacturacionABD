/** Piezas visuales reutilizables. Sin librerias externas. */
import { cloneElement, isValidElement, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
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

/** Etiquetas que se enlazan sole con su control mediante id/htmlFor. */
const CONTROLES = ['input', 'select', 'textarea'];

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
  const id = useId();

  /*
   * La etiqueta se enlaza con el control. Sin esto un lector de pantalla lee
   * la caja de texto sin decir para que es, y tocar la etiqueta en el celular
   * no da el foco al campo.
   *
   * Solo se enlaza cuando el hijo es directamente un control; si viene
   * envuelto (el campo de contraseña, que trae el boton del ojo al lado) se
   * deja como estaba, porque el id caeria sobre el div y no serviria.
   */
  const esControl = isValidElement(children) && CONTROLES.includes(children.type as string);
  const control = esControl
    ? cloneElement(children as ReactElement, { id })
    : children;

  return (
    <div className="campo">
      <label htmlFor={esControl ? id : undefined}>{etiqueta}</label>
      {control}
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
      {children != null && children !== false && <span className="texto-btn">{children}</span>}
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
