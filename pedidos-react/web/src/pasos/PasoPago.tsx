/**
 * Paso 4: cerrar el pedido indicando como se paga.
 *
 * Equivale a PedidosBean.pagarPedido() + onDocPagoChanged().
 * Reglas heredadas:
 *  - Si / No / Contra entrega  ->  Contado / CxC / CEntrega
 *  - La razon social y el NIT solo se piden cuando se paga al contado,
 *    porque son los datos con los que se emite la factura.
 *  - El banco solo aparece si la forma de pago es Transferencia.
 */
import { useState } from 'react';
import * as api from '../api';
import { ETIQUETAS_DOC_PAGO, ETIQUETAS_PAGADO, bancosPara, bolivianos, requiereBanco } from '../reglas';
import { Boton, Campo, Tarjeta } from '../componentes/ui';
import { IconoCheck, IconoExito } from '../componentes/iconos';
import type { LineaPedido, Pagado, Pedido, Persona, TipoDocPago } from '../tipos';

export function PasoPago({
  nroPedido,
  cliente,
  detalle,
  pedido,
  alFinalizar,
  alAvisar
}: {
  nroPedido: string;
  cliente: Persona;
  detalle: LineaPedido[];
  pedido: Pedido | null;
  alFinalizar: (pedido: Pedido, detalle: LineaPedido[]) => void;
  alAvisar: (tono: 'exito' | 'error' | 'atencion' | 'info', titulo: string, detalle?: string) => void;
}) {
  const [pagado, setPagado] = useState<Pagado | ''>('');
  const [tipoDocPago, setTipoDocPago] = useState<TipoDocPago | ''>('');
  const [banco, setBanco] = useState('');
  const [razonSocial, setRazonSocial] = useState(cliente.nombre);
  const [nit, setNit] = useState(cliente.ruc);
  const [enviando, setEnviando] = useState(false);

  const esContado = pagado === 'Si';
  const bancos = bancosPara(tipoDocPago);
  const faltaBanco = esContado && requiereBanco(tipoDocPago) && !banco;
  const puedeFinalizar = pagado !== '' && !faltaBanco;

  async function finalizar() {
    if (!puedeFinalizar) return;

    setEnviando(true);
    try {
      const r = await api.pagarPedido(nroPedido, {
        pagado,
        tipoDocPago: esContado ? tipoDocPago : undefined,
        banco: esContado ? banco : undefined,
        razonSocial: esContado ? razonSocial : undefined,
        nit: esContado ? nit : undefined
      });
      alFinalizar(r.pedido, r.detalle);
      alAvisar('exito', 'Pedido finalizado', r.mensaje);
    } catch (err) {
      alAvisar('error', 'No se pudo finalizar', (err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    /* En escritorio el detalle ocupa la columna ancha y los datos de pago
       quedan al lado, acompanando el desplazamiento: asi se ve lo que se
       cobra mientras se llena el formulario. */
    <div className="disposicion">
      <div className="principal">
      <Tarjeta titulo={`Pedido Nº ${nroPedido}`}>
        <div className="tabla-scroll tarjetas-movil">
          <table className="tabla-tarjetas">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>#</th>
                <th className="num">Cant.</th>
                <th className="num">Precio</th>
                <th className="num">Neto</th>
                <th>Lote</th>
              </tr>
            </thead>
            <tbody>
              {detalle.map((l) => (
                <tr key={`${l.item}-${l.codigoItem}`}>
                  <td className="principal-col">
                    {l.descripcion || l.codigoItem}
                  </td>
                  <td data-etiqueta="Ítem">{l.item}</td>
                  <td className="num" data-etiqueta="Cantidad">
                    {l.cantidad} {l.unidad}
                  </td>
                  <td className="num" data-etiqueta="Precio">
                    {bolivianos(l.precioBs)}
                  </td>
                  <td className="num" data-etiqueta="Neto">
                    {bolivianos(l.netoBs)}
                  </td>
                  <td data-etiqueta="Lote">{l.lote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
      </div>

      <aside className="lateral">
      {pedido?.estado === 'PAGADO' || pedido?.pagado ? (
        <Tarjeta titulo="Estado">
          <dl className="datos">
            <dt>Estado</dt>
            <dd>
              <span className="etiqueta exito">
                <IconoExito tam={14} />
                {pedido.estado}
              </span>
            </dd>
            <dt>Forma de pago</dt>
            <dd>{pedido.formaPago}</dd>
            <dt>Neto Bs</dt>
            <dd>{bolivianos(pedido.netoBs)}</dd>
            {pedido.numeroFac && (
              <>
                <dt>Factura</dt>
                <dd>{pedido.numeroFac}</dd>
              </>
            )}
          </dl>
        </Tarjeta>
      ) : (
        <Tarjeta titulo="Datos de pago">
          <Campo etiqueta="¿El pedido fue pagado?">
            <select value={pagado} onChange={(e) => setPagado(e.target.value as Pagado | '')}>
              <option value="">Seleccione una opción</option>
              {(Object.keys(ETIQUETAS_PAGADO) as Pagado[]).map((v) => (
                <option key={v} value={v}>
                  {ETIQUETAS_PAGADO[v]}
                </option>
              ))}
            </select>
          </Campo>

          {esContado && (
            <>
              <div className="fila">
                <Campo etiqueta="Nombre / Razón social">
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="NIT">
                  <input type="text" value={nit} onChange={(e) => setNit(e.target.value)} />
                </Campo>
              </div>

              <Campo etiqueta="Forma de pago">
                <select
                  value={tipoDocPago}
                  onChange={(e) => {
                    setTipoDocPago(e.target.value as TipoDocPago | '');
                    setBanco('');
                  }}
                >
                  <option value="">Seleccione</option>
                  {(Object.keys(ETIQUETAS_DOC_PAGO) as TipoDocPago[]).map((v) => (
                    <option key={v} value={v}>
                      {ETIQUETAS_DOC_PAGO[v]}
                    </option>
                  ))}
                </select>
              </Campo>

              {bancos.length > 0 && (
                <Campo
                  etiqueta="Banco"
                  error={faltaBanco ? 'Seleccione el banco de la transferencia' : undefined}
                >
                  <select value={banco} onChange={(e) => setBanco(e.target.value)}>
                    <option value="">Seleccione banco</option>
                    {bancos.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Campo>
              )}
            </>
          )}

          <Boton
            variante="exito"
            className="bloque"
            cargando={enviando}
            disabled={!puedeFinalizar}
            icono={<IconoCheck />}
            onClick={finalizar}
          >
            Finalizar pedido
          </Boton>
        </Tarjeta>
      )}
      </aside>
    </div>
  );
}
