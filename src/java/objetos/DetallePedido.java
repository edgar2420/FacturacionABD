/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package objetos;

/**
 *
 * @author marce
 */
public class DetallePedido {
    private Integer item;
    private String fecha;
    private String estado;
    private String codigoItem;
    private Integer cantidad;
    private String unidad;
    private Double precioBs;
    private Double importeBs;
    private Double descItemBs;
    private Double netoBs;
    private Double porcDescuento;
    private String login;
    private String loginMod;
    private String fechaAct;
    private String fechaMod;
    private String lote;
    private String fechaVencimiento;
    private String descripcion;

    public DetallePedido() {
    }

    public DetallePedido(Integer item, String fecha, String estado, String codigoItem, Integer cantidad, String unidad, Double precioBs, Double importeBs, Double descItemBs, Double netoBs, Double porcDescuento, String login, String loginMod, String fechaAct, String fechaMod, String lote, String fechaVencimiento) {
        this.item = item;
        this.fecha = fecha;
        this.estado = estado;
        this.codigoItem = codigoItem;
        this.cantidad = cantidad;
        this.unidad = unidad;
        this.precioBs = precioBs;
        this.importeBs = importeBs;
        this.descItemBs = descItemBs;
        this.netoBs = netoBs;
        this.porcDescuento = porcDescuento;
        this.login = login;
        this.loginMod = loginMod;
        this.fechaAct = fechaAct;
        this.fechaMod = fechaMod;
        this.lote = lote;
        this.fechaVencimiento = fechaVencimiento;
    }

    public DetallePedido(Integer item, String fecha, String estado, String codigoItem, Integer cantidad, String unidad, Double precioBs, Double importeBs, Double descItemBs, Double netoBs, Double porcDescuento, String login, String loginMod, String fechaAct, String fechaMod, String lote, String fechaVencimiento, String descripcion) {
        this.item = item;
        this.fecha = fecha;
        this.estado = estado;
        this.codigoItem = codigoItem;
        this.cantidad = cantidad;
        this.unidad = unidad;
        this.precioBs = precioBs;
        this.importeBs = importeBs;
        this.descItemBs = descItemBs;
        this.netoBs = netoBs;
        this.porcDescuento = porcDescuento;
        this.login = login;
        this.loginMod = loginMod;
        this.fechaAct = fechaAct;
        this.fechaMod = fechaMod;
        this.lote = lote;
        this.fechaVencimiento = fechaVencimiento;
        this.descripcion = descripcion;
    }

    public Integer getItem() {
        return item;
    }

    public void setItem(Integer item) {
        this.item = item;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCodigoItem() {
        return codigoItem;
    }

    public void setCodigoItem(String codigoItem) {
        this.codigoItem = codigoItem;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }

    public Double getPrecioBs() {
        return precioBs;
    }

    public void setPrecioBs(Double precioBs) {
        this.precioBs = precioBs;
    }

    public Double getImporteBs() {
        return importeBs;
    }

    public void setImporteBs(Double importeBs) {
        this.importeBs = importeBs;
    }

    public Double getDescItemBs() {
        return descItemBs;
    }

    public void setDescItemBs(Double descItemBs) {
        this.descItemBs = descItemBs;
    }

    public Double getNetoBs() {
        return netoBs;
    }

    public void setNetoBs(Double netoBs) {
        this.netoBs = netoBs;
    }

    public Double getPorcDescuento() {
        return porcDescuento;
    }

    public void setPorcDescuento(Double porcDescuento) {
        this.porcDescuento = porcDescuento;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getLoginMod() {
        return loginMod;
    }

    public void setLoginMod(String loginMod) {
        this.loginMod = loginMod;
    }

    public String getFechaAct() {
        return fechaAct;
    }

    public void setFechaAct(String fechaAct) {
        this.fechaAct = fechaAct;
    }

    public String getFechaMod() {
        return fechaMod;
    }

    public void setFechaMod(String fechaMod) {
        this.fechaMod = fechaMod;
    }

    public String getLote() {
        return lote;
    }

    public void setLote(String lote) {
        this.lote = lote;
    }

    public String getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(String fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    @Override
    public String toString() {
        return "DetallePedido{" + "item=" + item + ", fecha=" + fecha + ", estado=" + estado + ", codigoItem=" + codigoItem + ", cantidad=" + cantidad + ", unidad=" + unidad + ", precioBs=" + precioBs + ", importeBs=" + importeBs + ", descItemBs=" + descItemBs + ", netoBs=" + netoBs + ", porcDescuento=" + porcDescuento + ", login=" + login + ", loginMod=" + loginMod + ", fechaAct=" + fechaAct + ", fechaMod=" + fechaMod + ", lote=" + lote + ", fechaVencimiento=" + fechaVencimiento + ", descripcion=" + descripcion + '}';
    }
 
    
}
