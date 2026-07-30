/**
 * API de Pedidos.
 *
 * Expone en HTTP los mismos procedimientos de ABD.PCK_OPERACIONES que usa la
 * aplicacion JSF. No duplica reglas de negocio: valida las entradas y delega.
 */
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const config = require('./config');
const { iniciarPool, cerrarPool } = require('./db');
const plsql = require('./plsql');
const reglas = require('./reglas');

const app = express();

app.use(express.json());
app.use(cors({ origin: config.origenWeb, credentials: true }));
app.use(
  session({
    name: 'pedidos.sid',
    secret: config.secretoSesion,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 30 * 60 * 1000 }
  })
);

/** Envuelve un handler async para que los errores lleguen al middleware final. */
const asincrono = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/** Corta la peticion si no hay sesion iniciada. */
function exigeSesion(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Sesion no iniciada' });
  }
  next();
}

// --- Salud ------------------------------------------------------------------

app.get('/api/salud', (req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

// --- Sesion -----------------------------------------------------------------

app.post(
  '/api/login',
  asincrono(async (req, res) => {
    const { usuario, password } = req.body || {};
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contrasena son obligatorios' });
    }

    const valido = await plsql.validarUsuario(usuario, password);
    if (!valido) {
      return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
    }

    let datos = await plsql.obtenerUsuario(usuario);

    if (!datos) {
      // La cuenta paso la validacion de la base pero no esta en ABD.USUARIOS,
      // que es de donde sale el almacen. Es el caso de "abd", el duenio del
      // esquema. Solo se deja pasar si hay ALMACEN_DEV configurado.
      if (!config.almacenDev) {
        return res.status(401).json({ error: 'No existe usuario' });
      }

      console.warn(
        `[dev] "${usuario}" no esta en ABD.USUARIOS; se le asigna el almacen ${config.almacenDev}`
      );
      datos = {
        login: usuario,
        nombre: usuario,
        rol: 'DEV',
        almacen: config.almacenDev,
        imprimeFactura: false,
        modoDesarrollo: true
      };
    }

    req.session.usuario = datos;
    res.json(datos);
  })
);

app.get('/api/sesion', (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ error: 'Sesion no iniciada' });
  res.json(req.session.usuario);
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// --- Catalogos --------------------------------------------------------------

app.get(
  '/api/clientes',
  exigeSesion,
  asincrono(async (req, res) => {
    const { valor = '', tipo = 'N' } = req.query;
    if (!reglas.TIPOS_BUSQUEDA_CLIENTE.includes(tipo)) {
      return res.status(400).json({ error: `Tipo de busqueda no valido: ${tipo}` });
    }
    res.json(await plsql.buscarClientes(valor, tipo));
  })
);

app.get(
  '/api/clientes/:codigo',
  exigeSesion,
  asincrono(async (req, res) => {
    const cliente = await plsql.obtenerCliente(req.params.codigo);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  })
);

app.get(
  '/api/vendedores',
  exigeSesion,
  asincrono(async (req, res) => {
    const { valor = '', tipo = 'N' } = req.query;
    if (!reglas.TIPOS_BUSQUEDA_VENDEDOR.includes(tipo)) {
      return res.status(400).json({ error: `Tipo de busqueda no valido: ${tipo}` });
    }
    res.json(await plsql.buscarVendedores(valor, tipo));
  })
);

app.get(
  '/api/productos',
  exigeSesion,
  asincrono(async (req, res) => {
    const { valor = '', tipo = 'N', cliente, fechaEntrega } = req.query;

    if (!reglas.TIPOS_BUSQUEDA_PRODUCTO.includes(tipo)) {
      return res.status(400).json({ error: `Tipo de busqueda no valido: ${tipo}` });
    }
    if (!cliente) return res.status(400).json({ error: 'Falta el cliente' });

    // El precio depende del cliente y de la fecha de entrega.
    const fecha = reglas.validarFechaEntrega(fechaEntrega);
    if (!fecha.ok) return res.status(400).json({ error: fecha.mensaje });

    const productos = await plsql.obtenerProductos({
      busqueda: valor,
      tipo,
      almacen: req.session.usuario.almacen,
      cliente,
      fechaEntrega
    });

    res.json(productos);
  })
);

// --- Pedidos ----------------------------------------------------------------

app.post(
  '/api/pedidos',
  exigeSesion,
  asincrono(async (req, res) => {
    const { cliente, nombreCliente, vendedor, fechaEntrega, producto, cantidad } = req.body || {};

    if (!cliente || !vendedor || !producto) {
      return res.status(400).json({ error: 'Faltan cliente, vendedor o producto' });
    }

    const fecha = reglas.validarFechaEntrega(fechaEntrega);
    if (!fecha.ok) return res.status(400).json({ error: fecha.mensaje });

    const cant = reglas.validarCantidad(cantidad, producto.saldo, producto.nombre);
    if (!cant.ok) return res.status(400).json({ error: cant.mensaje });

    const r = await plsql.crearPedido({
      almacen: req.session.usuario.almacen,
      cliente,
      nombreCliente,
      fechaEntrega,
      login: req.session.usuario.login,
      vendedor,
      codItem: producto.producto,
      cantidad: Number(cantidad),
      unidad: producto.unidad,
      porcDescuento: 0,
      lote: producto.lote,
      fechaVencimiento: producto.fechaVencimiento
    });

    if (!r.ok) return res.status(422).json({ error: r.mensaje || 'No se pudo crear el pedido' });

    const detalle = await plsql.obtenerDetallePedido(
      req.session.usuario.almacen,
      r.nroPedido
    );

    res.status(201).json({ nroPedido: r.nroPedido, mensaje: r.mensaje, detalle });
  })
);

app.post(
  '/api/pedidos/:nro/items',
  exigeSesion,
  asincrono(async (req, res) => {
    const { cliente, producto, cantidad } = req.body || {};
    if (!cliente || !producto) return res.status(400).json({ error: 'Faltan cliente o producto' });

    const cant = reglas.validarCantidad(cantidad, producto.saldo, producto.nombre);
    if (!cant.ok) return res.status(400).json({ error: cant.mensaje });

    const almacen = req.session.usuario.almacen;

    const r = await plsql.adicionarItem({
      almacen,
      nroPedido: req.params.nro,
      cliente,
      codItem: producto.producto,
      cantidad: Number(cantidad),
      unidad: producto.unidad,
      porcDescuento: 0,
      login: req.session.usuario.login,
      lote: producto.lote,
      fechaVencimiento: producto.fechaVencimiento
    });

    if (!r.ok) return res.status(422).json({ error: r.mensaje || 'No se pudo adicionar el item' });

    const detalle = await plsql.obtenerDetallePedido(almacen, req.params.nro);
    res.json({ nroLinea: r.nroLinea, mensaje: r.mensaje, detalle });
  })
);

app.delete(
  '/api/pedidos/:nro/items/:item',
  exigeSesion,
  asincrono(async (req, res) => {
    const almacen = req.session.usuario.almacen;

    const r = await plsql.eliminarItem({
      almacen,
      nroPedido: req.params.nro,
      item: req.params.item
    });

    if (!r.ok) return res.status(422).json({ error: r.mensaje || 'No se pudo eliminar el item' });

    const detalle = await plsql.obtenerDetallePedido(almacen, req.params.nro);
    res.json({ mensaje: r.mensaje, detalle });
  })
);

app.get(
  '/api/pedidos/:nro',
  exigeSesion,
  asincrono(async (req, res) => {
    const almacen = req.session.usuario.almacen;
    const [pedido, detalle] = await Promise.all([
      plsql.obtenerPedido(almacen, req.params.nro),
      plsql.obtenerDetallePedido(almacen, req.params.nro)
    ]);

    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ pedido, detalle });
  })
);

app.post(
  '/api/pedidos/:nro/terminar',
  exigeSesion,
  asincrono(async (req, res) => {
    const almacen = req.session.usuario.almacen;

    const r = await plsql.terminarPedido({
      almacen,
      nroPedido: req.params.nro,
      login: req.session.usuario.login
    });

    if (!r.ok) return res.status(422).json({ error: r.mensaje || 'No se pudo terminar el pedido' });

    const [pedido, detalle] = await Promise.all([
      plsql.obtenerPedido(almacen, req.params.nro),
      plsql.obtenerDetallePedido(almacen, req.params.nro)
    ]);

    res.json({ mensaje: r.mensaje, pedido, detalle });
  })
);

app.post(
  '/api/pedidos/:nro/pagar',
  exigeSesion,
  asincrono(async (req, res) => {
    const { pagado, tipoDocPago, banco, razonSocial, nit } = req.body || {};

    if (!pagado) return res.status(400).json({ error: 'Indique si el pedido fue pagado' });

    // Solo la transferencia exige banco (PedidosBean.onDocPagoChanged).
    if (pagado === 'Si' && reglas.requiereBanco(tipoDocPago) && !banco) {
      return res.status(400).json({ error: 'Seleccione el banco para la transferencia' });
    }

    const almacen = req.session.usuario.almacen;

    const r = await plsql.pagarPedido({
      almacen,
      nroPedido: req.params.nro,
      login: req.session.usuario.login,
      formaPago: reglas.formaPagoDesde(pagado),
      tipoPago: pagado === 'Si' ? tipoDocPago : null,
      banco: pagado === 'Si' ? banco : null,
      razonSocial,
      nit
    });

    if (!r.ok) return res.status(422).json({ error: r.mensaje || 'No se pudo pagar el pedido' });

    const [pedido, detalle] = await Promise.all([
      plsql.obtenerPedido(almacen, req.params.nro),
      plsql.obtenerDetallePedido(almacen, req.params.nro)
    ]);

    res.json({ mensaje: r.mensaje, pedido, detalle });
  })
);

// --- Errores ----------------------------------------------------------------

app.use((err, req, res, _next) => {
  console.error('[error]', err);
  // No devolvemos la traza de Oracle al navegador.
  res.status(500).json({ error: 'Error interno del servidor' });
});

// --- Arranque ---------------------------------------------------------------

async function arrancar() {
  await iniciarPool();
  app.listen(config.puerto, () => {
    console.log(`API de Pedidos escuchando en http://localhost:${config.puerto}`);
  });
}

if (require.main === module) {
  arrancar().catch((e) => {
    console.error('No se pudo arrancar el servidor:', e.message);
    process.exit(1);
  });
}

process.on('SIGINT', async () => {
  await cerrarPool();
  process.exit(0);
});

module.exports = { app, arrancar };
