/**
 * Iconos SVG en linea. Sin emojis y sin librerias externas: se dibujan con
 * currentColor, asi heredan el color del texto y funcionan igual en claro y
 * oscuro.
 *
 * Trazo de 1.75 para que se lean bien tambien en pantallas pequenas.
 */
import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { tam?: number };

function Base({ tam = 18, children, ...resto }: Props) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  );
}

export const IconoBuscar = (p: Props) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const IconoOjo = (p: Props) => (
  <Base {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.75" />
  </Base>
);

export const IconoOjoTachado = (p: Props) => (
  <Base {...p}>
    <path d="M9.9 5.7A10.6 10.6 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a18 18 0 0 1-3.2 4" />
    <path d="M6.3 7.8A17.5 17.5 0 0 0 2 12s3.6 6.5 10 6.5a10.9 10.9 0 0 0 4-.75" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m3 3 18 18" />
  </Base>
);

export const IconoBasura = (p: Props) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7 7 19a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l.5-12" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
  </Base>
);

export const IconoCheck = (p: Props) => (
  <Base {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Base>
);

export const IconoCerrar = (p: Props) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const IconoAlerta = (p: Props) => (
  <Base {...p}>
    <path d="M12 3.8 2.7 19.2A1 1 0 0 0 3.6 20.7h16.8a1 1 0 0 0 .9-1.5L12 3.8Z" />
    <path d="M12 9.5v4.2" />
    <circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none" />
  </Base>
);

export const IconoError = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Base>
);

export const IconoInfo = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r=".6" fill="currentColor" stroke="none" />
  </Base>
);

export const IconoExito = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-5" />
  </Base>
);

export const IconoSol = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </Base>
);

export const IconoLuna = (p: Props) => (
  <Base {...p}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z" />
  </Base>
);

export const IconoSalir = (p: Props) => (
  <Base {...p}>
    <path d="M14 20H6.5A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4H14" />
    <path d="M17 15.5 20.5 12 17 8.5" />
    <path d="M20.5 12H10" />
  </Base>
);

export const IconoCarrito = (p: Props) => (
  <Base {...p}>
    <path d="M3 4h2.2l2 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6" />
    <circle cx="9.5" cy="20" r="1.2" />
    <circle cx="17.5" cy="20" r="1.2" />
  </Base>
);

export const IconoUsuario = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Base>
);

export const IconoCandado = (p: Props) => (
  <Base {...p}>
    <rect x="4.5" y="10" width="15" height="10" rx="2" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </Base>
);

export const IconoCalendario = (p: Props) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
  </Base>
);

export const IconoFlechaAtras = (p: Props) => (
  <Base {...p}>
    <path d="M10 5.5 3.5 12l6.5 6.5" />
    <path d="M3.5 12h17" />
  </Base>
);

export const IconoMas = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

/** Almacen: un galpon con su porton. */
export const IconoAlmacen = (p: Props) => (
  <Base {...p}>
    <path d="M3 21V9l9-5 9 5v12" />
    <path d="M9 21v-6h6v6" />
    <path d="M3 21h18" />
  </Base>
);
