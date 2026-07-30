/*
 * Service worker de Pedidos ABD.
 *
 * Escrito a mano y sin dependencias, a proposito: los archivos que genera Vite
 * llevan un hash distinto en cada compilacion, asi que en vez de una lista fija
 * se cachea sobre la marcha lo que el navegador va pidiendo.
 *
 * Reglas:
 *  - /api: NUNCA se cachea. Los pedidos, el stock y los precios tienen que
 *    salir siempre de Oracle; una respuesta vieja aqui seria un error grave.
 *  - Navegacion (abrir la app): primero la red; si no hay, el index guardado,
 *    para que al menos abra y avise que no hay conexion.
 *  - Recursos estaticos del mismo origen (js, css, tipografia, iconos): se
 *    entrega lo cacheado y se refresca por detras.
 */

const VERSION = 'pedidos-abd-v1';
const CASCARA = '/index.html';

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.add(CASCARA))
      // Si falla (por ejemplo sin red al instalar) no se aborta la instalacion.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  const url = new URL(peticion.url);

  if (peticion.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(CASCARA, copia));
          return respuesta;
        })
        .catch(() => caches.match(CASCARA).then((r) => r ?? Response.error()))
    );
    return;
  }

  evento.respondWith(
    caches.match(peticion).then((cacheado) => {
      const desdeRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(VERSION).then((cache) => cache.put(peticion, copia));
          }
          return respuesta;
        })
        .catch(() => cacheado ?? Response.error());

      return cacheado ?? desdeRed;
    })
  );
});
