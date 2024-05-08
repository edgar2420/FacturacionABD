package beans;

import dao.FacturasDao;
import dao.ReportesDao;
import javax.inject.Named;
import javax.enterprise.context.SessionScoped;
import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Hashtable;
import java.util.List;
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;
import javax.naming.NamingException;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import model.Facturas;
import model.FacturasDgi;
import model.FacturasQr;
import model.LinFacturas;


import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
/**
 *
 * @author marce
 */
@Named(value = "facturasBean")
@SessionScoped
public class FacturasBean implements Serializable{
    
    private static final long serialVersionUID = 6451011930376333689L;
    private String rol;//  = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "rol").toString(); 
    private String usuario;//  = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString(); 
    private String unidad ;// = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "unidad").toString(); 
    
    String ruta = "";
    
    private String tipo;
    private String fecha;
    private Integer numero;
    private String numeroOrden;
    private String almacen;
    private String almacenDespacho;
    private String moneda;
    private String cotizacion;
    private String estado;
    private String correo;
    private String imprimeFact;
    
    private String nit;
    private String razonSocial;
    
    private String datos[] = new String[3];
    private String datosQR[] = new String[3];
    private String numFactura;
    private String numAutorizacion;
    private String tipImpresion;
    
    private boolean verFactura;
    private boolean facturar;
    private boolean imprimir;
    private boolean urlFactura;
    
    private Facturas facturas;
    private LinFacturas linFacturas;
    private List<LinFacturas> listLinFacturas  = new ArrayList<>();
    private FacturasDgi facturasDgi;
    private FacturasQr facturasQr;
    
    private FacturasDao facturasDao;
    private ReportesDao reportesDao;
    
    
    SimpleDateFormat formato = new SimpleDateFormat("dd/MM/yyyy"); 
    private String fechaFormato;  
    
    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public String getAlmacen() {
        return almacen;
    }

    public void setAlmacen(String almacen) {
        this.almacen = almacen;
    }

    public String getAlmacenDespacho() {
        return almacenDespacho;
    }

    public void setAlmacenDespacho(String almacenDespacho) {
        this.almacenDespacho = almacenDespacho;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public String getCotizacion() {
        return cotizacion;
    }

    public void setCotizacion(String cotizacion) {
        this.cotizacion = cotizacion;
    }

    public Facturas getFacturas() {
        return facturas;
    }

    public void setFacturas(Facturas facturas) {
        this.facturas = facturas;
    }

    public LinFacturas getLinFacturas() {
        return linFacturas;
    }

    public void setLinFacturas(LinFacturas linFacturas) {
        this.linFacturas = linFacturas;
    }

    public List<LinFacturas> getListLinFacturas() {
        return listLinFacturas;
    }

    public void setListLinFacturas(List<LinFacturas> listLinFacturas) {
        this.listLinFacturas = listLinFacturas;
    }

    public FacturasDgi getFacturasDgi() {
        return facturasDgi;
    }

    public void setFacturasDgi(FacturasDgi facturasDgi) {
        this.facturasDgi = facturasDgi;
    }

    public FacturasQr getFacturasQr() {
        return facturasQr;
    }

    public void setFacturasQr(FacturasQr facturasQr) {
        this.facturasQr = facturasQr;
    }

    public String getFechaFormato() {
        return fechaFormato;
    }

    public void setFechaFormato(String fechaFormato) {
        this.fechaFormato = fechaFormato;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getNumeroOrden() {
        return numeroOrden;
    }

    public void setNumeroOrden(String numeroOrden) {
        this.numeroOrden = numeroOrden;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public boolean isVerFactura() {
        return verFactura;
    }

    public void setVerFactura(boolean verFactura) {
        this.verFactura = verFactura;
    }

    public boolean isFacturar() {
        return facturar;
    }

    public void setFacturar(boolean facturar) {
        this.facturar = facturar;
    }

    public boolean isImprimir() {
        return imprimir;
    }

    public void setImprimir(boolean imprimir) {
        this.imprimir = imprimir;
    }

    public boolean isUrlFactura() {
        return urlFactura;
    }

    public void setUrlFactura(boolean urlFactura) {
        this.urlFactura = urlFactura;
    }

    public String getRuta() {
        return ruta;
    }

    public void setRuta(String ruta) {
        this.ruta = ruta;
    }

    public String getNumFactura() {
        return numFactura;
    }

    public void setNumFactura(String numFactura) {
        this.numFactura = numFactura;
    }

    public String getNumAutorizacion() {
        return numAutorizacion;
    }

    public void setNumAutorizacion(String numAutorizacion) {
        this.numAutorizacion = numAutorizacion;
    }

    public String getTipImpresion() {
        return tipImpresion;
    }

    public void setTipImpresion(String tipImpresion) {
        this.tipImpresion = tipImpresion;
    }

    public String getImprimeFact() {
        return imprimeFact;
    }

    public void setImprimeFact(String imprimeFact) {
        this.imprimeFact = imprimeFact;
    }

    public String getNit() {
        return nit;
    }

    public void setNit(String nit) {
        this.nit = nit;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }



    
   
    public FacturasBean(){
        this.facturasDao = new FacturasDao();
        this.reportesDao = new ReportesDao();
        this.facturas = new  Facturas();
        this.linFacturas = new LinFacturas();
        this.facturasDgi = new FacturasDgi();
            this.facturasQr = new FacturasQr();
        this.fechaFormato = formato.format(new Date());
        this.fecha = fechaFormato;
        this.ruta = "inicio";
        this.tipo = "VD1";
        this.almacen = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "unidad").toString(); 
        if (this.listLinFacturas != null)
            this.listLinFacturas.clear();
        this.verFactura = false;
        this.facturar = false;
        this.imprimir = false;
        this.urlFactura = false;
        this.correo = "laboratorios.abd@gmail.com";
        rol = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "rol").toString(); 
        usuario = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString(); 
        unidad = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "unidad").toString(); 
        this.numAutorizacion = "";
        this.numFactura = "";
        this.imprimeFact = "";
        this.nit = "";
        this.razonSocial = "";
        
    }
    
    public void buscarFactura(ActionEvent event){       
        this.urlFactura = false;
        FacesMessage msj=null;
        facturas = facturasDao.buscarPreFactura(almacen, tipo, numero, fecha);
        listLinFacturas = facturasDao.buscarDetalleFactura(almacen, tipo, numero, fecha);
        if (facturas==null){
            msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Recibo No encontrado", " Tipo: "+tipo+" Numero: "+numero+" Fecha: "+fecha+" ALmacen= "+almacen);  
        }
        else{
            this.verFactura = true;
            if (facturas.getFlagFactura().equalsIgnoreCase("X")){
                this.facturar = true;
                this.datos = facturasDao.verEstadoFactura(almacen, tipo, numero.toString(), facturas.getId().getNumeroOrden());
                if (datos[0].equalsIgnoreCase("1")){
                    this.facturar = false;
                    this.imprimir = true;
                    this.urlFactura = false;
                    this.numFactura = datos[1];
                    this.numAutorizacion = datos[2];
                }
            }
            msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Factura encontrada","");  

        }
        FacesContext.getCurrentInstance().addMessage("***", msj) ;
    }    
    
    public void buscarPreFactura(ActionEvent event){     
        this.urlFactura = false;
        this.imprimir = false;
        this.razonSocial = "";
        this.nit = "";
        this.facturar = true;
        FacesMessage msj=null;
        facturas = facturasDao.buscarPreFactura(almacen, tipo, numero, fecha);
        listLinFacturas = facturasDao.buscarDetalleFactura(almacen, tipo, numero, fecha);
        if (facturas==null){
            msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Recibo No encontrado", " Tipo: "+tipo+" Numero: "+numero+" Fecha: "+fecha+" ALmacen= "+almacen);  
        }
        else{
            this.verFactura = true;
            if (facturas.getFlagFactura().equalsIgnoreCase("1")){
                this.facturar = true;
                this.razonSocial = facturas.getNombre();
                this.nit = facturas.getRuc();
                this.datos = facturasDao.verEstadoFactura(almacen, tipo, numero.toString(), facturas.getId().getNumeroOrden());
                if (datos[0].equalsIgnoreCase("1")){
                    this.imprimir = false;
                    this.urlFactura = false;
                    this.numFactura = datos[1];
                    this.numAutorizacion = datos[2];
                }
            }
            else  if(facturas.getFlagFactura().equalsIgnoreCase("X")){
                this.facturar = false;
                this.razonSocial = facturas.getNombre();
                this.nit = facturas.getRuc();
                this.datos = facturasDao.verEstadoFactura(almacen, tipo, numero.toString(), facturas.getId().getNumeroOrden());
                if (datos[0].equalsIgnoreCase("1")){
                    this.imprimir = true;
                    this.urlFactura = false;
                    this.numFactura = datos[1];
                    this.numAutorizacion = datos[2];
                }
            
            }
            
           msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "PreFactura encontrada","");  

        }
        FacesContext.getCurrentInstance().addMessage("***", msj) ;
    }
            
    public void facturarPago(ActionEvent event){
        FacesMessage msj=null;
        Date date = new Date();
        String respuesta = "";
        SimpleDateFormat format1 = new SimpleDateFormat("dd/MM/yyyy");
        String fecha = format1.format(date);
        this.datos = facturasDao.facturar(almacen, tipo, numero.toString(), facturas.getId().getNumeroOrden(), fecha, facturas.getNeto(), facturas.getGestionCc(), facturas.getPeriodoCc(), nit,razonSocial);
        if (datos[0].equalsIgnoreCase("1")){
            this.facturar = false;
            this.imprimir = true;
            this.urlFactura = false;
        }        
        this.facturar=false;
        this.imprimir=true;/*
        facturas = facturasDao.buscarPreFactura(almacen, tipo, numero, fecha);
        if (facturas.getFlagFactura().equalsIgnoreCase("1")){
            this.facturar = true;
            this.razonSocial = facturas.getNombre();
            this.nit = facturas.getRuc();
            this.datos = facturasDao.verEstadoFactura(almacen, tipo, numero.toString(), facturas.getId().getNumeroOrden());
            this.numFactura = datos[1];
            this.numAutorizacion = datos[2];
            if (datos[0].equalsIgnoreCase("1")){
                this.imprimir = false;
                this.urlFactura = false;
                this.numFactura = datos[1];
                this.numAutorizacion = datos[2];
            }
        }
        else {
            this.facturar = false;
            this.razonSocial = facturas.getNombre();
            this.nit = facturas.getRuc();
            this.datos = facturasDao.verEstadoFactura(almacen, tipo, numero.toString(), facturas.getId().getNumeroOrden());
            
                this.numFactura = datos[1];
                this.numAutorizacion = datos[2];
            if (datos[0].equalsIgnoreCase("1")){
                this.imprimir = true;
                this.urlFactura = false;
                this.numFactura = datos[1];
                this.numAutorizacion = datos[2];
            }
        }*/
        
        System.out.println("FacturacionABD -> FacturasBean -> facturarPago  -> Almacen: "+almacen+" Tipo: "+tipo+" Numero;  "+numero.toString()+" Orden: "+facturas.getId().getNumeroOrden());
        respuesta = facturasDao.verificaEstadoFactura(almacen, tipo, numero.toString(), facturas.getId().getNumeroOrden());
        if (respuesta.equalsIgnoreCase("1")){
            this.facturar=false;
            this.imprimir=true;
            System.out.println("FacturacionABD -> FacturasBean -> facturarPago -> Fin. Almacen: "+almacen+" Tipo: "+tipo+" Numero;  "+numero.toString()+" Orden: "+facturas.getId().getNumeroOrden());
            msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "La Factura se proceso con Exito.","");           
            FacesContext.getCurrentInstance().addMessage("***", msj) ;
            
        }
        
        
    }   
    
    public void imprimirFactura(ActionEvent event) throws Exception{
        FacesMessage msj=null;
        String impresion = "";
        String cadena = "";
        if (this.tipImpresion.equalsIgnoreCase("true"))
            impresion = "R";
        else
            impresion = "C";
        this.datosQR = facturasDao.verificaQR(numFactura, numAutorizacion);
        if (datosQR[0].equalsIgnoreCase("E"))           
           msj = new FacesMessage(FacesMessage.SEVERITY_ERROR,  "Factura sin QR TXT, consulte con el administrador.",numFactura);           
        else{
           if  (datosQR[0].equalsIgnoreCase("1")){
              cadena = reportesDao.generaQR(datosQR[1], numFactura+"-"+numAutorizacion);
           }
           this.imprimeFact = reportesDao.generaReporteFactura(impresion, numFactura, numAutorizacion);
           msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Factura Generada",numFactura);           



           FacesContext.getCurrentInstance().addMessage("***", msj) ;
           this.facturar=false;
           this.imprimir=false;
           this.urlFactura=true;    
        }
        
            

    }
            
    public void validateEmail() {
        String email = this.correo;
        if (!isValid(email)) {
            FacesContext.getCurrentInstance().addMessage(null, new FacesMessage(FacesMessage.SEVERITY_ERROR, "Error", email + " No es una dirección de correo válida")); 
        }

        
    }
    
    
   boolean isValid(String email) {
 
        // Reqular expression pattern to validate the format submitted
        String validator = "^[_a-zA-Z0-9-]+(\\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+"
                + "(\\.[a-zA-Z0-9-]+)*(\\.[a-zA-Z]{2,})$"; 
        if (!email.matches(validator)) {
            return false;
        } 
        // Split the user and the domain name
        String[] parts = email.split("@"); 
        boolean retval=true;
        // This is similar to nslookup –q=mx domain_name.com to query
        // the mail exchanger of the domain.
        try {
            Hashtable<String, String> env = new Hashtable<String, String>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            DirContext context = new InitialDirContext(env);
            Attributes attributes = context.getAttributes(parts[1], new String[]{"MX"});
            Attribute attribute = attributes.get("MX");
            if (attribute.size() == 0) {
               retval=false;
            }
            context.close();
            return retval; 
        } catch (NamingException exception) {
            return false;
        }        
    }    
    
}
