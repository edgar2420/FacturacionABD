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
const lotes = require('./lotes');

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

/** Tamano de pagina por defecto y tope, para no devolver listados enormes. */
const POR_PAGINA = 15;
const POR_PAGINA_MAX = 50;

/** Lee y acota los parametros de paginacion de la query. */
function paginacion(req) {
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const porPagina = Math.min(POR_PAGINA_MAX, Math.max(1, Number(req.query.porPagina) || POR_PAGINA));
  return { pagina, porPagina };
}

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
    res.json(await plsql.buscarClientes(valor, tipo, paginacion(req)));
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
    res.json(await plsql.buscarVendedores(valor, tipo, paginacion(req)));
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

    const { filas, truncado } = await plsql.obtenerProductosPorLote({
      busqueda: valor,
      tipo,
      almacen: req.session.usuario.almacen,
      cliente,
      fechaEntrega
    });

    // Una fila por producto con el saldo de todos sus lotes sumado, ordenadas
    // por el lote que vence antes y, a igual fecha, por el saldo mas bajo.
    const productos = lotes.ordenarProductos(lotes.agruparPorProducto(filas));

    const { pagina, porPagina } = paginacion(req);
    const desde = (pagina - 1) * porPagina;

    res.json({
      items: productos.slice(desde, desde + porPagina),
      total: productos.length,
      pagina,
      porPagina,
      truncado
    });
  })
);

// --- Pedidos ----------------------------------------------------------------

/**
 * Vuelve a leer un producto de Oracle con sus lotes frescos.
 *
 * Se relee a proposito en vez de confiar en lo que manda el navegador: entre
 * que el vendedor busco el producto y le da a "Adicionar" pueden pasar minutos
 * y otro vendedor puede haberse llevado el lote. El reparto tiene que hacerse
 * contra el saldo de este momento, no contra el de la pantalla.
 */
async function leerProductoConLotes({ almacen, cliente, fechaEntrega, codigo }) {
  const { filas } = await plsql.obtenerProductosPorLote({
    busqueda: codigo,
    tipo: 'O',
    almacen,
    cliente,
    fechaEntrega
  });

  // El paquete puede devolver coincidencias parciales; nos quedamos con el
  // codigo exacto.
  const propias = filas.filter(
    (f) => String(f.producto).toUpperCase() === String(codigo).toUpperCase()
  );
  if (propias.length === 0) return null;

  return lotes.agruparPorProducto(propias)[0];
}

/**
 * Carga una cantidad al pedido repartiendola entre los lotes (FEFO).
 *
 * Cada tramo del reparto es una linea del pedido, porque cada linea de
 * IBSVENTA.LIN_PEDIDOS guarda un solo lote. Es decir: pedir 200 unidades que
 * estan en tres lotes genera tres lineas, y el vendedor lo ve asi en el
 * detalle.
 *
 * Ojo con la atomicidad: F_CREAR_PEDIDO y F_CREAR_DETALLE_PEDIDO hacen COMMIT
 * dentro del propio procedimiento, asi que no se pueden envolver en una
 * transaccion desde aqui. Si un tramo falla a mitad, se compensa borrando las
 * lineas del producto (F_ELIMINAR_DETALLE_PEDIDO borra por codigo de item), y
 * solo si el producto no estaba ya en el pedido de antes; si estaba, borrar se
 * llevaria por delante lineas buenas, asi que se informa el estado real y se
 * deja que la persona decida.
 */
async function cargarProductoEnPedido({ sesion, cliente, nombreCliente, vendedor, fechaEntrega, producto, reparto, nroPedido }) {
  const almacen = sesion.almacen;
  const tramos = [];
  let numero = nroPedido;

  for (const tramo of reparto) {
    const comun = {
      almacen,
      cliente,
      codItem: producto.producto,
      cantidad: tramo.cantidad,
      unidad: producto.unidad,
      porcDescuento: 0,
      lote: tramo.lote,
      fechaVencimiento: tramo.fechaVencimiento
    };

    // La primera linea de un pedido nuevo va con F_CREAR_PEDIDO, que crea la
    // cabecera y la linea a la vez; las demas con F_CREAR_DETALLE_PEDIDO.
    const r = numero
      ? await plsql.adicionarItem({ ...comun, nroPedido: numero, login: sesion.login })
      : await plsql.crearPedido({
          ...comun,
          nombreCliente,
          fechaEntrega,
          login: sesion.login,
          vendedor
        });

    if (!r.ok) {
      return {
        ok: false,
        nroPedido: numero,
        tramosHechos: tramos,
        mensaje: r.mensaje || 'No se pudo cargar el producto'
      };
    }

    if (!numero) numero = r.nroPedido;
    tramos.push({ lote: tramo.lote, cantidad: tramo.cantidad, fechaVencimiento: tramo.fechaVencimiento });
  }

  return { ok: true, nroPedido: numero, tramosHechos: tramos };
}

app.post(
  '/api/pedidos',
  exigeSesion,
  asincrono(async (req, res) => {
    const { cliente, nombreCliente, vendedor, fechaEntrega, producto, cantidad } = req.body || {};

    if (!cliente || !vendedor || !producto || !producto.producto) {
      return res.status(400).json({ error: 'Faltan cliente, vendedor o producto' });
    }

    const fecha = reglas.validarFechaEntrega(fechaEntrega);
    if (!fecha.ok) return res.status(400).json({ error: fecha.mensaje });

    const almacen = req.session.usuario.almacen;

    const fresco = await leerProductoConLotes({
      almacen,
      cliente,
      fechaEntrega,
      codigo: producto.producto
    });
    if (!fresco) return res.status(404).json({ error: 'El producto ya no esta disponible' });

    const plan = lotes.repartirEnLotes(fresco.lotes, cantidad);
    if (!plan.ok) return res.status(422).json({ error: plan.mensaje });

    const r = await cargarProductoEnPedido({
      sesion: req.session.usuario,
      cliente,
      nombreCliente,
      vendedor,
      fechaEntrega,
      producto: fresco,
      reparto: plan.reparto
    });

    if (!r.ok && !r.nroPedido) {
      return res.status(422).json({ error: r.mensaje || 'No se pudo crear el pedido' });
    }

    const detalle = await plsql.obtenerDetallePedido(almacen, r.nroPedido);

    if (!r.ok) {
      // La cabecera y parte de las lineas ya existen en Oracle: no se borra
      // nada por si acaso, se devuelve el estado real y el aviso.
      return res.status(207).json({
        nroPedido: r.nroPedido,
        detalle,
        parcial: true,
        error: `El pedido se creo pero no se pudieron cargar todos los lotes. ${r.mensaje}`
      });
    }

    res.status(201).json({
      nroPedido: r.nroPedido,
      mensaje: `Se reservaron ${cantidad} ${fresco.unidad} de ${fresco.nombre} en ${r.tramosHechos.length} lote(s).`,
      reparto: r.tramosHechos,
      detalle
    });
  })
);

app.post(
  '/api/pedidos/:nro/items',
  exigeSesion,
  asincrono(async (req, res) => {
    const { cliente, producto, cantidad, fechaEntrega } = req.body || {};
    if (!cliente || !producto || !producto.producto) {
      return res.status(400).json({ error: 'Faltan cliente o producto' });
    }

    const fecha = reglas.validarFechaEntrega(fechaEntrega);
    if (!fecha.ok) return res.status(400).json({ error: fecha.mensaje });

    const almacen = req.session.usuario.almacen;
    const nro = req.params.nro;

    const fresco = await leerProductoConLotes({
      almacen,
      cliente,
      fechaEntrega,
      codigo: producto.producto
    });
    if (!fresco) return res.status(404).json({ error: 'El producto ya no esta disponible' });

    const plan = lotes.repartirEnLotes(fresco.lotes, cantidad);
    if (!plan.ok) return res.status(422).json({ error: plan.mensaje });

    // Para saber si se puede compensar en caso de fallo a mitad del reparto.
    const detallePrevio = await plsql.obtenerDetallePedido(almacen, nro);
    const yaEstaba = detallePrevio.some((l) => l.codigoItem === fresco.producto);

    const r = await cargarProductoEnPedido({
      sesion: req.session.usuario,
      cliente,
      producto: fresco,
      reparto: plan.reparto,
      nroPedido: nro
    });

    if (!r.ok) {
      let aviso = r.mensaje;

      if (r.tramosHechos.length > 0 && !yaEstaba) {
        // Se deshace lo cargado: el producto no estaba antes, asi que borrar
        // por codigo de item solo se lleva lo que acabamos de insertar.
        const vuelta = await plsql.eliminarItem({ almacen, nroPedido: nro, item: fresco.producto });
        aviso = vuelta.ok
          ? `${r.mensaje} No se cargo nada: se deshizo lo que ya se habia reservado.`
          : `${r.mensaje} Ademas no se pudo deshacer lo ya reservado; revise el detalle del pedido.`;
      } else if (r.tramosHechos.length > 0) {
        aviso = `${r.mensaje} Quedaron cargados ${r.tramosHechos.length} lote(s) de los ${plan.reparto.length} previstos; revise el detalle.`;
      }

      const detalle = await plsql.obtenerDetallePedido(almacen, nro);
      return res.status(422).json({ error: aviso, detalle });
    }

    const detalle = await plsql.obtenerDetallePedido(almacen, nro);
    res.json({
      mensaje: `Se reservaron ${cantidad} ${fresco.unidad} de ${fresco.nombre} en ${r.tramosHechos.length} lote(s).`,
      reparto: r.tramosHechos,
      detalle
    });
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
