/**
 * A que region pertenece cada almacen, y a que region pertenece cada cliente.
 *
 * Para que sirve
 * --------------
 * El stock ya esta separado por almacen: F_OBTENER_PRODUCTOS recibe el almacen
 * y solo devuelve lo que hay ahi, y el almacen sale de ABD.USUARIOS.UNI_NEG, no
 * del navegador. Eso ya impide vender existencias de un almacen desde otro.
 *
 * Lo que NO existe en la base es una relacion cliente <-> almacen: ABD.PERSONAS
 * solo tiene CIUDAD, y es texto libre. Asi que aqui no se BLOQUEA nada, solo se
 * AVISA cuando el cliente elegido parece de otra region. Bloquear seria peor:
 * los datos estan demasiado sucios y se perderian ventas buenas.
 *
 * De donde salen estas tablas
 * ---------------------------
 * No de los nombres de los almacenes, que enganan: "AL-VEN-ABD-FAB" suena a
 * fabrica (La Paz), pero el historico dice que el 90% de sus 16.385 pedidos
 * fueron a clientes de SANTA CRUZ. La correspondencia se saco cruzando
 * IBSVENTA.PEDIDOS con la ciudad del cliente.
 *
 * Los almacenes sin historico (LPZ, ORU, SC8, ARG) van por su sufijo, que es lo
 * unico que hay. Si alguno esta mal, se corrige AQUI y en un solo sitio.
 */

/**
 * Localidades que pertenecen a cada region. Salen de las ciudades reales de
 * ABD.PERSONAS y del historico de pedidos.
 */
const REGIONES = {
  'SANTA CRUZ': [
    'SANTA CRUZ', 'MONTERO', 'WARNES', 'LA GUARDIA', 'EL TORNO', 'TORNO',
    'YAPACANI', 'PORTACHUELO', 'BUENA VISTA', 'OKINAWA', 'CHARAGUA',
    'VALLEGRANDE', 'GUARAYOS', 'SATELITE', 'SATELITE NORTE', 'SAN CARLOS',
    'CAMIRI', 'CUATRO CAÑADAS', 'ANDRES IBAÑEZ', 'BELGICA', 'COTOCA',
    'MINEROS', 'SAN JULIAN', 'ASCENSION'
  ],
  'LA PAZ': ['LA PAZ', 'EL ALTO', 'VIACHA', 'ACHOCALLA', 'MECAPACA', 'PALCA'],
  COCHABAMBA: ['COCHABAMBA', 'QUILLACOLLO', 'SACABA', 'TIQUIPAYA', 'PUNATA', 'CHAPARE'],
  CHUQUISACA: ['SUCRE', 'MONTEAGUDO', 'CHUQUISACA'],
  ORURO: ['ORURO', 'HUANUNI', 'CHALLAPATA'],
  POTOSI: ['POTOSI', 'UYUNI', 'LLALLAGUA', 'TUPIZA', 'VILLAZON'],
  TARIJA: ['TARIJA', 'YACUIBA', 'BERMEJO', 'VILLAMONTES'],
  BENI: ['TRINIDAD', 'RIBERALTA', 'GUAYARAMERIN', 'BENI'],
  PANDO: ['COBIJA', 'PANDO'],
  EXTERIOR: ['CARACAS', 'BUENOS AIRES', 'LIMA', 'ARGENTINA']
};

/**
 * Almacen -> region. La columna "origen" dice de donde salio el dato, para que
 * quien lo revise sepa cuanto fiarse.
 */
const ALMACENES = {
  'AL-VEN-ABD-FAB': { region: 'SANTA CRUZ', nombre: 'Fábrica', origen: 'historico: 90% a Santa Cruz' },
  'AL-VEN-ABD-CB1': { region: 'COCHABAMBA', nombre: 'Cochabamba', origen: 'historico: 80% a Cochabamba' },
  'AL-VEN-ABD-SUC': { region: 'CHUQUISACA', nombre: 'Sucre', origen: 'historico: 95% a Sucre' },
  'AL-VEN-ABD-LPZ': { region: 'LA PAZ', nombre: 'La Paz', origen: 'por el sufijo, sin historico' },
  'AL-VEN-ABD-ORU': { region: 'ORURO', nombre: 'Oruro', origen: 'por el sufijo, sin historico' },
  'AL-VEN-ABD-SC8': { region: 'SANTA CRUZ', nombre: 'Santa Cruz', origen: 'por el sufijo, sin historico' },
  'AL-VEN-ABD-ARG': { region: 'EXTERIOR', nombre: 'Argentina', origen: 'por el sufijo, sin historico' },
  'AL-SUM-ABD-FAB': { region: null, nombre: 'Suministros', origen: 'almacen de planta, no vende' }
};

/** Quita acentos, signos y espacios de mas, y pasa a mayusculas. */
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Distancia de edicion (Levenshtein), acotada: en cuanto se pasa del limite se
 * corta. Hace falta porque las ciudades vienen escritas a mano y el historico
 * tiene "SANTA RUZ", "SAANTA CRUZ", "SNTA CRUZ", "SABTA CRUZ", "SANTA CRUZZ"...
 */
function distancia(a, b, limite = 2) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limite) return limite + 1;

  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    let minimo = i;

    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      fila[j] = Math.min(fila[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
      if (fila[j] < minimo) minimo = fila[j];
    }

    // Si la fila entera ya supera el limite, no hay forma de bajar de el.
    if (minimo > limite) return limite + 1;
    previa = fila;
  }

  return previa[b.length];
}

/**
 * A que region pertenece una ciudad escrita a mano.
 *
 * Se prueba en tres pasadas, de la mas segura a la mas permisiva:
 *   1. coincidencia exacta con una localidad conocida
 *   2. la localidad aparece dentro del texto ("SANTA CRUZ-MONTERO" -> MONTERO)
 *   3. parecido con hasta dos letras de diferencia, para las faltas de ortografia
 *
 * Devuelve null si no se reconoce; en ese caso NO se avisa nada, porque no
 * saber no es lo mismo que estar mal.
 */
function regionDeCiudad(ciudad) {
  const texto = normalizar(ciudad);
  if (!texto) return null;

  for (const [region, localidades] of Object.entries(REGIONES)) {
    if (localidades.some((l) => normalizar(l) === texto)) return region;
  }

  for (const [region, localidades] of Object.entries(REGIONES)) {
    // Se ordena de mas larga a mas corta para que "SANTA CRUZ" gane a "CRUZ".
    const ordenadas = [...localidades].sort((a, b) => b.length - a.length);
    if (ordenadas.some((l) => texto.includes(normalizar(l)))) return region;
  }

  for (const [region, localidades] of Object.entries(REGIONES)) {
    // Solo con nombres de cierta longitud: en palabras cortas dos letras de
    // diferencia ya son otra palabra.
    if (localidades.some((l) => normalizar(l).length >= 5 && distancia(texto, normalizar(l)) <= 2)) {
      return region;
    }
  }

  return null;
}

function datosAlmacen(almacen) {
  return ALMACENES[String(almacen || '').toUpperCase()] || null;
}

function regionDeAlmacen(almacen) {
  return datosAlmacen(almacen)?.region ?? null;
}

/**
 * Compara el almacen del vendedor con la ciudad del cliente.
 *
 * Estados:
 *   'coincide'    -> misma region
 *   'otra-region' -> regiones distintas: se avisa, NO se bloquea
 *   'desconocida' -> no se pudo reconocer la ciudad o el almacen: no se avisa
 */
function comparar(almacen, ciudad) {
  const alm = datosAlmacen(almacen);
  const regionCliente = regionDeCiudad(ciudad);

  if (!alm || !alm.region || !regionCliente) {
    return { estado: 'desconocida', regionAlmacen: alm?.region ?? null, regionCliente };
  }

  if (alm.region === regionCliente) {
    return { estado: 'coincide', regionAlmacen: alm.region, regionCliente };
  }

  return {
    estado: 'otra-region',
    regionAlmacen: alm.region,
    regionCliente,
    mensaje:
      `Este cliente figura en ${regionCliente} y usted trabaja con el almacén de ` +
      `${alm.nombre} (${alm.region}). El pedido saldría de ${alm.region}.`
  };
}

module.exports = {
  REGIONES,
  ALMACENES,
  normalizar,
  distancia,
  regionDeCiudad,
  regionDeAlmacen,
  datosAlmacen,
  comparar
};
