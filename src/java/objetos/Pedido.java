/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package objetos;

/**
 *
 * @author marce
 */
public class Pedido {
    private String almacen;
    private String numero;    
    private String cliente;
    private String nombre;
    private String fecha;
    private String estado;
    private String fechaEntrega;
    private Double netoBs;
    private Double netoMe;
    private String login;
    private String loginMod;
    private String fechaAct;
    private String fechaMod;
    private String codVendedor;
    private String formaPago;
    private String pagado;
    private String tipoPago;
    private String analitico;
    private String autorizacionDgi;
    private String numeroDgi;
    private String tipoFac;
    private String numeroFac;
    private String ordenFac;
    private String razonSocial;
    private String nit;
            
            
            
    public Pedido() {
    }

    public Pedido(String almacen, String numero, String cliente, String nombre, String fecha, String estado, String fechaEntrega, Double netoBs, Double netoMe, String login, String loginMod, String fechaAct, String fechaMod, String codVendedor, String formaPago, String pagado, String tipoPago, String analitico, String autorizacionDgi, String numeroDgi, String tipoFac, String numeroFac, String ordenFac, String razonSocial, String nit) {
        this.almacen = almacen;
        this.numero = numero;
        this.cliente = cliente;
        this.nombre = nombre;
        this.fecha = fecha;
        this.estado = estado;
        this.fechaEntrega = fechaEntrega;
        this.netoBs = netoBs;
        this.netoMe = netoMe;
        this.login = login;
        this.loginMod = loginMod;
        this.fechaAct = fechaAct;
        this.fechaMod = fechaMod;
        this.codVendedor = codVendedor;
        this.formaPago = formaPago;
        this.pagado = pagado;
        this.tipoPago = tipoPago;
        this.analitico = analitico;
        this.autorizacionDgi = autorizacionDgi;
        this.numeroDgi = numeroDgi;
        this.tipoFac = tipoFac;
        this.numeroFac = numeroFac;
        this.ordenFac = ordenFac;
        this.razonSocial = razonSocial;
        this.nit = nit;
    }



    public String getAlmacen() {
        return almacen;
    }

    public void setAlmacen(String almacen) {
        this.almacen = almacen;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getCliente() {
        return cliente;
    }

    public void setCliente(String cliente) {
        this.cliente = cliente;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
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

    public String getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(String fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public Double getNetoBs() {
        return netoBs;
    }

    public void setNetoBs(Double netoBs) {
        this.netoBs = netoBs;
    }

    public Double getNetoMe() {
        return netoMe;
    }

    public void setNetoMe(Double netoMe) {
        this.netoMe = netoMe;
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

    public String getCodVendedor() {
        return codVendedor;
    }

    public void setCodVendedor(String codVendedor) {
        this.codVendedor = codVendedor;
    }

    public String getFormaPago() {
        return formaPago;
    }

    public void setFormaPago(String formaPago) {
        this.formaPago = formaPago;
    }

    public String getPagado() {
        return pagado;
    }

    public void setPagado(String pagado) {
        this.pagado = pagado;
    }

    public String getTipoPago() {
        return tipoPago;
    }

    public void setTipoPago(String tipoPago) {
        this.tipoPago = tipoPago;
    }

    public String getAnalitico() {
        return analitico;
    }

    public void setAnalitico(String analitico) {
        this.analitico = analitico;
    }

    public String getAutorizacionDgi() {
        return autorizacionDgi;
    }

    public void setAutorizacionDgi(String autorizacionDgi) {
        this.autorizacionDgi = autorizacionDgi;
    }

    public String getNumeroDgi() {
        return numeroDgi;
    }

    public void setNumeroDgi(String numeroDgi) {
        this.numeroDgi = numeroDgi;
    }

    public String getTipoFac() {
        return tipoFac;
    }

    public void setTipoFac(String tipoFac) {
        this.tipoFac = tipoFac;
    }

    public String getNumeroFac() {
        return numeroFac;
    }

    public void setNumeroFac(String numeroFac) {
        this.numeroFac = numeroFac;
    }

    public String getOrdenFac() {
        return ordenFac;
    }

    public void setOrdenFac(String ordenFac) {
        this.ordenFac = ordenFac;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getNit() {
        return nit;
    }

    public void setNit(String nit) {
        this.nit = nit;
    }

    @Override
    public String toString() {
        return "Pedido{" + "almacen=" + almacen + ", numero=" + numero + ", cliente=" + cliente + ", nombre=" + nombre + ", fecha=" + fecha + ", estado=" + estado + ", fechaEntrega=" + fechaEntrega + ", netoBs=" + netoBs + ", netoMe=" + netoMe + ", login=" + login + ", loginMod=" + loginMod + ", fechaAct=" + fechaAct + ", fechaMod=" + fechaMod + ", codVendedor=" + codVendedor + ", formaPago=" + formaPago + ", pagado=" + pagado + ", tipoPago=" + tipoPago + ", analitico=" + analitico + ", autorizacionDgi=" + autorizacionDgi + ", numeroDgi=" + numeroDgi + ", tipoFac=" + tipoFac + ", numeroFac=" + numeroFac + ", ordenFac=" + ordenFac + ", razonSocial=" + razonSocial + ", nit=" + nit + '}';
    }
    
    
}
