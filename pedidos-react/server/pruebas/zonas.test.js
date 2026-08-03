/**
 * Pruebas del reconocimiento de regiones.
 *
 * Las ciudades de prueba NO son inventadas: estan copiadas tal cual de
 * ABD.PERSONAS y del historico de IBSVENTA.PEDIDOS, faltas de ortografia
 * incluidas. Si esto falla, el aviso saldria en el cliente equivocado.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');

const { regionDeCiudad, regionDeAlmacen, datosAlmacen, comparar, normalizar } = require('../src/zonas');

describe('normalizar', () => {
  test('quita acentos, signos y espacios de mas', () => {
    assert.strictEqual(normalizar('  Santa   Cruz  '), 'SANTA CRUZ');
    assert.strictEqual(normalizar('Potosí'), 'POTOSI');
    assert.strictEqual(normalizar('SANTA CRUZ-MONTERO'), 'SANTA CRUZ MONTERO');
  });

  test('aguanta nulos y vacios', () => {
    assert.strictEqual(normalizar(null), '');
    assert.strictEqual(normalizar(undefined), '');
    assert.strictEqual(normalizar(''), '');
  });
});

describe('regionDeCiudad', () => {
  test('reconoce las ciudades bien escritas', () => {
    assert.strictEqual(regionDeCiudad('SANTA CRUZ'), 'SANTA CRUZ');
    assert.strictEqual(regionDeCiudad('COCHABAMBA'), 'COCHABAMBA');
    assert.strictEqual(regionDeCiudad('LA PAZ'), 'LA PAZ');
    assert.strictEqual(regionDeCiudad('SUCRE'), 'CHUQUISACA');
    assert.strictEqual(regionDeCiudad('ORURO'), 'ORURO');
  });

  test('EL ALTO y VIACHA son La Paz, no otra region', () => {
    assert.strictEqual(regionDeCiudad('EL ALTO'), 'LA PAZ');
    assert.strictEqual(regionDeCiudad('VIACHA'), 'LA PAZ');
    assert.strictEqual(regionDeCiudad('LA PAZ - EL ALTO'), 'LA PAZ');
  });

  test('las localidades del departamento cuentan como Santa Cruz', () => {
    for (const c of [
      'MONTERO', 'WARNES', 'LA GUARDIA', 'EL TORNO', 'YAPACANI',
      'PORTACHUELO', 'SATELITE', 'SATELITE NORTE', 'GUARAYOS', 'CAMIRI'
    ]) {
      assert.strictEqual(regionDeCiudad(c), 'SANTA CRUZ', `fallo con ${c}`);
    }
  });

  test('los compuestos del historico se resuelven', () => {
    for (const c of [
      'SANTA CRUZ-MONTERO', 'SANTA CRUZ-SATELITE', 'SANTA CRUZ-WARNES',
      'SANTA CRUZ-LA GUARDIA', 'SANTA CRUZ-YAPACANI', 'LA GUARDIA-SANTA CRUZ',
      'EL TORNO-SANTA CRUZ', 'SANTA CRUZ MONTERO', 'SANTA CRUZ-CUATRO CAÑADAS',
      'SANTA CRUZANDRES IBAÑEZ'
    ]) {
      assert.strictEqual(regionDeCiudad(c), 'SANTA CRUZ', `fallo con ${c}`);
    }
  });

  test('perdona las faltas de ortografia reales del historico', () => {
    // Todas estas estan de verdad en IBSVENTA.PEDIDOS.
    for (const c of [
      'SANTA RUZ', 'SAANTA CRUZ', 'SANTA CRU', 'SABTA CRUZ',
      'SNTA CRUZ', 'SANTA CRUZZ', 'SANTAC RUZ', 'SANT CRUZ'
    ]) {
      assert.strictEqual(regionDeCiudad(c), 'SANTA CRUZ', `fallo con ${c}`);
    }
  });

  test('CHUQUISACA-MONTEAGUDO y SUCRE-MONTEAGUDO son Chuquisaca', () => {
    assert.strictEqual(regionDeCiudad('CHUQUISACA-MONTEAGUDO'), 'CHUQUISACA');
    assert.strictEqual(regionDeCiudad('SUCRE-MONTEAGUDO'), 'CHUQUISACA');
  });

  test('lo que no se reconoce devuelve null, no una region al azar', () => {
    for (const c of ['', null, undefined, '   ', 'XXXXX', '12345', '(vacio)']) {
      assert.strictEqual(regionDeCiudad(c), null, `no deberia reconocer ${c}`);
    }
  });

  test('no confunde ciudades distintas de nombre parecido', () => {
    assert.strictEqual(regionDeCiudad('POTOSI'), 'POTOSI');
    assert.strictEqual(regionDeCiudad('TARIJA'), 'TARIJA');
    assert.strictEqual(regionDeCiudad('TRINIDAD'), 'BENI');
    assert.notStrictEqual(regionDeCiudad('ORURO'), 'POTOSI');
  });
});

describe('almacenes', () => {
  test('FAB es Santa Cruz, no La Paz: lo dice el historico', () => {
    assert.strictEqual(regionDeAlmacen('AL-VEN-ABD-FAB'), 'SANTA CRUZ');
  });

  test('cada almacen de venta tiene region', () => {
    for (const a of [
      'AL-VEN-ABD-FAB', 'AL-VEN-ABD-CB1', 'AL-VEN-ABD-SUC',
      'AL-VEN-ABD-LPZ', 'AL-VEN-ABD-ORU', 'AL-VEN-ABD-SC8'
    ]) {
      assert.ok(regionDeAlmacen(a), `${a} sin region`);
    }
  });

  test('el almacen de suministros no vende, asi que no tiene region', () => {
    assert.strictEqual(regionDeAlmacen('AL-SUM-ABD-FAB'), null);
  });

  test('un almacen desconocido no revienta', () => {
    assert.strictEqual(datosAlmacen('NO-EXISTE'), null);
    assert.strictEqual(regionDeAlmacen(null), null);
  });
});

describe('comparar', () => {
  test('mismo departamento: coincide', () => {
    assert.strictEqual(comparar('AL-VEN-ABD-FAB', 'SANTA CRUZ').estado, 'coincide');
    assert.strictEqual(comparar('AL-VEN-ABD-FAB', 'MONTERO').estado, 'coincide');
    assert.strictEqual(comparar('AL-VEN-ABD-CB1', 'COCHABAMBA').estado, 'coincide');
  });

  test('departamento distinto: avisa, con un mensaje que se entiende', () => {
    const r = comparar('AL-VEN-ABD-LPZ', 'SANTA CRUZ');
    assert.strictEqual(r.estado, 'otra-region');
    assert.match(r.mensaje, /SANTA CRUZ/);
    assert.match(r.mensaje, /La Paz/);
  });

  test('el caso que preocupaba: almacen de La Paz con cliente de Santa Cruz', () => {
    assert.strictEqual(comparar('AL-VEN-ABD-LPZ', 'SANTA CRUZ').estado, 'otra-region');
    assert.strictEqual(comparar('AL-VEN-ABD-SC8', 'LA PAZ').estado, 'otra-region');
  });

  test('ciudad ilegible: no se avisa nada', () => {
    // No saber no es lo mismo que estar mal: un aviso falso ensena a ignorarlos.
    assert.strictEqual(comparar('AL-VEN-ABD-FAB', 'XXXXX').estado, 'desconocida');
    assert.strictEqual(comparar('AL-VEN-ABD-FAB', null).estado, 'desconocida');
    assert.strictEqual(comparar('AL-VEN-ABD-FAB', '').estado, 'desconocida');
  });

  test('almacen sin region: tampoco se avisa', () => {
    assert.strictEqual(comparar('AL-SUM-ABD-FAB', 'SANTA CRUZ').estado, 'desconocida');
    assert.strictEqual(comparar('NO-EXISTE', 'SANTA CRUZ').estado, 'desconocida');
  });

  test('las variantes sucias de Santa Cruz no disparan avisos falsos', () => {
    for (const c of ['SANTA CRUZ-MONTERO', 'SATELITE', 'SANTA RUZ', 'WARNES']) {
      assert.strictEqual(
        comparar('AL-VEN-ABD-FAB', c).estado,
        'coincide',
        `${c} deberia contar como Santa Cruz`
      );
    }
  });
});
