/**
 * Modo prueba: los pedidos se graban en IBSVENTA.PPEDIDOS y PLIN_PEDIDOS.
 *
 * Para que existe
 * ---------------
 * El backend apunta a la base de PRODUCCION. Probar de punta a punta el reparto
 * en lotes exigia crear pedidos de verdad, que quedan a la vista de todos en el
 * sistema JSF. Con las tablas de prueba (que son copia exacta de PEDIDOS y
 * LIN_PEDIDOS, mismas 32 y 23 columnas) se puede recorrer el flujo entero sin
 * tocar un solo dato real.
 *
 * Que NO se prueba con esto
 * -------------------------
 * El paquete ABD.PCK_OPERACIONES no se ejecuta: sus INSERT estan dentro del
 * PL/SQL y apuntan a las tablas reales, asi que no se pueden redirigir desde
 * aqui. Lo que si se ejercita es todo lo demas: el reparto FEFO, una linea por
 * lote, la numeracion de lineas, el borrado y la pantalla completa.
 *
 * El precio SI es el real: se llama a IBSADM.GET_IMPORTE, la misma funcion que
 * usa el paquete, con los mismos argumentos.
 *
 * Se activa con MODO_PRUEBA=1 en el .env. Sin esa variable este archivo no se
 * carga siquiera.
 */
const oracledb = require('oracledb');
const { conectar } = require('./db');

const OBJETO = { outFormat: oracledb.OUT_FORMAT_OBJECT };

/** Los numeros de prueba arrancan aqui para no confundirlos con los reales. */
const NUMERO_BASE = 900000;

/**
 * Precio, importe y neto salen de IBSADM.GET_IMPORTE, igual que en
 * F_CREAR_DETALLE_PEDIDO: 'P' precio, 'I' importe, 'N' neto.
 */
async function montos(cn, { codItem, cliente, almacen, cantidad, porcDescuento }) {
  const r = await cn.execute(
    `SELECT IBSADM.GET_IMPORTE('P', :item, :cliente, :almacen, SYSDATE, 'BS', :cant, :dcto) PRECIO,
            IBSADM.GET_IMPORTE('I', :item, :cliente, :almacen, SYSDATE, 'BS', :cant, :dcto) IMPORTE,
            IBSADM.GET_IMPORTE('N', :item, :cliente, :almacen, SYSDATE, 'BS', :cant, :dcto) NETO
       FROM DUAL`,
    { item: codItem, cliente, almacen, cant: cantidad, dcto: porcDescuento ?? 0 },
    OBJETO
  );
  const f = r.rows[0];
  return { precio: Number(f.PRECIO ?? 0), importe: Number(f.IMPORTE ?? 0), neto: Number(f.NETO ?? 0) };
}

/** Inserta una linea. El item es MAX+1, igual que el paquete. */
async function insertarLinea(cn, p) {
  const m = await montos(cn, p);

  const s = await cn.execute(
    `SELECT NVL(MAX(ITEM), 0) + 1 SIGUIENTE FROM IBSVENTA.PLIN_PEDIDOS
      WHERE ALMACEN = :almacen AND NUMERO = :numero`,
    { almacen: p.almacen, numero: String(p.nroPedido) },
    OBJETO
  );
  const item = Number(s.rows[0].SIGUIENTE);

  await cn.execute(
    `INSERT INTO IBSVENTA.PLIN_PEDIDOS
       (ITEM, ALMACEN, NUMERO, FECHA, ESTADO, CODIGO_ITEM, CANTIDAD, UNIDAD,
        PRECIO_BS, IMPORTE_BS, DES_ITEMS_BS, NETO_BS, PORC_DCTO, LOGIN,
        FECHA_ACT, LOTE, FECHA_VENCIMIENTO)
     VALUES
       (:item, :almacen, :numero, SYSDATE, 'M', :codItem, :cantidad, :unidad,
        :precio, :importe, :dcto, :neto, :dcto, :login,
        SYSDATE, :lote, :fecVenc)`,
    {
      item,
      almacen: p.almacen,
      numero: String(p.nroPedido),
      codItem: p.codItem,
      cantidad: p.cantidad,
      unidad: p.unidad,
      precio: m.precio,
      importe: m.importe,
      neto: m.neto,
      dcto: p.porcDescuento ?? 0,
      login: p.login,
      lote: p.lote,
      // FECHA_VENCIMIENTO es VARCHAR2 en esta tabla: se guarda "dd/MM/yy" tal
      // como lo entrega el cursor de productos.
      fecVenc: p.fechaVencimiento
    }
  );

  return item;
}

/** Equivalente a F_CREAR_PEDIDO: cabecera + primera linea. */
async function crearPedido(p) {
  return conectar(async (cn) => {
    const s = await cn.execute(
      `SELECT NVL(MAX(TO_NUMBER(NUMERO)), :base) + 1 SIGUIENTE
         FROM IBSVENTA.PPEDIDOS WHERE ALMACEN = :almacen`,
      { base: NUMERO_BASE, almacen: p.almacen },
      OBJETO
    );
    const numero = String(s.rows[0].SIGUIENTE);

    await cn.execute(
      `INSERT INTO IBSVENTA.PPEDIDOS
         (ALMACEN, NUMERO, CLIENTE, NOMBRE, FECHA, ESTADO, FECHA_ENTREGA, LOGIN, CODIGO_VENDEDOR)
       VALUES
         (:almacen, :numero, :cliente, :nombre, SYSDATE, 'M',
          TO_DATE(:fechaEntrega, 'DD/MM/YYYY'), :login, :vendedor)`,
      {
        almacen: p.almacen,
        numero,
        cliente: p.cliente,
        nombre: p.nombreCliente,
        fechaEntrega: p.fechaEntrega,
        login: p.login,
        vendedor: p.vendedor
      }
    );

    await insertarLinea(cn, { ...p, nroPedido: numero });
    await cn.commit();

    return { ok: true, codigo: '1', nroPedido: numero, mensaje: `[PRUEBA] Pedido Nº ${numero} creado.` };
  });
}

/** Equivalente a F_CREAR_DETALLE_PEDIDO. */
async function adicionarItem(p) {
  return conectar(async (cn) => {
    const item = await insertarLinea(cn, p);
    await cn.commit();
    return { ok: true, codigo: '1', nroLinea: String(item), mensaje: `[PRUEBA] Línea ${item} creada.` };
  });
}

/**
 * Equivalente a F_ELIMINAR_DETALLE_PEDIDO: borra por CODIGO_ITEM, o sea todas
 * las lineas de ese producto, sean de uno o de varios lotes. Igual que el real.
 */
async function eliminarItem({ almacen, nroPedido, item }) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `DELETE FROM IBSVENTA.PLIN_PEDIDOS
        WHERE ALMACEN = :almacen AND NUMERO = :numero AND CODIGO_ITEM = :codItem`,
      { almacen, numero: String(nroPedido), codItem: String(item) }
    );
    await cn.commit();
    return { ok: true, codigo: '1', mensaje: `[PRUEBA] Se eliminaron ${r.rowsAffected} línea(s).` };
  });
}

/** Equivalente a F_OBTENER_DET_PEDIDO, con las mismas claves de salida. */
async function obtenerDetallePedido(almacen, nroPedido) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `SELECT ITEM, FECHA, ESTADO, CODIGO_ITEM, CANTIDAD, UNIDAD, PRECIO_BS, IMPORTE_BS,
              DES_ITEMS_BS, NETO_BS, PORC_DCTO, LOGIN, LOGIN_MOD, FECHA_ACT, FECHA_MOD,
              LOTE, FECHA_VENCIMIENTO,
              (SELECT DESCRIPCION FROM IBSVENTA.ITEMS I WHERE I.CODIGO = L.CODIGO_ITEM) DESCRIPCION
         FROM IBSVENTA.PLIN_PEDIDOS L
        WHERE ALMACEN = :almacen AND NUMERO = :numero
        ORDER BY ITEM`,
      { almacen, numero: String(nroPedido) },
      OBJETO
    );

    return r.rows.map((f) => ({
      item: Number(f.ITEM),
      fecha: f.FECHA,
      estado: f.ESTADO,
      codigoItem: f.CODIGO_ITEM,
      cantidad: Number(f.CANTIDAD),
      unidad: f.UNIDAD,
      precioBs: Number(f.PRECIO_BS ?? 0),
      importeBs: Number(f.IMPORTE_BS ?? 0),
      descItemBs: Number(f.DES_ITEMS_BS ?? 0),
      netoBs: Number(f.NETO_BS ?? 0),
      porcDescuento: Number(f.PORC_DCTO ?? 0),
      login: f.LOGIN,
      loginMod: f.LOGIN_MOD,
      fechaAct: f.FECHA_ACT,
      fechaMod: f.FECHA_MOD,
      lote: f.LOTE,
      fechaVencimiento: f.FECHA_VENCIMIENTO,
      descripcion: f.DESCRIPCION
    }));
  });
}

/** Equivalente a F_OBTENER_PEDIDO. */
async function obtenerPedido(almacen, nroPedido) {
  return conectar(async (cn) => {
    const r = await cn.execute(
      `SELECT * FROM IBSVENTA.PPEDIDOS WHERE ALMACEN = :almacen AND NUMERO = :numero`,
      { almacen, numero: String(nroPedido) },
      OBJETO
    );
    if (!r.rows.length) return null;
    const f = r.rows[0];

    return {
      almacen: f.ALMACEN,
      numero: f.NUMERO,
      cliente: f.CLIENTE,
      nombre: f.NOMBRE,
      fecha: f.FECHA,
      estado: f.ESTADO,
      fechaEntrega: f.FECHA_ENTREGA,
      netoBs: Number(f.NETO_BS ?? 0),
      netoMe: Number(f.NETO_ME ?? 0),
      login: f.LOGIN,
      loginMod: f.LOGIN_MOD,
      fechaAct: f.FECHA_ACT,
      fechaMod: f.FECHA_MOD,
      codVendedor: f.CODIGO_VENDEDOR,
      formaPago: f.FORMA_PAGO,
      pagado: f.PAGADO,
      tipoPago: f.TIPO_PAGO,
      analitico: f.ANALITICO,
      autorizacionDgi: f.AUTORIZACION_DGI,
      numeroDgi: f.NUMERO_DGI,
      tipoFac: f.TIPO_FAC,
      numeroFac: f.NUMERO_FAC,
      ordenFac: f.ORDEN_FAC,
      razonSocial: f.RAZON_SOCIAL,
      nit: f.NIT
    };
  });
}

/** Equivalente a F_TERMINAR_PEDIDO: totaliza y pasa el estado a 'V'. */
async function terminarPedido({ almacen, nroPedido, login }) {
  return conectar(async (cn) => {
    await cn.execute(
      `UPDATE IBSVENTA.PPEDIDOS
          SET NETO_BS = (SELECT NVL(SUM(NETO_BS), 0) - NVL(SUM(DES_ITEMS_BS), 0)
                           FROM IBSVENTA.PLIN_PEDIDOS
                          WHERE ALMACEN = :almacen AND NUMERO = :numero),
              NETO_ME = 0, FECHA_ACT = SYSDATE, FECHA_MOD = SYSDATE,
              ESTADO = 'V', LOGIN_MOD = :login, PAGADO = 'No'
        WHERE ALMACEN = :almacen AND NUMERO = :numero`,
      { almacen, numero: String(nroPedido), login }
    );

    await cn.execute(
      `UPDATE IBSVENTA.PLIN_PEDIDOS
          SET ESTADO = 'V', LOGIN_MOD = :login, FECHA_MOD = SYSDATE
        WHERE ALMACEN = :almacen AND NUMERO = :numero`,
      { almacen, numero: String(nroPedido), login }
    );

    await cn.commit();
    return { ok: true, codigo: '1', mensaje: `[PRUEBA] Pedido Nº ${nroPedido} activado.` };
  });
}

/** Equivalente a F_PAGAR_PEDIDO. */
async function pagarPedido(p) {
  return conectar(async (cn) => {
    await cn.execute(
      `UPDATE IBSVENTA.PPEDIDOS
          SET FORMA_PAGO = :formaPago, TIPO_PAGO = :tipoPago, ANALITICO = :analitico,
              RAZON_SOCIAL = NVL(:razonSocial, RAZON_SOCIAL), NIT = NVL(:nit, NIT),
              PAGADO = 'Si', FECHA_MOD = SYSDATE, LOGIN_MOD = :login
        WHERE ALMACEN = :almacen AND NUMERO = :numero`,
      {
        formaPago: p.formaPago,
        tipoPago: p.tipoPago || null,
        analitico: p.banco || null,
        razonSocial: p.razonSocial || null,
        nit: p.nit || null,
        login: p.login,
        almacen: p.almacen,
        numero: String(p.nroPedido)
      }
    );

    await cn.commit();
    return { ok: true, codigo: '1', mensaje: `[PRUEBA] Pedido Nº ${p.nroPedido} pagado.` };
  });
}

/** Borra todo lo que haya en las tablas de prueba. Solo se usa desde pruebas. */
async function limpiar() {
  return conectar(async (cn) => {
    const l = await cn.execute(`DELETE FROM IBSVENTA.PLIN_PEDIDOS`);
    const c = await cn.execute(`DELETE FROM IBSVENTA.PPEDIDOS`);
    await cn.commit();
    return { lineas: l.rowsAffected, pedidos: c.rowsAffected };
  });
}

module.exports = {
  crearPedido,
  adicionarItem,
  eliminarItem,
  obtenerDetallePedido,
  obtenerPedido,
  terminarPedido,
  pagarPedido,
  limpiar
};
