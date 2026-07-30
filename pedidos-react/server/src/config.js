require('dotenv').config();

function requerido(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env y completalo.`
    );
  }
  return valor;
}

module.exports = {
  puerto: Number(process.env.PORT || 3001),
  origenWeb: process.env.WEB_ORIGIN || 'http://localhost:5173',
  secretoSesion: process.env.SESSION_SECRET || 'cambiar-en-produccion',

  oracle: {
    user: requerido('ORACLE_USER'),
    password: requerido('ORACLE_PASSWORD'),
    // Ej: 192.168.0.5:1521/PDBABD
    connectString: requerido('ORACLE_CONNECT_STRING'),
    clientDir: process.env.ORACLE_CLIENT_DIR || null
  }
};
