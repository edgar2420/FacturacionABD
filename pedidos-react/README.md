# Pedidos ABD — versión React

Migración del módulo **Pedidos** de la aplicación JSF a una interfaz web moderna.

Es un proyecto **independiente**: no toca ni depende del WAR actual (`ABDFacturacion`).
Ambos pueden convivir apuntando a la misma base de datos Oracle.

```
pedidos-react/
├── server/   API en Node/Express que llama a ABD.PCK_OPERACIONES
└── web/      Interfaz en React + TypeScript + Vite
```

---

## Idea central: la lógica no se reescribió

Las reglas de negocio de Pedidos **no están en Java**, están en Oracle. El
`PedidosBean` solo orquesta llamadas a `ABD.PCK_OPERACIONES`. Esta migración hace
exactamente lo mismo desde Node:

| Acción | Procedimiento Oracle | Antes | Ahora |
|---|---|---|---|
| Buscar productos con precio | `F_OBTENER_PRODUCTOS` | `PedidosDao.getProductos` | `server/src/plsql.js` |
| Crear pedido + 1ª línea | `F_CREAR_PEDIDO` | `PedidosDao.crearPedido` | `POST /api/pedidos` |
| Adicionar línea | `F_CREAR_DETALLE_PEDIDO` | `PedidosDao.crearDetallePedido` | `POST /api/pedidos/:nro/items` |
| Eliminar línea | `F_ELIMINAR_DETALLE_PEDIDO` | `PedidosDao.eliminarDetallePedido` | `DELETE /api/pedidos/:nro/items/:item` |
| Leer cabecera / detalle | `F_OBTENER_PEDIDO`, `F_OBTENER_DET_PEDIDO` | `PedidosDao.getPedido` | `GET /api/pedidos/:nro` |
| Cerrar pedido | `F_TERMINAR_PEDIDO` | `PedidosDao.terminarPedido` | `POST /api/pedidos/:nro/terminar` |
| Registrar el pago | `F_PAGAR_PEDIDO` | `PedidosDao.pagarPedido` | `POST /api/pedidos/:nro/pagar` |
| Autenticar | `F_VALIDA_USUARIO` | `LoginDao.login` | `POST /api/login` |

**Ninguna regla de negocio se duplicó en JavaScript.** Lo único que se portó son
las validaciones que el bean hacía *antes* de llamar a Oracle, y están en
`reglas.js` / `reglas.ts` con referencia al método original.

### Reglas portadas de `PedidosBean.java`

| Regla | Origen |
|---|---|
| La fecha de entrega no puede ser anterior a hoy | `crearPedido()` |
| Formato de fecha estricto `dd/MM/yyyy` (rechaza 31/02) | `SimpleDateFormat.setLenient(false)` |
| La cantidad no puede superar el saldo del lote | `crearPedido()` |
| `Si → Contado`, `En → CEntrega`, `No → CxC` | `pagarPedido()` |
| Solo Transferencia pide banco; lista según moneda | `onDocPagoChanged()` |
| Total del pedido = suma de `netoBs` | `getTotalPrecio()` |
| Clientes: solo `CODIGO_CLIENTE = 'SI'` | `PedidosDao.buscarCliente` |
| Vendedores: `CODIGO_EMPLEADO='SI'` y `CODIGO_VENDEDOR` no nulo | `buscarVendedoresFiltro` |

---

## Lo que cambia para el usuario

El JSF actual controlaba la pantalla con ~14 banderas booleanas
(`dataBusqueda`, `dataClientes`, `dataPedidoCrear`, `dataPedidoTerminar`…), lo que
hacía que aparecieran y desaparecieran paneles sin un orden claro.

La versión React lo convierte en **cuatro pasos explícitos** con barra de progreso:

```
1. Cliente  →  2. Vendedor + fecha  →  3. Productos  →  4. Pago
```

Además:

- **Total siempre visible** en una barra fija al pie, con el número de pedido y la
  cantidad de ítems.
- **Tema claro y oscuro**, siguiendo el del sistema y con interruptor manual.
- **Pensado para tablet y celular**, que es como lo usan los vendedores: tablas con
  desplazamiento propio, botones grandes, sin zoom horizontal.
- **Avisos flotantes** en lugar de los `p:growl` que tapaban el formulario.
- **Validación mientras se escribe**: la cantidad se compara contra el saldo del
  lote antes de permitir enviar.

---

## Puesta en marcha

Requisitos: Node.js 18+ y acceso a la base Oracle.

### 1. Backend

```bash
cd pedidos-react/server
npm install
cp .env.example .env      # y completar ORACLE_PASSWORD
npm run dev               # http://localhost:3001
```

#### El modo Thick es obligatorio con esta base

El usuario `ABD` de Oracle tiene la contrasena almacenada con el **verificador
antiguo (10G)**. El modo Thin de `oracledb` no lo soporta y falla con:

```
NJS-116: password verifier type 0x939 is not supported by node-oracledb in Thin mode
```

Por eso hay que apuntar `ORACLE_CLIENT_DIR` al Oracle Instant Client, lo que activa
el modo Thick (usa OCI, igual que `ojdbc6` en el WAR original, que si acepta ese
formato). Verificado funcionando con Instant Client 23.26 en Windows.

La alternativa seria que el DBA regenere el verificador con
`ALTER USER abd IDENTIFIED BY ...` teniendo `SQLNET.ALLOWED_LOGON_VERSION_SERVER=12`,
pero eso afecta tambien al WAR en produccion: no conviene tocarlo solo por esto.

### 2. Frontend

```bash
cd pedidos-react/web
npm install
npm run dev               # http://localhost:5173
```

Vite redirige `/api` al backend, así que el navegador ve un solo origen y la cookie
de sesión viaja sin configuración extra de CORS.

---

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/login` | Valida con `F_VALIDA_USUARIO` y abre sesión |
| `GET` | `/api/sesion` | Usuario actual (para recuperar la sesión al recargar) |
| `POST` | `/api/logout` | Cierra la sesión |
| `GET` | `/api/clientes?valor=&tipo=N\|R\|C\|O` | Busca clientes |
| `GET` | `/api/vendedores?valor=&tipo=N\|O` | Busca vendedores |
| `GET` | `/api/productos?valor=&tipo=&cliente=&fechaEntrega=` | Productos con precio y saldo |
| `POST` | `/api/pedidos` | Crea el pedido con su primera línea |
| `POST` | `/api/pedidos/:nro/items` | Adiciona una línea |
| `DELETE` | `/api/pedidos/:nro/items/:item` | Elimina una línea |
| `GET` | `/api/pedidos/:nro` | Cabecera + detalle |
| `POST` | `/api/pedidos/:nro/terminar` | Cierra el pedido |
| `POST` | `/api/pedidos/:nro/pagar` | Registra la forma de pago |

Todas menos `/api/login` y `/api/salud` exigen sesión iniciada.

---

## Mejoras respecto al original

Se corrigieron dos cosas al portar, sin cambiar el comportamiento esperado:

1. **Inyección SQL.** `PedidosDao.buscarCliente` concatenaba el texto del usuario
   dentro del HQL (`like '%"+valor+"%'`). La versión Node usa *bind variables*.
2. **Llamada mal formada.** `PedidosDao.eliminarDetallePedido` arma la cadena
   `"{? = call ...F_ELIMINAR_DETALLE_PEDIDO(?,?,?,?)"` — sin la llave de cierre.
   Aquí se llama correctamente.

Ambos siguen presentes en el WAR original; no los toqué porque el encargo era no
mezclar nada. Vale la pena corregirlos allá en otro momento.

---

## Entrar con una cuenta que no esta en ABD.USUARIOS

El login exige que el usuario tenga fila en `ABD.USUARIOS`, porque de
`USUARIOS.UNI_NEG` sale el almacen con el que se crea el pedido. Cuentas como
`abd` (el dueño del esquema) no estan ahi y reciben `401 No existe usuario`.

Para probar la interfaz sin dar de alta un usuario, define en el `.env`:

```
ALMACEN_DEV=AL-VEN-ABD-FAB
```

Con eso esas cuentas entran usando ese almacen, y la sesion queda marcada con
`modoDesarrollo: true`. **Dejar vacio en cualquier despliegue real.**

---

## Hallazgo de seguridad en F_VALIDA_USUARIO

Al probar el login contra la base real se encontro que
`ABD.PCK_OPERACIONES.F_VALIDA_USUARIO` **devuelve `'1'` (valido) para cualquier
contraseña** cuando el usuario no tiene fila en la tabla `CLAVES`. El cuerpo de
la funcion hace:

```sql
BEGIN
   SELECT CLAVE INTO v_clave FROM CLAVES WHERE LOGIN = p_usuario;
EXCEPTION WHEN OTHERS THEN v_clave := NULL;
END;
...
IF x_encriptado != v_clave THEN v_resp := '0'; END IF;
```

Si `v_clave` es `NULL`, la comparacion `x_encriptado != NULL` no da verdadero
sino *desconocido*, el `IF` no se ejecuta y `v_resp` se queda en su valor
inicial `'1'`.

Consecuencia: **cualquier usuario de `USUARIOS` que no tenga fila en `CLAVES`
entra con la contraseña que sea**, tanto en esta aplicacion como en el WAR JSF
actual. La unica barrera hoy es que el login exista en `USUARIOS`
(`LoginBean` comprueba `findMyUsuario`).

No se corrigio aqui porque la solucion esta en el PL/SQL, fuera del alcance de
este proyecto. La correccion seria inicializar `v_resp := '0'` y validar que
`v_clave IS NOT NULL`. Conviene revisar con quien administre la base cuantos
usuarios activos no tienen fila en `CLAVES`.

---

## Estado y limitaciones

- **Probado contra Oracle real solo en lectura.** Verificado contra
  `192.168.0.5/PDBABD`: login, busqueda de clientes, de vendedores y de
  productos (con precio, lote, vencimiento y saldo) responden correctamente.
- **El camino de escritura NO se probo**: crear pedido, adicionar y eliminar
  lineas, terminar y pagar. Hacerlo contra esa base generaria pedidos reales.
  Conviene probarlo primero en un entorno de pruebas.
- El orden de las columnas de los cursores (`F_OBTENER_PEDIDO` devuelve 25,
  `F_OBTENER_DET_PEDIDO` 18) se tomó de los constructores de `objetos/*.java`.
  Si el paquete cambia, hay que ajustar `plsql.js`.
- Falta el módulo **Mis Pedidos** (`F_OBTENER_PEDIDOS`): el encargo era solo
  Pedidos. El procedimiento ya está identificado si se quiere agregar.
- No hay impresión de PDF: los reportes Jasper siguen viviendo en el WAR.
