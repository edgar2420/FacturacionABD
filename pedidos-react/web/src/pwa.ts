/**
 * Registro del service worker (la parte que hace instalable la aplicacion).
 *
 * Solo se registra en la version compilada: en desarrollo estorba, porque el
 * cache devuelve archivos viejos y los cambios no se ven al recargar.
 */
export function registrarServiceWorker() {
  if (import.meta.env.DEV) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Sin service worker la aplicacion funciona igual; solo deja de ser
      // instalable y de abrir sin conexion. No vale la pena molestar al usuario.
      console.warn('No se pudo registrar el service worker:', err);
    });
  });
}
