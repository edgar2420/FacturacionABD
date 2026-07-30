/**
 * Pie de la aplicacion: creditos de autoria.
 *
 * Va en un componente aparte porque aparece en dos sitios (la pantalla de
 * ingreso y la aplicacion ya iniciada) y el texto tiene que ser el mismo.
 */
export function PieApp() {
  return (
    <footer className="pie-app">
      <p>
        Desarrollado por <strong>Ing. Edgar Rojas Apaza</strong>
      </p>
      <p className="sutil">Laboratorios ABD · Módulo Pedidos</p>
    </footer>
  );
}
