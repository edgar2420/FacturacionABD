# QA — Suite E2E con Cypress

Pruebas de extremo a extremo para **ABDFacturacion**. Sirven para dos cosas:

1. **Saber qué tiene el sistema** — el spec de inventario recorre cada pantalla y
   genera un informe con los campos, botones y tablas que realmente existen.
2. **Detectar regresiones** — verificar que login, búsquedas y pantallas siguen
   funcionando después de cada cambio.

> ⚠️ Estas pruebas manejan un navegador real contra una aplicación desplegada.
> **Nunca las ejecutes contra producción** (`aplicaciones.lababd.com.bo`): el login
> queda auditado y las pruebas de escritura emiten facturas y recibos reales.

---

## Requisitos

- Node.js 18+ (probado con Node 24)
- La aplicación desplegada en Payara y accesible por HTTP
- Un usuario de pruebas válido en la base de datos

## Instalación

```bash
cd qa
npm install          # descarga Cypress (~300 MB la primera vez)
cp cypress.env.example.json cypress.env.json
```

Edita `cypress.env.json` con el usuario y la clave de pruebas.
Ese archivo está en `.gitignore` — **no se versiona**.

## Apuntar a un entorno

La URL base sale de `CYPRESS_BASE_URL`; por defecto es
`http://localhost:8080/ABDFacturacion`.

```bash
# Windows PowerShell
$env:CYPRESS_BASE_URL = "http://localhost:8080/ABDFacturacion"

# Git Bash / Linux
export CYPRESS_BASE_URL="http://localhost:8080/ABDFacturacion"
```

## Ejecución

| Comando | Qué hace |
|---|---|
| `npm run cy:open` | Abre la interfaz de Cypress para correr y depurar visualmente |
| `npm run qa:humo` | Solo disponibilidad y login. No necesita datos de negocio |
| `npm run qa:inventario` | Genera `qa/reportes/inventario.md` con lo que hay en cada pantalla |
| `npm run qa:lectura` | Toda la suite en modo **solo lectura** (por defecto) |
| `npm run qa:completo` | Incluye las pruebas que **graban en Oracle** |

---

## Qué cubre cada spec

| Spec | Cubre | ¿Escribe en la BD? |
|---|---|---|
| `00-disponibilidad.cy.js` | El WAR responde, el login renderiza, PrimeFaces carga, y las 6 vistas protegidas redirigen al login sin sesión | No. No necesita credenciales |
| `01-login.cy.js` | Clave incorrecta, usuario inexistente, campos vacíos, login válido, cookie `JSESSIONID`, logout | No, pero deja registro en la auditoría de login |
| `02-inventario.cy.js` | Recorre las 6 pantallas y anota qué controles existen → informe en Markdown | No |
| `03-facturacion.cy.js` | Filtros de Facturación y Cobranzas, búsqueda vacía y de factura inexistente, ausencia de errores 500 | Solo el bloque `ESCRITURA` |
| `04-recibos.cy.js` | Búsqueda de clientes, selección, panel de deudas, selectores de moneda/banco | Solo el bloque `ESCRITURA` |
| `05-pedidos.cy.js` | Buscadores de cliente, vendedor y producto; flujo completo de alta de pedido | Solo el bloque `ESCRITURA` |
| `06-consultas.cy.js` | Mis Pedidos e Impresión de Recibos | No |

### El interruptor de escrituras

Todos los bloques marcados `(ESCRITURA)` están **desactivados por defecto**.
Se habilitan solo con:

```bash
npx cypress run --env permitirEscrituras=true
```

Requieren además datos reales del entorno de pruebas en `cypress.env.json`
(`clienteBusqueda`, `vendedorBusqueda`, `productoBusqueda`, `facturaPrueba`).

---

## Cómo están escritas (JSF no es una SPA)

Tres detalles que hacen distinta esta suite de una Cypress normal:

**1. Los `id` llevan dos puntos.** JSF genera `formulario:componente`, y `:` es un
carácter especial en CSS. Por eso existe `cy.jsf()`:

```js
cy.jsf('recibosForm:datoBusqueda')   // -> cy.get('[id="recibosForm:datoBusqueda"]')
```

**2. Casi todo es AJAX de PrimeFaces.** Después de un clic hay que esperar a que la
cola se vacíe, no a un `cy.wait(1000)` arbitrario:

```js
cy.jsf('recibosForm:buscarClienteButton').click();
cy.esperarAjax();
```

**3. La sesión la controla un `PhaseListener`.** `security.AutenticationListener`
redirige a `login.xhtml` cualquier vista bajo `/views/` sin sesión. `cy.login()`
usa `cy.session()` para cachear la cookie y revalida abriendo una vista protegida.

Comandos disponibles en `cypress/support/commands.js`:

| Comando | Para qué |
|---|---|
| `cy.jsf(id)` | Selecciona por id de cliente JSF |
| `cy.existeJsf(id)` | Devuelve `true`/`false` sin fallar |
| `cy.esperarAjax()` | Espera a que la cola AJAX de PrimeFaces quede vacía |
| `cy.loginUI(u, p)` | Login por la interfaz |
| `cy.login(u, p)` | Login cacheado con `cy.session` |
| `cy.abrirVista(archivo)` | Abre una vista protegida ya autenticado |
| `cy.textoMensajes()` | Texto de los `p:growl` / `p:messages` |

---

## Limitaciones conocidas

- **Los selectores dependen de los `id` de las vistas.** Están sacados de
  `web/views/*.xhtml`; si se renombra un `id`, hay que actualizar
  `cypress/fixtures/pantallas.json`.
- **Los controles que aparecen tras una búsqueda** (panel de deudas, tabla de
  productos) no siempre están en el DOM inicial. Los tests lo contemplan con
  `cy.existeJsf()` y lo registran en el log, en lugar de fallar.
- **Los PDF de Jasper** se generan en el servidor (`db.repGenPath`) y se sirven
  desde `views/facturas/`. La suite no valida su contenido, solo que la acción no
  produzca un error.
- **No hay datos semilla.** Las búsquedas usan criterios genéricos (`"A"`) salvo que
  definas los tuyos en `cypress.env.json`.
- **Esta suite todavía no se ha ejecutado contra un entorno real.** Fue escrita a
  partir del código de las vistas y los beans. La primera corrida seguramente
  requiera ajustar tiempos y algún selector.
