/**
 * Avisos discretos, para lo que salio bien.
 *
 * Criterio: un exito no debe interrumpir. Se muestra abajo en celular (donde
 * esta el pulgar) y arriba a la derecha en pantallas grandes, y se va solo.
 * Los errores y las confirmaciones siguen en modal, porque ahi si hace falta
 * que la persona lea y decida.
 */
import { useEffect } from 'react';
import { IconoCerrar, IconoExito, IconoInfo } from './iconos';
import type { Aviso } from '../tipos';

const DURACION = 4200;

export function Toasts({ avisos, alCerrar }: { avisos: Aviso[]; alCerrar: (id: number) => void }) {
  if (avisos.length === 0) return null;

  return (
    <div className="toasts" role="status" aria-live="polite">
      {avisos.map((a) => (
        <Toast key={a.id} aviso={a} alCerrar={() => alCerrar(a.id)} />
      ))}
    </div>
  );
}

function Toast({ aviso, alCerrar }: { aviso: Aviso; alCerrar: () => void }) {
  useEffect(() => {
    const t = setTimeout(alCerrar, DURACION);
    return () => clearTimeout(t);
  }, [alCerrar]);

  const Icono = aviso.tono === 'exito' ? IconoExito : IconoInfo;

  return (
    <div className={`toast ${aviso.tono}`}>
      <span className="marca-toast">
        <Icono tam={19} />
      </span>

      <div className="texto-toast">
        <strong>{aviso.titulo}</strong>
        {aviso.detalle && <span>{aviso.detalle}</span>}
      </div>

      <button type="button" onClick={alCerrar} aria-label="Cerrar aviso">
        <IconoCerrar tam={16} />
      </button>
    </div>
  );
}
