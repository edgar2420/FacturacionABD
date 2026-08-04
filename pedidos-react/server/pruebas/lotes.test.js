/**
 * Pruebas de la agrupacion de lotes y del reparto FEFO.
 *
 * Aqui vive la regla que pidio el usuario:
 *   - mostrar un producto con el saldo de todos sus lotes sumado
 *   - despachar sacando primero del lote que vence antes y, a igual fecha,
 *     del que tiene menos saldo
 *
 * Los datos de ejemplo estan tomados del almacen real AL-VEN-ABD-FAB, para que
 * los formatos (fecha "dd/MM/yy") sean los que devuelve Oracle de verdad.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
  esResto,
  parsearVencimiento,
  compararLotes,
  agruparPorProducto,
  ordenarProductos,
  repartirEnLotes
} = require('../src/lotes');

/** Fila del cursor tal como la entrega F_OBTENER_PRODUCTOS. */
function fila(producto, lote, fechaVencimiento, saldo, extra = {}) {
  return {
    almacen: 'AL-VEN-ABD-FAB',
    producto,
    nombre: extra.nombre || `PRODUCTO ${producto}`,
    unidad: 'PZA',
    lote,
    fechaVencimiento,
    precio: extra.precio ?? 100,
    saldo
  };
}

describe('parsearVencimiento', () => {
  test('lee el formato "dd/MM/yy" que devuelve el cursor', () => {
    const f = parsearVencimiento('30/09/26');
    assert.strictEqual(f.getFullYear(), 2026);
    assert.strictEqual(f.getMonth(), 8); // septiembre
    assert.strictEqual(f.getDate(), 30);
  });

  test('el año de dos cifras se toma como 20yy, no 19yy', () => {
    assert.strictEqual(parsearVencimiento('31/01/27').getFullYear(), 2027);
    assert.strictEqual(parsearVencimiento('01/01/05').getFullYear(), 2005);
  });

  test('tambien acepta cuatro cifras', () => {
    assert.strictEqual(parsearVencimiento('15/06/2028').getFullYear(), 2028);
  });

  test('rechaza fechas imposibles y basura', () => {
    assert.strictEqual(parsearVencimiento('31/02/26'), null);
    assert.strictEqual(parsearVencimiento('2026-09-30'), null);
    assert.strictEqual(parsearVencimiento(''), null);
    assert.strictEqual(parsearVencimiento(null), null);
    assert.strictEqual(parsearVencimiento(undefined), null);
  });
});

describe('restos (lotes de muy poco saldo)', () => {
  test('un lote de 3 o menos es resto; de 4 ya no', () => {
    assert.ok(esResto({ saldo: 1 }));
    assert.ok(esResto({ saldo: 3 }));
    assert.ok(!esResto({ saldo: 4 }));
    assert.ok(!esResto({ saldo: 0 }), 'sin saldo no es resto, es lote vacio');
  });

  test('los restos salen ANTES que todo, aunque venzan mucho mas tarde', () => {
    // Caso real de PT026: el lote de 1 unidad vence en 2030 y el grande en
    // 2027. Con el orden puro por fecha, la unidad no salia nunca.
    const resto = { lote: '1030037', fechaVencimiento: '01/05/30', saldo: 1 };
    const grande = { lote: '6080001', fechaVencimiento: '30/11/27', saldo: 520 };
    assert.ok(compararLotes(resto, grande) < 0, 'el resto va primero');
  });

  test('entre restos manda el vencimiento', () => {
    const a = { lote: 'A', fechaVencimiento: '01/05/30', saldo: 1 };
    const b = { lote: 'B', fechaVencimiento: '30/09/29', saldo: 3 };
    assert.ok(compararLotes(a, b) > 0, 'B vence antes, va primero');
  });

  test('entre lotes normales no cambia nada: sigue mandando la fecha', () => {
    const a = { lote: 'A', fechaVencimiento: '31/12/26', saldo: 10 };
    const b = { lote: 'B', fechaVencimiento: '30/09/26', saldo: 900 };
    assert.ok(compararLotes(a, b) > 0, 'B vence antes, va primero');
  });

  test('el caso de la captura: PT026 pidiendo 600', () => {
    const lotesPT026 = [
      { lote: '6080001', fechaVencimiento: '30/11/27', saldo: 520 },
      { lote: '1030008', fechaVencimiento: '31/08/28', saldo: 1200 },
      { lote: '1030013', fechaVencimiento: '30/09/29', saldo: 1 },
      { lote: '1030037', fechaVencimiento: '01/05/30', saldo: 1 },
      { lote: '1030036', fechaVencimiento: '01/05/30', saldo: 3 }
    ];

    const r = repartirEnLotes(lotesPT026, 600);
    assert.ok(r.ok);
    assert.deepStrictEqual(
      r.reparto.map((t) => [t.lote, t.cantidad]),
      [
        ['1030013', 1],   // restos primero, entre ellos el que vence antes
        ['1030037', 1],
        ['1030036', 3],
        ['6080001', 520], // luego lo normal, por vencimiento
        ['1030008', 75]
      ]
    );
  });
});

describe('compararLotes', () => {
  test('primero el que vence antes', () => {
    // Los dos por encima del limite de resto, para que mande la fecha.
    const a = { lote: 'A', fechaVencimiento: '31/12/26', saldo: 10 };
    const b = { lote: 'B', fechaVencimiento: '30/09/26', saldo: 900 };
    assert.ok(compararLotes(a, b) > 0, 'B vence antes, tiene que ir primero');
  });

  test('a igual vencimiento, primero el de menor saldo', () => {
    // Caso real de PT259: dos lotes que vencen el 30/09/26.
    const grande = { lote: '2360005', fechaVencimiento: '30/09/26', saldo: 5979 };
    const chico = { lote: '2360004', fechaVencimiento: '30/09/26', saldo: 933 };
    assert.ok(compararLotes(grande, chico) > 0, 'sale primero el lote de 933');
  });

  test('el lote sin fecha legible se va al final', () => {
    const conFecha = { lote: 'A', fechaVencimiento: '31/12/30', saldo: 10 };
    const sinFecha = { lote: 'B', fechaVencimiento: null, saldo: 50 };
    assert.ok(compararLotes(sinFecha, conFecha) > 0);
    assert.ok(compararLotes(conFecha, sinFecha) < 0);
  });

  test('un resto sin fecha legible sigue saliendo primero', () => {
    // Chocan dos reglas: "sin fecha va al final" y "los restos van primero".
    // Gana el resto: son como mucho 3 unidades, el riesgo es nulo y el objetivo
    // es justo sacarlas de en medio.
    const restoSinFecha = { lote: 'B', fechaVencimiento: null, saldo: 1 };
    const normal = { lote: 'A', fechaVencimiento: '31/12/26', saldo: 100 };
    assert.ok(compararLotes(restoSinFecha, normal) < 0);
  });

  test('el orden es estable con lotes identicos salvo el codigo', () => {
    const a = { lote: 'AAA', fechaVencimiento: '30/09/26', saldo: 5 };
    const b = { lote: 'BBB', fechaVencimiento: '30/09/26', saldo: 5 };
    assert.ok(compararLotes(a, b) < 0);
  });
});

describe('agruparPorProducto', () => {
  test('suma el saldo de todos los lotes en una sola fila', () => {
    const g = agruparPorProducto([
      fila('PT982', 'F244', '30/09/26', 5),
      fila('PT982', 'F245', '30/09/26', 120),
      fila('PT982', 'F246', '31/12/26', 40)
    ]);

    assert.strictEqual(g.length, 1, 'los tres lotes son un solo producto');
    assert.strictEqual(g[0].saldoTotal, 165);
    assert.strictEqual(g[0].cantidadLotes, 3);
  });

  test('el vencimiento que se muestra es el del primer lote que saldria', () => {
    const g = agruparPorProducto([
      fila('PT982', 'F246', '31/12/26', 40),
      fila('PT982', 'F244', '30/09/26', 5)
    ]);
    assert.strictEqual(g[0].vencimientoProximo, '30/09/26');
  });

  test('los lotes quedan en orden de despacho', () => {
    const g = agruparPorProducto([
      fila('PT259', '2360005', '30/09/26', 5979),
      fila('PT259', '2360004', '30/09/26', 933),
      fila('PT259', '2360009', '31/01/27', 10)
    ]);
    assert.deepStrictEqual(
      g[0].lotes.map((l) => l.lote),
      ['2360004', '2360005', '2360009']
    );
  });

  test('separa productos distintos', () => {
    const g = agruparPorProducto([
      fila('PT982', 'F244', '30/09/26', 5),
      fila('PT611', 'A57132', '31/12/26', 101)
    ]);
    assert.strictEqual(g.length, 2);
  });

  test('si dos lotes trajeran precios distintos se toma el mayor', () => {
    const g = agruparPorProducto([
      fila('PT982', 'F244', '30/09/26', 5, { precio: 50 }),
      fila('PT982', 'F245', '30/09/26', 120, { precio: 55 })
    ]);
    assert.strictEqual(g[0].precio, 55);
  });
});

describe('ordenarProductos', () => {
  test('primero lo que vence antes, luego lo de menor saldo total', () => {
    const grupos = agruparPorProducto([
      fila('TARDE', 'L1', '31/12/27', 5),
      fila('PRONTO-MUCHO', 'L2', '30/09/26', 900),
      fila('PRONTO-POCO', 'L3', '30/09/26', 3)
    ]);

    assert.deepStrictEqual(
      ordenarProductos(grupos).map((g) => g.producto),
      ['PRONTO-POCO', 'PRONTO-MUCHO', 'TARDE']
    );
  });

  test('no altera el arreglo original', () => {
    const grupos = agruparPorProducto([
      fila('B', 'L1', '31/12/27', 1),
      fila('A', 'L2', '30/09/26', 1)
    ]);
    const antes = grupos.map((g) => g.producto);
    ordenarProductos(grupos);
    assert.deepStrictEqual(grupos.map((g) => g.producto), antes);
  });
});

describe('repartirEnLotes', () => {
  // Caso real: PT982 con cuatro lotes.
  const lotesPT982 = [
    { lote: 'F245', fechaVencimiento: '30/09/26', saldo: 120 },
    { lote: 'F244', fechaVencimiento: '30/09/26', saldo: 5 },
    { lote: 'F250', fechaVencimiento: '31/12/26', saldo: 200 }
  ];

  test('lo que cabe en un solo lote no se parte', () => {
    const r = repartirEnLotes(lotesPT982, 3);
    assert.ok(r.ok);
    assert.deepStrictEqual(r.reparto, [
      { lote: 'F244', fechaVencimiento: '30/09/26', cantidad: 3 }
    ]);
  });

  test('agota el lote de menor saldo antes de tocar el siguiente', () => {
    const r = repartirEnLotes(lotesPT982, 100);
    assert.ok(r.ok);
    assert.deepStrictEqual(r.reparto, [
      { lote: 'F244', fechaVencimiento: '30/09/26', cantidad: 5 },
      { lote: 'F245', fechaVencimiento: '30/09/26', cantidad: 95 }
    ]);
  });

  test('reparte entre los tres lotes cuando hace falta, respetando el vencimiento', () => {
    const r = repartirEnLotes(lotesPT982, 300);
    assert.ok(r.ok);
    assert.deepStrictEqual(r.reparto, [
      { lote: 'F244', fechaVencimiento: '30/09/26', cantidad: 5 },
      { lote: 'F245', fechaVencimiento: '30/09/26', cantidad: 120 },
      { lote: 'F250', fechaVencimiento: '31/12/26', cantidad: 175 }
    ]);
  });

  test('la suma del reparto es siempre la cantidad pedida', () => {
    for (const pedida of [1, 5, 6, 124, 125, 126, 325]) {
      const r = repartirEnLotes(lotesPT982, pedida);
      const suma = r.reparto.reduce((s, t) => s + t.cantidad, 0);
      assert.strictEqual(suma, pedida, `fallo con ${pedida}`);
    }
  });

  test('usa hasta el ultimo saldo disponible', () => {
    const r = repartirEnLotes(lotesPT982, 325);
    assert.ok(r.ok);
    assert.strictEqual(r.saldoTotal, 325);
  });

  test('rechaza sin repartir nada si el saldo total no alcanza', () => {
    const r = repartirEnLotes(lotesPT982, 326);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.faltante, 1);
    assert.deepStrictEqual(r.reparto, []);
    assert.match(r.mensaje, /saldo total: 325/);
  });

  test('rechaza cantidades no positivas o no numericas', () => {
    for (const mala of [0, -5, 'abc', null, undefined, NaN]) {
      assert.strictEqual(repartirEnLotes(lotesPT982, mala).ok, false, `acepto ${mala}`);
    }
  });

  test('ignora los lotes con saldo cero', () => {
    const r = repartirEnLotes(
      [
        { lote: 'VACIO', fechaVencimiento: '01/01/26', saldo: 0 },
        { lote: 'BUENO', fechaVencimiento: '30/09/26', saldo: 10 }
      ],
      4
    );
    assert.deepStrictEqual(r.reparto, [
      { lote: 'BUENO', fechaVencimiento: '30/09/26', cantidad: 4 }
    ]);
  });

  test('sin lotes disponibles no reparte', () => {
    assert.strictEqual(repartirEnLotes([], 1).ok, false);
    assert.strictEqual(repartirEnLotes(undefined, 1).ok, false);
  });

  test('no modifica el arreglo de lotes que recibe', () => {
    const copia = lotesPT982.map((l) => ({ ...l }));
    repartirEnLotes(lotesPT982, 300);
    assert.deepStrictEqual(lotesPT982, copia);
  });
});
