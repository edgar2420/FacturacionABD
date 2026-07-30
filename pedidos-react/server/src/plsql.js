/**
 * Envoltorio de ABD.PCK_OPERACIONES.
 *
 * Aqui NO se reimplementa ninguna regla de negocio: se llaman exactamente los
 * mismos procedimientos que usa PedidosDao.java, con los mismos parametros y
 * en el mismo orden. La logica sigue viviendo en Oracle.
 *
 * Convencion del paquete: todas son FUNCIONES. El primer bind (:ret) es el
 * valor de retorno, "1" = exito. Los ultimos parametros OUT traen el numero
 * generado y/o el mensaje para el usuario.
 */
const oracledb = require('oracledb');
const { conectar } = require('./db');

const S = oracledb.STRING;
const N = oracledb.NUMBER;
const CURSOR = oracledb.CURSOR;
const OUT = oracledb.BIND_OUT;
const IN = oracledb.BIND_IN;

/** Vuelca un REF CURSOR a un arreglo de arreglos (posicional, como el DAO). */
async function filasDelCursor(cursor) {
  const filas = [];
  let fila;
  while ((fila = await cursor.getRow())) {
    filas.push(fila);
  }
  await cursor.close();
  return filas;
}

// --- Catalogos (consultas directas a ABD.PERSONAS) --------------------------

/**
 * Busca clientes. Replica PedidosDao.buscarCliente(valor, tipo):
 * siempre filtra CODIGO_CLIENTE = 'SI' y ordena por nombre.
 * Tipos: N=nombre, R=razon social, C=carnet/nit, O=codigo.
 *
 * A diferencia del original, aqui se usan bind variables en vez de concatenar
 * el texto del usuario dentro del SQL.
 */
async function buscarClientes(valor, tipo, { pagina = 1, porPagina = 15 } = {}) {
  const columnas = { N: 'UPPER(NOMBRE)', R: 'UPPER(RAZON_SOCIAL)', C: 'RUC', O: 'UPPER(CODIGO)' };
  const columna = columnas[tipo];
  if (!columna) throw new Error(`Tipo de busqueda de cliente no valido: ${tipo}`);

  const patron = tipo === 'C' ? `%${valor}%` : `%${String(valor).toUpperCase()}%`;
  const desde = (pagina - 1) * porPagina;

  return conectar(async (cn) => {
    const filtro = `FROM ABD.PERSONAS WHERE ${columna} LIKE :patron AND CODIGO_CLIENTE = 'SI'`;

    // Primero el total, para poder mostrar "pagina 2 de 7".
    const t = await cn.execute(`SELECT COUNT(*) TOTAL ${filtro}`, { patron }, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    const total = Number(t.rows[0].TOTAL);

    // Oracle 12c en adelante soporta OFFSET / FETCH NEXT.
    const r = await cn.execute(
      `SELECT CODIGO, NOMBRE, RAZON_SOCIAL, RUC, CIUDAD, EMAIL, DIRECCION_DOM, TELEFONO_DOM
         ${filtro}
        ORDER BY NOMBRE
        OFFSET :desde ROWS FETCH NEXT :porPagina ROWS ONLY`,
      { patron, desde, porPagina },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return { items: r.rows.map(mapearPersona), total, pagina, porPagina };
  });
}

/** Un cliente por codigo. Replica PedidosDao.buscarCliente(codigo). */
async function obtenerCliente(codigo) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `SELECT CODIGO, NOMBRE, RAZON_SOCIAL, RUC, CIUDAD, EMAIL, DIRECCION_DOM, TELEFONO_DOM
         FROM ABD.PERSONAS WHERE CODIGO = :codigo`,
      { codigo },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return r.rows.length ? mapearPersona(r.rows[0]) : null;
  });
}

/**
 * Busca vendedores. Replica buscarVendedoresFiltro():
 * CODIGO_EMPLEADO='SI' y CODIGO_VENDEDOR no nulo.
 * Tipos: N=por nombre (LIKE), O=por codigo de vendedor (igualdad).
 */
async function buscarVendedores(valor, tipo, { pagina = 1, porPagina = 15 } = {}) {
  const texto = String(valor || '').trim().toUpperCase();
  const desde = (pagina - 1) * porPagina;

  return conectar(async (cn) => {
    const base = `FROM ABD.PERSONAS
                  WHERE CODIGO_EMPLEADO = 'SI' AND CODIGO_VENDEDOR IS NOT NULL`;
    const condicion =
      tipo === 'O' ? `${base} AND CODIGO_VENDEDOR = :valor` : `${base} AND TRIM(UPPER(NOMBRE)) LIKE :valor`;
    const bind = tipo === 'O' ? { valor: texto } : { valor: `%${texto}%` };

    const t = await cn.execute(`SELECT COUNT(*) TOTAL ${condicion}`, bind, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    const total = Number(t.rows[0].TOTAL);

    const r = await cn.execute(
      `SELECT CODIGO, NOMBRE, RAZON_SOCIAL, RUC, CIUDAD, EMAIL, DIRECCION_DOM, TELEFONO_DOM,
              CODIGO_VENDEDOR
         ${condicion}
        ORDER BY TRIM(NOMBRE)
        OFFSET :desde ROWS FETCH NEXT :porPagina ROWS ONLY`,
      { ...bind, desde, porPagina },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const items = r.rows.map((f) => ({ ...mapearPersona(f), codigoVendedor: f.CODIGO_VENDEDOR }));
    return { items, total, pagina, porPagina };
  });
}

function mapearPersona(f) {
  return {
    codigo: f.CODIGO,
    nombre: f.NOMBRE,
    razonSocial: f.RAZON_SOCIAL,
    ruc: f.RUC,
    ciudad: f.CIUDAD,
    email: f.EMAIL,
    direccion: f.DIRECCION_DOM,
    telefono: f.TELEFONO_DOM
  };
}

// --- Productos --------------------------------------------------------------

/**
 * F_OBTENER_PRODUCTOS(ret CURSOR, codigo, nombre, almacen, cliente, fecha)
 *
 * Igual que el DAO: si el tipo es N se manda el nombre y el codigo va en NULL;
 * si es O, al reves. El precio depende del cliente y de la fecha de entrega,
 * por eso ambos son parametros de la consulta.
 *
 * Columnas del cursor (posicionales, ver DetalleProductos):
 * 1 almacen, 2 producto, 3 nombre, 4 unidad, 5 lote, 6 fecha(venc), 7 precio, 8 saldo
 */
async function obtenerProductos({ busqueda, tipo, almacen, cliente, fechaEntrega, pagina = 1, porPagina = 15 }) {
  const texto = String(busqueda || '').toUpperCase();
  const desde = (pagina - 1) * porPagina;

  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_OBTENER_PRODUCTOS(:codigo, :nombre, :almacen, :cliente, :fecha); END;`,
      {
        ret: { dir: OUT, type: CURSOR },
        codigo: { dir: IN, type: S, val: tipo === 'O' ? texto : null },
        nombre: { dir: IN, type: S, val: tipo === 'N' ? texto : null },
        almacen: { dir: IN, type: S, val: String(almacen).toUpperCase() },
        cliente: { dir: IN, type: S, val: String(cliente).toUpperCase() },
        fecha: { dir: IN, type: S, val: fechaEntrega }
      }
    );

    /*
     * El paquete devuelve un REF CURSOR, no una consulta que podamos paginar
     * en SQL. Se recorre el cursor descartando las filas anteriores a la
     * pagina pedida y se corta al llegar al limite, leyendo una fila de mas
     * para saber si hay pagina siguiente. Asi no se traen a memoria miles de
     * filas solo para mostrar quince.
     */
    const cursor = r.outBinds.ret;
    const items = [];
    let leidas = 0;
    let hayMas = false;
    let fila;

    while ((fila = await cursor.getRow())) {
      leidas++;
      if (leidas <= desde) continue;

      if (items.length === porPagina) {
        hayMas = true;
        break;
      }

      items.push({
        almacen: fila[0],
        producto: fila[1],
        nombre: fila[2],
        unidad: fila[3],
        lote: fila[4],
        fechaVencimiento: fila[5],
        precio: Number(fila[6] ?? 0),
        saldo: fila[7]
      });
    }

    await cursor.close();
    return { items, pagina, porPagina, hayMas };
  });
}

// --- Pedidos ----------------------------------------------------------------

/**
 * F_CREAR_PEDIDO(ret, almacen, cliente, nombre, fechaEntrega, login, vendedor,
 *                codItem, cantidad, unidad, porcDescto, lote, fecVencimiento,
 *                OUT nroPedido, OUT mensaje)
 *
 * Crea la cabecera del pedido junto con su primera linea.
 */
async function crearPedido(p) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_CREAR_PEDIDO(
         :almacen, :cliente, :nombre, :fechaEntrega, :login, :vendedor,
         :codItem, :cantidad, :unidad, :porcDescto, :lote, :fecVencimiento,
         :nroPedido, :mensaje); END;`,
      {
        ret: { dir: OUT, type: S, maxSize: 400 },
        almacen: p.almacen,
        cliente: p.cliente,
        nombre: p.nombreCliente,
        fechaEntrega: p.fechaEntrega,
        login: p.login,
        vendedor: p.vendedor,
        codItem: p.codItem,
        cantidad: { dir: IN, type: N, val: p.cantidad },
        unidad: p.unidad,
        porcDescto: { dir: IN, type: N, val: p.porcDescuento ?? 0 },
        lote: p.lote,
        fecVencimiento: p.fechaVencimiento,
        nroPedido: { dir: OUT, type: S, maxSize: 400 },
        mensaje: { dir: OUT, type: S, maxSize: 4000 }
      },
      { autoCommit: true }
    );

    const b = r.outBinds;
    return { ok: b.ret === '1', codigo: b.ret, nroPedido: b.nroPedido, mensaje: b.mensaje };
  });
}

/**
 * F_CREAR_DETALLE_PEDIDO(ret, almacen, pedido, cliente, codItem, cantidad,
 *                        unidad, porcDescto, login, lote, fecVencimiento,
 *                        OUT nroLinea, OUT mensaje)
 */
async function adicionarItem(p) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_CREAR_DETALLE_PEDIDO(
         :almacen, :pedido, :cliente, :codItem, :cantidad, :unidad,
         :porcDescto, :login, :lote, :fecVencimiento, :nroLinea, :mensaje); END;`,
      {
        ret: { dir: OUT, type: S, maxSize: 400 },
        almacen: p.almacen,
        pedido: { dir: IN, type: N, val: Number(p.nroPedido) },
        cliente: p.cliente,
        codItem: p.codItem,
        cantidad: { dir: IN, type: N, val: p.cantidad },
        unidad: p.unidad,
        porcDescto: { dir: IN, type: N, val: p.porcDescuento ?? 0 },
        login: p.login,
        lote: p.lote,
        fecVencimiento: p.fechaVencimiento,
        nroLinea: { dir: OUT, type: S, maxSize: 400 },
        mensaje: { dir: OUT, type: S, maxSize: 4000 }
      },
      { autoCommit: true }
    );

    const b = r.outBinds;
    return { ok: b.ret === '1', codigo: b.ret, nroLinea: b.nroLinea, mensaje: b.mensaje };
  });
}

/**
 * F_ELIMINAR_DETALLE_PEDIDO(ret, almacen, pedido, item, OUT mensaje)
 *
 * Nota: en PedidosDao.java esta llamada tiene la cadena mal cerrada
 * ("{? = call ...(?,?,?,?)" sin la llave final). Aqui se llama correctamente.
 */
async function eliminarItem({ almacen, nroPedido, item }) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_ELIMINAR_DETALLE_PEDIDO(
         :almacen, :pedido, :item, :mensaje); END;`,
      {
        ret: { dir: OUT, type: S, maxSize: 400 },
        almacen,
        pedido: { dir: IN, type: N, val: Number(nroPedido) },
        item: String(item),
        mensaje: { dir: OUT, type: S, maxSize: 4000 }
      },
      { autoCommit: true }
    );

    const b = r.outBinds;
    return { ok: b.ret === '1', codigo: b.ret, mensaje: b.mensaje };
  });
}

/**
 * F_OBTENER_DET_PEDIDO(ret CURSOR, almacen, pedido)
 * Columnas posicionales segun objetos/DetallePedido.java:
 * 1 item, 2 fecha, 3 estado, 4 codigoItem, 5 cantidad, 6 unidad, 7 precioBs,
 * 8 importeBs, 9 descItemBs, 10 netoBs, 11 porcDescuento, 12 login,
 * 13 loginMod, 14 fechaAct, 15 fechaMod, 16 lote, 17 fechaVencimiento,
 * 18 descripcion
 */
async function obtenerDetallePedido(almacen, nroPedido) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_OBTENER_DET_PEDIDO(:almacen, :pedido); END;`,
      {
        ret: { dir: OUT, type: CURSOR },
        almacen,
        pedido: { dir: IN, type: N, val: Number(nroPedido) }
      }
    );

    const filas = await filasDelCursor(r.outBinds.ret);
    return filas.map((f) => ({
      item: Number(f[0]),
      fecha: f[1],
      estado: f[2],
      codigoItem: f[3],
      cantidad: Number(f[4]),
      unidad: f[5],
      precioBs: Number(f[6] ?? 0),
      importeBs: Number(f[7] ?? 0),
      descItemBs: Number(f[8] ?? 0),
      netoBs: Number(f[9] ?? 0),
      porcDescuento: Number(f[10] ?? 0),
      login: f[11],
      loginMod: f[12],
      fechaAct: f[13],
      fechaMod: f[14],
      lote: f[15],
      fechaVencimiento: f[16],
      descripcion: f[17]
    }));
  });
}

/**
 * F_OBTENER_PEDIDO(ret CURSOR, almacen, pedido) -> 25 columnas,
 * segun objetos/Pedido.java.
 */
async function obtenerPedido(almacen, nroPedido) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_OBTENER_PEDIDO(:almacen, :pedido); END;`,
      {
        ret: { dir: OUT, type: CURSOR },
        almacen,
        pedido: { dir: IN, type: N, val: Number(nroPedido) }
      }
    );

    const filas = await filasDelCursor(r.outBinds.ret);
    if (!filas.length) return null;
    const f = filas[0];

    return {
      almacen: f[0],
      numero: f[1],
      cliente: f[2],
      nombre: f[3],
      fecha: f[4],
      estado: f[5],
      fechaEntrega: f[6],
      netoBs: Number(f[7] ?? 0),
      netoMe: Number(f[8] ?? 0),
      login: f[9],
      loginMod: f[10],
      fechaAct: f[11],
      fechaMod: f[12],
      codVendedor: f[13],
      formaPago: f[14],
      pagado: f[15],
      tipoPago: f[16],
      analitico: f[17],
      autorizacionDgi: f[18],
      numeroDgi: f[19],
      tipoFac: f[20],
      numeroFac: f[21],
      ordenFac: f[22],
      razonSocial: f[23],
      nit: f[24]
    };
  });
}

/** F_TERMINAR_PEDIDO(ret, almacen, pedido, login, OUT mensaje) */
async function terminarPedido({ almacen, nroPedido, login }) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_TERMINAR_PEDIDO(:almacen, :pedido, :login, :mensaje); END;`,
      {
        ret: { dir: OUT, type: S, maxSize: 400 },
        almacen,
        pedido: { dir: IN, type: N, val: Number(nroPedido) },
        login,
        mensaje: { dir: OUT, type: S, maxSize: 4000 }
      },
      { autoCommit: true }
    );

    const b = r.outBinds;
    return { ok: b.ret === '1', codigo: b.ret, mensaje: b.mensaje };
  });
}

/**
 * F_PAGAR_PEDIDO(ret, almacen, pedido, login, formaPago, tipoPago, analitico,
 *                razonSocial, nit, OUT mensaje)
 *
 * "analitico" es el banco. formaPago se calcula en reglas.js igual que en
 * PedidosBean.pagarPedido: Si->Contado, En->CEntrega, No->CxC.
 */
async function pagarPedido(p) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_PAGAR_PEDIDO(
         :almacen, :pedido, :login, :formaPago, :tipoPago, :analitico,
         :razonSocial, :nit, :mensaje); END;`,
      {
        ret: { dir: OUT, type: S, maxSize: 400 },
        almacen: p.almacen,
        pedido: { dir: IN, type: N, val: Number(p.nroPedido) },
        login: p.login,
        formaPago: p.formaPago,
        tipoPago: p.tipoPago || null,
        analitico: p.banco || null,
        razonSocial: p.razonSocial || null,
        nit: p.nit || null,
        mensaje: { dir: OUT, type: S, maxSize: 4000 }
      },
      { autoCommit: true }
    );

    const b = r.outBinds;
    return { ok: b.ret === '1', codigo: b.ret, mensaje: b.mensaje };
  });
}

/** F_VALIDA_USUARIO(ret, usuario, password) -> "1" si es valido. */
async function validarUsuario(usuario, password) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `BEGIN :ret := ABD.PCK_OPERACIONES.F_VALIDA_USUARIO(:usuario, :clave); END;`,
      {
        ret: { dir: OUT, type: S, maxSize: 400 },
        usuario,
        clave: password
      }
    );
    return r.outBinds.ret === '1';
  });
}

/** Datos del usuario autenticado: unidad de negocio (= almacen) y rol. */
async function obtenerUsuario(login) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `SELECT LOGIN, NOMBRE, ROL, UNI_NEG, IMPRIME_FAC FROM ABD.USUARIOS WHERE LOGIN = :login`,
      { login },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!r.rows.length) return null;
    const f = r.rows[0];
    return {
      login: f.LOGIN,
      nombre: f.NOMBRE,
      rol: f.ROL,
      almacen: f.UNI_NEG,
      imprimeFactura: String(f.IMPRIME_FAC) === '1' || f.IMPRIME_FAC === 'S'
    };
  });
}

module.exports = {
  buscarClientes,
  obtenerCliente,
  buscarVendedores,
  obtenerProductos,
  crearPedido,
  adicionarItem,
  eliminarItem,
  obtenerDetallePedido,
  obtenerPedido,
  terminarPedido,
  pagarPedido,
  validarUsuario,
  obtenerUsuario
};
