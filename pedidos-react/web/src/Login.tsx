import { useState } from 'react';
import * as api from './api';
import { Boton, Campo, Tarjeta } from './componentes/ui';
import type { Usuario } from './tipos';

/**
 * Autenticacion contra ABD.PCK_OPERACIONES.F_VALIDA_USUARIO, el mismo
 * procedimiento que usa LoginDao.java. El almacen sale de USUARIOS.UNI_NEG.
 */
export function Login({ alEntrar }: { alEntrar: (usuario: Usuario) => void }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEntrando(true);
    try {
      alEntrar(await api.iniciarSesion(usuario.trim(), password));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEntrando(false);
    }
  }

  return (
    <main className="login">
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="marca">
          <strong>Laboratorios ABD</strong>
          <span>Módulo de Pedidos</span>
        </div>

        <Tarjeta>
          <form onSubmit={entrar}>
            <Campo etiqueta="Usuario">
              <input
                type="text"
                value={usuario}
                autoFocus
                autoComplete="username"
                onChange={(e) => setUsuario(e.target.value)}
              />
            </Campo>

            <Campo etiqueta="Contraseña" error={error || undefined}>
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Campo>

            <Boton
              type="submit"
              className="bloque"
              cargando={entrando}
              disabled={!usuario || !password}
            >
              Ingresar
            </Boton>
          </form>
        </Tarjeta>
      </div>
    </main>
  );
}
