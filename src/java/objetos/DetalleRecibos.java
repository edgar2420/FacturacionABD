/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package objetos;

/**
 *
 * @author marce
 */
public class DetalleRecibos {
    private String nroDeposito;
    private String codCliente;
    private String fecha;
    private String usuario;
    private String monto;
    private String tipPago;

    public String getNroDeposito() {
        return nroDeposito;
    }

    public void setNroDeposito(String nroDeposito) {
        this.nroDeposito = nroDeposito;
    }

    public String getCodCliente() {
        return codCliente;
    }

    public void setCodCliente(String codCliente) {
        this.codCliente = codCliente;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getMonto() {
        return monto;
    }

    public void setMonto(String monto) {
        this.monto = monto;
    }

    public String getTipPago() {
        return tipPago;
    }

    public void setTipPago(String tipPago) {
        this.tipPago = tipPago;
    }

    public DetalleRecibos() {
    }

    public DetalleRecibos(String nroDeposito, String codCliente, String fecha, String usuario, String monto, String tipPago) {
        this.nroDeposito = nroDeposito;
        this.codCliente = codCliente;
        this.fecha = fecha;
        this.usuario = usuario;
        this.monto = monto;
        this.tipPago = tipPago;
    }
    
    
    
}
