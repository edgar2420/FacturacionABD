# QA del módulo de Pedidos (React)

Pruebas de extremo a extremo de `pedidos-react/web`.

> No confundir con `qa/` en la raíz del repositorio, que prueba el sistema JSF
> original. Esta suite es solo para la aplicación React.

## Lo más importante: no toca la base de datos

**Todas** las llamadas a `/api` se responden con datos de prueba
(`cypress/support/api.js`). La suite no habla con Oracle y **no crea pedidos
reales**.

Esto no es una comodidad, es una necesidad: el backend apunta a la base de
**producción** (`192.168.0.5/PDBABD`). Una prueba que creara un pedido crearía
un pedido de verdad, con su reserva de stock.

Por eso tampoco hay que "arreglar" esto apuntando las pruebas al backend real
sin antes tener una base de pruebas aparte.

## Cómo se corre

Solo hace falta el frontend levantado; el backend no se usa.

```
cd ../web
npm run dev
```

Y en otra terminal:

```
cd qa
npm install
npm run qa          # sin ventana, para revisar todo de una
npm run qa:abrir    # con ventana, para mirar paso a paso
```

Si el frontend está en otro puerto:

```
set URL_WEB=http://localhost:4173
npm run qa
```

## Qué se prueba

| Archivo | Qué revisa |
|---|---|
| `01-sesion.cy.js` | Ingreso, el ojo de la contraseña, error de credenciales, logo, pie de autoría, cerrar sesión |
| `02-cliente-vendedor.cy.js` | Búsqueda, ficha en modal, Escape, fecha de entrega y sus validaciones, volver de paso |
| `03-lotes.cy.js` | **Saldos sumados y reparto FEFO** (ver abajo) |
| `04-pedido.cy.js` | Crear, adicionar, eliminar, terminar y pagar; bancos según forma de pago |
| `05-interfaz.cy.js` | Tema claro al arrancar, modales centrados, tarjetas en celular, sin scroll horizontal, manifest e iconos |

## La regla de lotes

`03-lotes.cy.js` es la suite que cuida la regla del negocio. El producto de
referencia es `PT982` (CALCUSAN), con tres lotes:

| Lote | Vence | Saldo |
|---|---|---|
| F244 | 30/09/26 | 5 |
| F245 | 30/09/26 | 120 |
| F250 | 31/12/26 | 200 |

Se comprueba que:

- en la lista se ve **una** fila con saldo **325**, no tres filas
- se muestra el vencimiento **más próximo** (30/09/26), no el más lejano
- pedir 3 sale solo de F244
- pedir 100 saca 5 de F244 y 95 de F245 — **a igual vencimiento sale primero el
  lote de menor saldo**
- pedir 300 reparte 5 + 120 + 175 y deja F250 (el que vence más tarde) para el
  final
- pedir 326 se rechaza
- al guardar, el pedido queda con **una línea por lote**
- eliminar el producto borra **todas** sus líneas, porque el procedimiento de
  Oracle borra por código de ítem

La misma regla está probada en el servidor, sin navegador, en
`../server/pruebas/lotes.test.js` (`cd ../server && npm test`). Esas son más
rápidas y son las que conviene correr mientras se programa.

## Cómo están escritas

Se busca por **texto visible y roles** (`contains('button', 'Buscar cliente')`,
`[role="dialog"]`), no por clases CSS. El diseño de esta aplicación cambia a
menudo; las pruebas tienen que sobrevivir a eso y fallar solo cuando se rompe
el comportamiento.

## Si Cypress no arranca en Windows

Puede fallar con `bad option: --smoke-test`. Es el binario, no la suite:

```
npx cypress cache clear
npx cypress install --force
npx cypress verify
```

Si sigue igual, suele ser el antivirus bloqueando el ejecutable de Electron en
`%LOCALAPPDATA%\Cypress\Cache`.
