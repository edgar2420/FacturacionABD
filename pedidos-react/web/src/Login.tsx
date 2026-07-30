import { useState } from 'react';
import * as api from './api';
import { Boton, Campo, Tarjeta } from './componentes/ui';
import { IconoCarrito, IconoOjo, IconoOjoTachado } from './componentes/iconos';
import type { Usuario } from './tipos';

/**
 * Autenticacion contra ABD.PCK_OPERACIONES.F_VALIDA_USUARIO, el mismo
 * procedimiento que usa LoginDao.java. El almacen sale de USUARIOS.UNI_NEG.
 */
export function Login({ alEntrar }: { alEntrar: (usuario: Usuario) => void }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
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
      <div className="caja">
        <div className="marca">
          <span className="glifo">
            <IconoCarrito tam={26} />
          </span>
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
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </Campo>

            <Campo etiqueta="Contraseña" error={error || undefined}>
              <div className="campo-clave">
                <input
                  type={verClave ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="ojo"
                  onClick={() => setVerClave(!verClave)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verClave}
                  title={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verClave ? <IconoOjoTachado /> : <IconoOjo />}
                </button>
              </div>
            </Campo>

            <Boton
              type="submit"
              className="bloque"
              cargando={entrando}
              disabled={!usuario || !password}
              style={{ marginTop: 4 }}
            >
              Ingresar
            </Boton>
          </form>
        </Tarjeta>
      </div>
    </main>
  );
}
