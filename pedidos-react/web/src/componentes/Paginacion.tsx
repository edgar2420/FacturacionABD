/**
 * Controles de paginacion.
 *
 * Dos variantes segun lo que sepa el servidor:
 *  - con `total`: se puede mostrar "Pagina 2 de 7" y el rango de filas.
 *  - sin `total` (listados que vienen de un REF CURSOR, como los productos):
 *    solo se sabe si hay pagina siguiente.
 */
import { Boton } from './ui';
import { IconoFlechaAtras } from './iconos';

export function Paginacion({
  pagina,
  porPagina,
  total,
  hayMas,
  cargando = false,
  alCambiar
}: {
  pagina: number;
  porPagina: number;
  total?: number;
  hayMas?: boolean;
  cargando?: boolean;
  alCambiar: (pagina: number) => void;
}) {
  const paginas = total !== undefined ? Math.max(1, Math.ceil(total / porPagina)) : undefined;
  const puedeSiguiente = paginas !== undefined ? pagina < paginas : Boolean(hayMas);
  const puedeAnterior = pagina > 1;

  // Con una sola pagina no hay nada que paginar.
  if (!puedeAnterior && !puedeSiguiente) return null;

  const desde = (pagina - 1) * porPagina + 1;
  const hasta = total !== undefined ? Math.min(pagina * porPagina, total) : pagina * porPagina;

  return (
    <nav className="paginacion" aria-label="Paginación de resultados">
      <Boton
        variante="secundario"
        disabled={!puedeAnterior || cargando}
        onClick={() => alCambiar(pagina - 1)}
        icono={<IconoFlechaAtras tam={17} />}
        aria-label="Página anterior"
        title="Página anterior"
      >
        Anterior
      </Boton>

      <span className="indicador" aria-live="polite">
        {total !== undefined ? (
          <>
            <b>
              {desde}–{hasta}
            </b>{' '}
            de {total}
          </>
        ) : (
          <>
            Página <b>{pagina}</b>
          </>
        )}
      </span>

      <Boton
        variante="secundario"
        disabled={!puedeSiguiente || cargando}
        onClick={() => alCambiar(pagina + 1)}
        aria-label="Página siguiente"
        title="Página siguiente"
        icono={<IconoFlechaAtras tam={17} style={{ transform: 'rotate(180deg)' }} />}
      >
        Siguiente
      </Boton>
    </nav>
  );
}
