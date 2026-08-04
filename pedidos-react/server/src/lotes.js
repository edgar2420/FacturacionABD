/**
 * Agrupacion de lotes y reparto FEFO.
 *
 * F_OBTENER_PRODUCTOS devuelve una fila POR LOTE. Con eso el vendedor tenia
 * que elegir el lote a mano y no veia el saldo real del producto: si pedian 200
 * unidades y estaban repartidas en tres lotes de 80, 70 y 50, parecia que no
 * habia stock.
 *
 * Aqui se resuelven las dos mitades del problema:
 *
 *  1. MOSTRAR: se suma el saldo de todos los lotes y se presenta UNA fila por
 *     producto, ordenada por el lote que vence antes y, a igual vencimiento,
 *     por el saldo mas bajo.
 *
 *  2. DESPACHAR: al cargar el producto al pedido se reparte la cantidad entre
 *     los lotes siguiendo ese mismo orden (FEFO: lo que vence antes sale
 *     primero, y entre lotes que vencen el mismo dia sale primero el de menor
 *     saldo, que es el que conviene liquidar).
 *
 * Todo son funciones puras, sin base de datos, para poder probarlas.
 */

/**
 * Convierte el vencimiento a Date. El cursor lo entrega como VARCHAR2 en
 * formato "dd/MM/yy" (ej. "30/09/26"); tambien se acepta "dd/MM/yyyy" y un
 * Date ya construido, por si el paquete cambiara.
 *
 * El año de dos cifras se interpreta como 20yy: son fechas de vencimiento de
 * medicamentos, siempre estan en este siglo.
 */
function parsearVencimiento(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor !== 'string') return null;

  const m = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);

  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return null;
  }
  return fecha;
}

/**
 * Hasta cuantas unidades se considera que un lote es un "resto" o migaja.
 *
 * Estos lotes salen ANTES que nada, para liquidarlos. En el almacen de Fabrica
 * habia 21 lotes de 3 unidades o menos —30 unidades en total— y con el orden
 * puro por vencimiento no salian nunca, porque casi siempre son los que vencen
 * mas tarde: se quedaban ahi para siempre.
 *
 * Si hace falta ajustarlo, se cambia aqui y en un solo sitio.
 */
const SALDO_RESTO = 3;

function esResto(lote) {
  const s = Number(lote.saldo) || 0;
  return s > 0 && s <= SALDO_RESTO;
}

/**
 * Orden de despacho, que es tambien el orden en que se muestran los lotes:
 *
 *   1. los restos (saldo <= SALDO_RESTO), para liquidarlos; entre ellos, el
 *      que vence antes
 *   2. el resto de lotes por vencimiento: sale antes lo que caduca antes
 *   3. a igual vencimiento, el de menor saldo
 *   4. a igual saldo, por codigo de lote, para que el orden sea estable
 *
 * El limite es a proposito muy bajo. Con un limite alto, un lote grande que
 * vence pronto se quedaria atras y se venceria, que es justo lo que hay que
 * evitar; con tres unidades apenas se retrasa nada y se limpian las migajas.
 *
 * Un lote sin fecha de vencimiento legible se manda al final: no se puede
 * afirmar que venza pronto, y sacarlo primero seria arriesgado.
 */
function compararLotes(a, b) {
  const ra = esResto(a);
  const rb = esResto(b);
  if (ra !== rb) return ra ? -1 : 1;

  const fa = parsearVencimiento(a.fechaVencimiento);
  const fb = parsearVencimiento(b.fechaVencimiento);

  if (fa && fb && fa.getTime() !== fb.getTime()) return fa - fb;
  if (fa && !fb) return -1;
  if (!fa && fb) return 1;

  const sa = Number(a.saldo) || 0;
  const sb = Number(b.saldo) || 0;
  if (sa !== sb) return sa - sb;

  return String(a.lote || '').localeCompare(String(b.lote || ''));
}

/**
 * Agrupa las filas del cursor en un producto por codigo, con el saldo sumado
 * y sus lotes ya ordenados para despacho.
 *
 * El precio es el mismo en todos los lotes de un producto (lo calcula
 * IBSADM.GET_IMPORTE a partir del cliente y la fecha, no del lote). Aun asi se
 * toma el mayor: si algun dia difirieran, cobrar de menos seria una perdida y
 * cobrar de mas un reclamo; se prefiere que el vendedor vea el precio alto y
 * lo note, antes que facturar por debajo.
 */
function agruparPorProducto(filas) {
  const porCodigo = new Map();

  for (const f of filas) {
    const clave = f.producto;
    let g = porCodigo.get(clave);

    if (!g) {
      g = {
        almacen: f.almacen,
        producto: f.producto,
        nombre: f.nombre,
        unidad: f.unidad,
        precio: Number(f.precio) || 0,
        saldoTotal: 0,
        lotes: []
      };
      porCodigo.set(clave, g);
    }

    g.precio = Math.max(g.precio, Number(f.precio) || 0);
    g.saldoTotal += Number(f.saldo) || 0;
    g.lotes.push({
      lote: f.lote,
      fechaVencimiento: f.fechaVencimiento,
      saldo: Number(f.saldo) || 0,
      precio: Number(f.precio) || 0
    });
  }

  const grupos = [...porCodigo.values()];

  for (const g of grupos) {
    g.lotes.sort(compararLotes);

    /*
     * El vencimiento que se muestra es el MAS PROXIMO de todos, no el del
     * primer lote de la lista.
     *
     * Son cosas distintas desde que los restos salen primero: un lote de una
     * unidad que caduca en 2030 puede encabezar el despacho, y poner esa fecha
     * en la columna "Vence" haria creer que al producto le quedan años cuando
     * el grueso del stock caduca el mes que viene.
     */
    const fechas = g.lotes
      .map((l) => ({ texto: l.fechaVencimiento, fecha: parsearVencimiento(l.fechaVencimiento) }))
      .filter((f) => f.fecha)
      .sort((a, b) => a.fecha - b.fecha);

    g.vencimientoProximo = fechas.length
      ? fechas[0].texto
      : (g.lotes[0]?.fechaVencimiento ?? null);
    g.cantidadLotes = g.lotes.length;
  }

  return grupos;
}

/**
 * Ordena el listado de productos con el mismo criterio: primero lo que vence
 * antes, y a igual fecha lo que tiene menos saldo total. El nombre solo
 * desempata para que dos busquedas iguales devuelvan lo mismo.
 */
function ordenarProductos(grupos) {
  return [...grupos].sort((a, b) => {
    const fa = parsearVencimiento(a.vencimientoProximo);
    const fb = parsearVencimiento(b.vencimientoProximo);

    if (fa && fb && fa.getTime() !== fb.getTime()) return fa - fb;
    if (fa && !fb) return -1;
    if (!fa && fb) return 1;

    if (a.saldoTotal !== b.saldoTotal) return a.saldoTotal - b.saldoTotal;
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });
}

/**
 * Reparte una cantidad entre los lotes, en orden de despacho.
 *
 * Devuelve un tramo por lote con la cantidad que sale de cada uno. Si el saldo
 * total no alcanza devuelve ok:false y cuanto falta, sin repartir nada: es
 * preferible avisar antes que dejar el pedido a medias.
 *
 * Los lotes con saldo cero o negativo se ignoran; aparecen cuando una reserva
 * previa ya consumio el lote.
 */
function repartirEnLotes(lotes, cantidad) {
  const pedida = Number(cantidad);

  if (!Number.isFinite(pedida) || pedida <= 0) {
    return { ok: false, mensaje: 'Introduzca una cantidad mayor a cero.', reparto: [] };
  }

  const disponibles = [...(lotes || [])]
    .filter((l) => (Number(l.saldo) || 0) > 0)
    .sort(compararLotes);

  const total = disponibles.reduce((s, l) => s + Number(l.saldo), 0);

  if (pedida > total) {
    return {
      ok: false,
      faltante: pedida - total,
      saldoTotal: total,
      mensaje: `La cantidad supera el saldo disponible. Pedido: ${pedida}, saldo total: ${total}.`,
      reparto: []
    };
  }

  const reparto = [];
  let restante = pedida;

  for (const l of disponibles) {
    if (restante <= 0) break;
    const toma = Math.min(restante, Number(l.saldo));
    reparto.push({
      lote: l.lote,
      fechaVencimiento: l.fechaVencimiento,
      cantidad: toma
    });
    restante -= toma;
  }

  return { ok: true, reparto, saldoTotal: total };
}

module.exports = {
  SALDO_RESTO,
  esResto,
  parsearVencimiento,
  compararLotes,
  agruparPorProducto,
  ordenarProductos,
  repartirEnLotes
};
