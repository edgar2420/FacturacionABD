# ABDFacturacion

Sistema web de **facturación, cobranzas y pedidos** para ABD (Laboratorios ABD, Bolivia).
Aplicación Java EE (JSF + PrimeFaces + Hibernate) que emite facturas electrónicas con QR,
registra recibos de cobranza y gestiona pedidos, generando los comprobantes en PDF con
JasperReports contra una base de datos Oracle.

- **Artefacto desplegable:** `ABDFacturacion.war`
- **URL de producción:** `https://aplicaciones.lababd.com.bo:8181/ABDFacturacion/`

---

## Stack tecnológico

| Componente | Versión / Detalle |
|---|---|
| Lenguaje | Java 8 (`javac.source/target = 1.8`) |
| Plataforma | Java EE 7 Web (`web-app 3.1`, JSF 2.2) |
| Vista | JSF (Facelets) + **PrimeFaces 6.0** + PrimeFaces Mobile + Font Awesome |
| Persistencia | **Hibernate 4.3.10** con mapeos XML (`*.hbm.xml`) |
| Base de datos | **Oracle 12c** (PDB `PDBABD`), driver `ojdbc6` |
| Reportes | **JasperReports 5.6** (+ iText, PDFBox/FontBox, JFreeChart, POI) |
| Códigos QR | **ZXing 2.1** |
| Servidor | **Payara 5 / GlassFish** (`j2ee.server.type=pfv5ee8`) |
| Build | **Apache Ant** (proyecto NetBeans, `build.xml` + `nbproject/`) |

---

## Estructura del repositorio

```
├── build.xml               # Script Ant (NetBeans) — genera ABDFacturacion.war
├── nbproject/              # Config del proyecto NetBeans (classpath, libs, servidor)
├── src/
│   ├── conf/MANIFEST.MF
│   └── java/
│       ├── hibernate.cfg.xml      # Conexión Oracle + lista de mapeos
│       ├── hibernate.reveng.xml   # Config de ingeniería inversa
│       ├── beans/                 # Managed Beans JSF (capa de presentación)
│       ├── dao/                   # Acceso a datos (HQL / SQL nativo / PL-SQL)
│       ├── model/                 # Entidades Hibernate + sus .hbm.xml
│       ├── objetos/               # DTOs / objetos de transferencia
│       ├── config/                # Constantes y properties por ambiente
│       ├── security/              # Listener de autenticación (JSF PhaseListener)
│       ├── servlet/               # Logout
│       ├── util/                  # Utilidades (Faces, Hibernate, sesión)
│       └── reportes/              # Plantillas JasperReports (.jrxml / .jasper)
├── web/
│   ├── login.xhtml         # Página de bienvenida (welcome-file)
│   ├── views/              # Pantallas de la aplicación
│   │   ├── facturas/       # PDFs generados (salida)
│   │   └── qr/
│   ├── resources/          # CSS, imágenes, Font Awesome
│   └── WEB-INF/            # web.xml, faces-config.xml, glassfish-web.xml
└── test/
```

---

## Módulos funcionales

Cada módulo sigue el patrón **vista `.xhtml` → `*Bean.java` → `*Dao.java` → Oracle**.

### 1. Autenticación y seguridad
- `LoginBean` / `LoginDao` — login, roles (`SegRoles`, `SegRolesUsuarios`), control de claves
  (`AudControlPassword`) y **auditoría de login con geolocalización** (`AudControlLoginGeo`:
  la vista de login captura lat/lng del navegador).
- `security.AutenticationListener` — PhaseListener que bloquea el acceso a vistas sin sesión válida.
- `servlet.Logout` — invalidación de sesión (`/Logout`).
- Detecta navegador móvil vs. escritorio y redirige a la vista correspondiente.

### 2. Facturación
- Vistas: `facturacion.xhtml`, `facturacion_1.xhtml`
- `FacturasBean` / `PreFacturasBean` → `FacturasDao`
- Emisión de facturas y prefacturas; entidades `Facturas`, `LinFacturas`, `FacturasDgi`
  (datos de impuestos), `FacturasQr`, `Items`, `Personas`, `Leyenda`, `Sucursal`.

### 3. Facturación electrónica / QR
- `QRGeneratorDao` (ZXing) genera la imagen QR de la factura; se almacena en el recurso
  compartido definido por `db.imgQRPath` y se referencia desde la vista `qr.xhtml`.

### 4. Cobranzas / Recibos
- Vistas: `cobranzas.xhtml`, `cobranzas_1.xhtml`, `recibos.xhtml`, `impRecibos.xhtml`
- `RecibosBean`, `ImpRecibosBean` → `RecibosDao`
- Búsqueda de deuda por cliente, registro de pagos (con validación de no exceder lo adeudado),
  manejo de bancos y moneda dólar, e impresión de recibos en dos formatos: **carta** y **rollo**.

### 5. Pedidos
- Vistas: `pedidos.xhtml`, `MisPedidos.xhtml`
- `PedidosBean` (~1000 líneas) / `MisPedidosBean` → `PedidosDao`, `MisPedidosDao`
- Objetos: `Pedido`, `DetallePedido`, `DetalleProductos`, `DetalleCuentasXCobrar`, `DetalleRecibos`
- Alta de pedidos con selección de vendedor y cliente, búsqueda de productos con precios,
  descuentos, tipo de pago **contra entrega**, eliminación de líneas de detalle y validaciones
  de fecha. `MisPedidos` es el reporte de consulta del vendedor.

### 6. Reportes (`src/java/reportes/`)
`ReportesDao` compila/llena las plantillas Jasper y publica el PDF en `web/views/facturas/`.

| Plantilla | Uso |
|---|---|
| `rptFact_SFE` (+ `rptFac_SFE_subreport`) | Factura tamaño carta |
| `rptFactRollo_SFE` (+ subreport) | Factura en rollo (impresora térmica) |
| `rptBillFactMobil_SFE` / `rptBillFactMobilSFE` (+ subreports) | Factura desde móvil |
| `rptRecibo` (+ subreport) | Recibo de cobranza tamaño carta |
| `rptReciboRollo` (+ subreport) | Recibo de cobranza en rollo |

Los `.jrxml` son la fuente editable (JasperSoft Studio / iReport); los `.jasper` son la versión
compilada que consume la aplicación — **al modificar un `.jrxml` hay que recompilarlo y commitear
ambos archivos**. Las carpetas `reportes/Back*` contienen respaldos históricos de plantillas.

---

## Configuración

### Conexión a base de datos
Definida **en dos lugares** que deben mantenerse consistentes:

1. `src/java/hibernate.cfg.xml` — sesión Hibernate (dialecto Oracle, URL thin, usuario/clave).
2. `src/java/config/constantes.properties` — usado por `Constantes` / `Parametros` / `MyUtil`
   para conexiones directas y rutas del sistema.

Variantes de ambiente incluidas en `src/java/config/`:

| Archivo | Ambiente |
|---|---|
| `constantes.properties` | Activo (el que lee la aplicación) |
| `constantes_ABD.properties` | Servidor de producción ABD |
| `constantes_contabo.properties` | Servidor de pruebas (Contabo) |
| `constantes_local.properties` / `constantes _actual_local.properties` | Desarrollo local |
| `constantes_mails.properties` | Envío de correos |
| `constantes_validacion.properties` | Reglas de validación |

Claves relevantes de `constantes.properties`:

- `db.host`, `db.sid`, `db.port`, `db.user`, `db.pasw` — conexión Oracle
- `db.repPath` — ruta a las plantillas `.jasper` desplegadas en el servidor
- `db.repGenPath` — carpeta donde se escriben los PDF generados
- `db.imgQRPath` / `upload.dir` — almacenamiento de imágenes QR y adjuntos
- `db.baseURL`, `db.basePathLogin`, `as.host`, `as.port`, `as.securePort` — URLs públicas
- `debug.flag` — `1` activa mensajes de error detallados (Java y PL/SQL)

> ⚠️ **Credenciales en el repositorio.** Tanto `hibernate.cfg.xml` como los `constantes*.properties`
> tienen usuario y contraseña de la base de datos en texto plano, y `web.xml` incluye las llaves de
> reCAPTCHA. Conviene externalizarlos (JNDI DataSource en Payara o variables de entorno) antes de
> abrir el repositorio a más personas.

### Dependencias (JARs)
El proyecto **no usa Maven ni Gradle**: `nbproject/project.properties` referencia los `.jar` por
ruta absoluta en la máquina del desarrollador
(`C:\Users\<usuario>\Documents\Instaladores\Librerias\ABDFacturacion\`). En una máquina nueva hay
que copiar esa carpeta de librerías y reajustar las rutas en NetBeans.

Librerías principales: `primefaces-6.0`, `all-themes-1.0.10`, `hibernate-core-4.3.10.Final`,
`ojdbc6`, `jasperreports-5.6.0` (+ fonts, functions, chart-themes, extensions), `iText-2.1.7`,
`pdfbox/fontbox-1.8.7`, `zxing-2.1`, `poi-3.17`, `jfreechart-1.0.12`, `joda-time-2.4`,
`groovy-3.0.8`, `commons-*`, `dom4j`, `javassist`, `jboss-logging`, `antlr`.

---

## Compilación y despliegue

Requisitos: JDK 8, Apache Ant, Payara 5 (o GlassFish equivalente), Oracle 12c accesible,
y la carpeta de librerías `.jar`.

```bash
ant clean          # limpia build/ y dist/
ant dist           # compila y empaqueta dist/ABDFacturacion.war
```

Desde NetBeans: *Clean and Build* y *Run* despliegan directamente en el Payara configurado.
El `.war` resultante se despliega en `$PAYARA/glassfish/domains/domain1/applications/ABDFacturacion`.

`build/`, `dist/` y `nbproject/` están en `.gitignore` (aunque `nbproject/` fue versionado antes
de esa regla y sigue siendo rastreado).

---

## Convenciones de este repositorio

- **Rama principal:** `master`. El trabajo se hace en ramas por tema, con el prefijo
  `FacturacionABD/`: `FacturacionABD/pedidos`, `FacturacionABD/pedidos-reporte`,
  `FacturacionABD/recibos`, `FacturacionABD/recibos_rollos`.
- **Mensajes de commit:** en español, describiendo el cambio funcional
  (p. ej. *"Se adiciona Tipo Pago Contra entrega y en proceso se adiciona descuento a este tipo pago"*).
- Al tocar reportes, versionar el `.jrxml` **y** el `.jasper` recompilado.
