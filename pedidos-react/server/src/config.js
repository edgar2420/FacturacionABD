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
  },

  /**
   * Modo desarrollo.
   *
   * El sistema exige que quien entra tenga fila en ABD.USUARIOS, porque de
   * USUARIOS.UNI_NEG sale el almacen con el que se crea el pedido. Cuentas como
   * "abd" (el duenio del esquema) no estan en esa tabla y por eso no pueden
   * entrar, aunque la base las acepte.
   *
   * Si se define ALMACEN_DEV, esas cuentas pueden entrar usando ese almacen.
   * Sirve para probar la interfaz sin dar de alta un usuario. Dejar VACIO en
   * cualquier despliegue real.
   */
  almacenDev: process.env.ALMACEN_DEV || null,

  /**
   * Modo prueba.
   *
   * Con MODO_PRUEBA=1 los pedidos se graban en IBSVENTA.PPEDIDOS y
   * PLIN_PEDIDOS en vez de llamar al paquete, que escribe en las tablas
   * reales. Los catalogos (clientes, vendedores, productos y sus saldos) se
   * siguen leyendo de produccion: solo cambia donde se ESCRIBE.
   *
   * Sirve para recorrer el flujo entero sin dejar pedidos de verdad. Dejar
   * VACIO en cualquier despliegue real.
   */
  modoPrueba: process.env.MODO_PRUEBA === '1'
};
