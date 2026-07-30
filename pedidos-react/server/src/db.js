/**
 * Pool de conexiones a Oracle.
 *
 * Usa oracledb en modo Thin (no requiere instalar Oracle Instant Client).
 * Si tu base fuera muy antigua y el modo Thin no la soportara, define
 * ORACLE_CLIENT_DIR en el .env para pasar a modo Thick.
 */
const oracledb = require('oracledb');
const config = require('./config');

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = false;

if (config.oracle.clientDir) {
  // Modo Thick: solo si hace falta.
  oracledb.initOracleClient({ libDir: config.oracle.clientDir });
}

let pool = null;

async function iniciarPool() {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: config.oracle.user,
    password: config.oracle.password,
    connectString: config.oracle.connectString,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60
  });

  return pool;
}

async function cerrarPool() {
  if (!pool) return;
  await pool.close(10);
  pool = null;
}

/**
 * Ejecuta una funcion con una conexion prestada del pool y la devuelve
 * siempre, haya o no error.
 */
async function conectar(fn) {
  if (!pool) await iniciarPool();

  let cn;
  try {
    cn = await pool.getConnection();
    return await fn(cn);
  } finally {
    if (cn) {
      try {
        await cn.close();
      } catch {
        /* la conexion ya estaba cerrada */
      }
    }
  }
}

module.exports = { iniciarPool, cerrarPool, conectar };
