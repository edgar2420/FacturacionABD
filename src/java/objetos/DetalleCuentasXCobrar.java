/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package objetos;

/**
 *
 * @author marce
 */
public class DetalleCuentasXCobrar {
    
    private String gestion;
    private String periodo;
    private String fecha;
    private String importe;
    private String pagado;
    private String saldo;
    private String fechaCorte;

    public String getGestion() {
        return gestion;
    }

    public void setGestion(String gestion) {
        this.gestion = gestion;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getImporte() {
        return importe;
    }

    public void setImporte(String importe) {
        this.importe = importe;
    }

    public String getPagado() {
        return pagado;
    }

    public void setPagado(String pagado) {
        this.pagado = pagado;
    }

    public String getSaldo() {
        return saldo;
    }

    public void setSaldo(String saldo) {
        this.saldo = saldo;
    }

    public String getFechaCorte() {
        return fechaCorte;
    }

    public void setFechaCorte(String fechaCorte) {
        this.fechaCorte = fechaCorte;
    }

    public DetalleCuentasXCobrar() {
    }

    public DetalleCuentasXCobrar(String gestion, String periodo, String fecha, String importe, String pagado, String saldo, String fechaCorte) {
        this.gestion = gestion;
        this.periodo = periodo;
        this.fecha = fecha;
        this.importe = importe;
        this.pagado = pagado;
        this.saldo = saldo;
        this.fechaCorte = fechaCorte;
    }
    
    
    
}
