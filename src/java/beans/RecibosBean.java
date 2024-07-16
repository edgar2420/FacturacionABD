
package beans;

import dao.RecibosDao;
import dao.ReportesDao;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import javax.enterprise.context.SessionScoped;
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;
import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;
import model.Personas;
import objetos.DetalleCuentasXCobrar;

/**
 *
 * @author marce
 */
@Named(value = "recibosBean")
@SessionScoped
public class RecibosBean implements Serializable {  
    
    private static final long serialVersionUID = 5511011930376333689L;
    private static final String CLASSNAME = RecibosBean.class.getName();
    private static final Logger LOGGER = Logger.getLogger(RecibosBean.class.getName());
    private static final String CABLOG = "FACTURACION-ABD"+"["+CLASSNAME+"]";
    private static final String LOG_ERROR_FILE = "logs/Errores.log";    
    private String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    private String userLogin = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString();
    private String valorBusqueda;
    private String tipoBusqueda;
    private List<Map<String,?>>  listPersonas = new ArrayList<Map<String, ?>>(); 
    private List<Map<String,?>>  listVendedores = new ArrayList<Map<String, ?>>(); 
    private List<DetalleCuentasXCobrar>  listCXC = new ArrayList<>(); ;
    private List<Personas> listClientes;
    private Personas cliente;
    private Personas cliElegido;
    private boolean urlRecibo;
    private boolean imprimir;
    private boolean dataBusqueda;
    private boolean dataClientes;
    private boolean dataDeudas;
    private boolean dataOperaciones;
    
    private boolean verFactura;
    private boolean facturar;
    private String tipImpresion;
    private String pdfRecibo;
    private String clienteElegido;
    private String nroDeposito;
    private String nroRecibo;
    private String codVendedor;
    private String imprimeRecibo="";
    
    private String totImporte;
    private String totPagado;
    private String totSaldo;
    private Double montoPagar;
    private String tipDocPago;
    private String banco;
    private String codMonedaPago;
    private String sCodMonedaPago;
    
    private String clasificador = "CO-ABD";
    private String contabilidad = "A";
    
    private String datos[] = new String[10];
    
    private RecibosDao recibosDao;
    private ReportesDao reportesDao;
    private List<String> bancos;
    
    
    
    FacesMessage msg;
    /*****/
    public String getValorBusqueda() {
        return valorBusqueda;
    }
    public void setValorBusqueda(String valorBusqueda) {
        this.valorBusqueda = valorBusqueda;
    }
    
    public String getTipoBusqueda() {
        return tipoBusqueda;
    }
    public void setTipoBusqueda(String tipoBusqueda) {
        this.tipoBusqueda = tipoBusqueda;
    }
    
    public boolean getUrlRecibo() {
        return urlRecibo;
    }
    public void setUrlRecibo(boolean urlRecibo) {
        this.urlRecibo = urlRecibo;
    }
    
    public boolean getImprimir() {
        return imprimir;
    }
    public void setImprimir(boolean imprimir) {
        this.imprimir = imprimir;
    }

    public List<Map<String, ?>> getListPersonas() {
        return listPersonas;
    }

    public void setListPersonas(List<Map<String, ?>> listPersonas) {
        this.listPersonas = listPersonas;
    }

    public boolean isDataBusqueda() {
        return dataBusqueda;
    }

    public void setDataBusqueda(boolean dataBusqueda) {
        this.dataBusqueda = dataBusqueda;
    }

    public boolean isDataClientes() {
        return dataClientes;
    }

    public void setDataClientes(boolean dataClientes) {
        this.dataClientes = dataClientes;
    }

    public boolean isDataDeudas() {
        return dataDeudas;
    }

    public void setDataDeudas(boolean dataDeudas) {
        this.dataDeudas = dataDeudas;
    }

    public boolean isDataOperaciones() {
        return dataOperaciones;
    }

    public void setDataOperaciones(boolean dataOperaciones) {
        this.dataOperaciones = dataOperaciones;
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

    public String getTipImpresion() {
        return tipImpresion;
    }

    public void setTipImpresion(String tipImpresion) {
        this.tipImpresion = tipImpresion;
    }

    public String getPdfRecibo() {
        return pdfRecibo;
    }

    public void setPdfRecibo(String pdfRecibo) {
        this.pdfRecibo = pdfRecibo;
    }

    public String getClienteElegido() {
        return clienteElegido;
    }

    public void setClienteElegido(String clienteElegido) {
        this.clienteElegido = clienteElegido;
    }

    public List<Personas> getListClientes() {
        return listClientes;
    }

    public void setListClientes(List<Personas> listClientes) {
        this.listClientes = listClientes;
    }

    public Personas getCliente() {
        return cliente;
    }

    public void setCliente(Personas cliente) {
        this.cliente = cliente;
    }

    public Personas getCliElegido() {
        return cliElegido;
    }

    public void setCliElegido(Personas cliElegido) {
        this.cliElegido = cliElegido;
    }

    public List<DetalleCuentasXCobrar> getListCXC() {
        return listCXC;
    }

    public void setListCXC(List<DetalleCuentasXCobrar> listCXC) {
        this.listCXC = listCXC;
    }

    public String getTotImporte() {
        return totImporte;
    }

    public void setTotImporte(String totImporte) {
        this.totImporte = totImporte;
    }

    public String getTotPagado() {
        return totPagado;
    }

    public void setTotPagado(String totPagado) {
        this.totPagado = totPagado;
    }

    public String getTotSaldo() {
        return totSaldo;
    }

    public void setTotSaldo(String totSaldo) {
        this.totSaldo = totSaldo;
    }

    public Double getMontoPagar() {
        return montoPagar;
    }

    public void setMontoPagar(Double montoPagar) {
        this.montoPagar = montoPagar;
    }

    public String getTipDocPago() {
        return tipDocPago;
    }

    public void setTipDocPago(String tipDocPago) {
        this.tipDocPago = tipDocPago;
    }

    public String getBanco() {
        return banco;
    }

    public void setBanco(String banco) {
        this.banco = banco;
    }

    public String getNroDeposito() {
        return nroDeposito;
    }

    public void setNroDeposito(String nroDeposito) {
        this.nroDeposito = nroDeposito;
    }

    public String getNroRecibo() {
        return nroRecibo;
    }

    public void setNroRecibo(String nroRecibo) {
        this.nroRecibo = nroRecibo;
    }

    public String getClasificador() {
        return clasificador;
    }

    public void setClasificador(String clasificador) {
        this.clasificador = clasificador;
    }

    public String getContabilidad() {
        return contabilidad;
    }

    public void setContabilidad(String contabilidad) {
        this.contabilidad = contabilidad;
    }

    public List<Map<String, ?>> getListVendedores() {
        return listVendedores;
    }

    public void setListVendedores(List<Map<String, ?>> listVendedores) {
        this.listVendedores = listVendedores;
    }

    public String getCodVendedor() {
        return codVendedor;
    }

    public void setCodVendedor(String codVendedor) {
        this.codVendedor = codVendedor;
    }

    public String getImprimeRecibo() {
        return imprimeRecibo;
    }

    public void setImprimeRecibo(String imprimeRecibo) {
        this.imprimeRecibo = imprimeRecibo;
    }

    public String getCodMonedaPago() {
        return codMonedaPago;
    }

    public void setCodMonedaPago(String codMonedaPago) {
        this.codMonedaPago = codMonedaPago;
    }

    public List<String> getBancos() {
        return bancos;
    }

    public void setBancos(List<String> bancos) {
        this.bancos = bancos;
    }



  
 

    
    
    /*
    *
    * @author marce        
    */
    public RecibosBean(){        
        this.recibosDao = new RecibosDao();
        this.reportesDao = new ReportesDao();
        inicializa();
        //this.montoPagar = 0.0;
    
    }
    
    public void inicializa(){
        this.dataBusqueda = false;
        this.dataClientes = false;
        this.dataDeudas = false;
        this.dataOperaciones = false;   
        this.urlRecibo = false;
        this.imprimir = false;
        this.tipoBusqueda = "N";
        this.valorBusqueda = "";
        this.banco = "";
        this.clasificador = "CO-ABD";
        this.contabilidad = "B";
        this.nroDeposito= "";
        this.montoPagar = 0.0;
        this.banco = "";
        this.tipDocPago = "EFE";
        this.imprimeRecibo = "";
        //this.codMonedaPago = "false";
    }

    public void inicializaNuevo(){
        this.facturar=false;
        this.imprimir=false;
        this.urlRecibo=true;
        this.dataBusqueda = false;
        this.dataClientes = false;
        this.dataDeudas = false;
        this.dataOperaciones = false;   
        this.tipoBusqueda = "N";
        this.valorBusqueda = "";
        this.banco = "";
        this.clasificador = "CO-ABD";
        this.contabilidad = "B";
        this.nroDeposito= "";
        this.montoPagar = 0.0;
        this.banco = "";
        this.tipDocPago = "EFE";
        //this.codMonedaPago = "false";
    }
    public void busqueda(){
        this.dataClientes = true;
        this.dataDeudas = false;
        this.dataOperaciones = false;   
        this.urlRecibo = false;
        this.imprimir = false;
        this.tipoBusqueda = "N";
        this.valorBusqueda = "";
    }    
    
    public void deudas(){
        this.dataClientes = false;
        this.dataDeudas = true;
        this.dataOperaciones = true;   
        this.urlRecibo = false;
        this.imprimir = false;
    }
    
    public void operaciones(){
        this.dataClientes = false;
        this.dataDeudas = true;
        this.dataOperaciones = true;  
        this.urlRecibo = false;
        this.imprimir = true; 
    }
    
    public void impresion(){
        this.dataClientes = false;
        this.dataDeudas = true;
        this.dataOperaciones = true;   
        this.imprimir = false; 
    } 
    
    public void seteoMoneda(){
       this.codMonedaPago =  getCodMonedaPago();   
    }
    
    public void onDocPagoChanged(){
        this.codMonedaPago = getCodMonedaPago();
        /*if (this.codMonedaPago.equalsIgnoreCase("true"))
            this.sCodMonedaPago="BS";
        else 
            this.sCodMonedaPago ="US";*/
        bancos = new ArrayList<>();
        if (this.tipDocPago.equalsIgnoreCase("TRA")){
            if (this.codMonedaPago.equalsIgnoreCase("BS")){
                bancos.add("BCP-MN");
                bancos.add("BISA-MN");
                bancos.add("BMSC-MN");
                bancos.add("BUSA-MN");
            }
            else{
                bancos.add("BCP-ME");
            }    
        }        
        
    }
    
    public void buscarCliente(ActionEvent event){

        listPersonas = recibosDao.buscarCliente(valorBusqueda, tipoBusqueda);
        //listClientes = recibosDao.buscarClientes(valorBusqueda, tipoBusqueda);
        if (listPersonas.isEmpty()){
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Cliente no encontrado.", "Revise los datos de búsqueda e intente de nuevo." ); 
        }
        else{
            msg = new FacesMessage(FacesMessage.SEVERITY_INFO , "Cliente encontrado.", "Elija la cuenta para realizar operaciones." ); 
        }
        busqueda();
        this.dataClientes = true;
        FacesContext.getCurrentInstance().addMessage("*", msg);
        
        
    }
    
    public void elegirCliente(ActionEvent event){
        //cliente = recibosDao.buscarCliente(clienteElegido);
        System.out.println("ABDFacturacion -> RecibosBean -> elegirCLiente -> codigo: "+cliElegido.getCodigo());
        cliente = recibosDao.buscarCliente(cliElegido.getCodigo());
        this.dataClientes=false;
        this.dataOperaciones=true;
        listCXC = recibosDao.getCuentasXCobrar(cliElegido.getCodigo(), contabilidad);
        datos = recibosDao.getTotalesCuentasXCobrar(cliElegido.getCodigo(), contabilidad);
        this.totImporte = datos[0];
        this.totPagado = datos[1];
        this.totSaldo = datos[2];
        
        
        this.listVendedores =  recibosDao.buscarVendedores("R");
    }
    
    
    public void recibirPago(ActionEvent event){
        String resp, msj;
        int deposito = 0, recibo=0;
        datos = recibosDao.recibirPago(cliente.getCodigo(), clasificador, montoPagar, contabilidad, tipDocPago, banco);
        resp = datos[0];
        this.nroDeposito = datos[1];
        msj = datos[2];
        deposito = Integer.parseInt(nroDeposito);
        if (deposito>0){
            if (this.codMonedaPago.equalsIgnoreCase("true"))
                this.sCodMonedaPago="BS";
            else 
                this.sCodMonedaPago ="US";
                    
            datos = recibosDao.pagarCuentaXCobrar(cliente.getCodigo(), clasificador, montoPagar, deposito, contabilidad, userLogin, "", codVendedor, tipDocPago, banco);
            resp = datos[0];
            nroRecibo = datos[1];
            //recibo = Integer.parseInt(nroRecibo);
            msj = datos[2];       
            if (nroRecibo.length() >0){
                msg = new FacesMessage(FacesMessage.SEVERITY_ERROR , "Pago exitoso. ", "" );
                this.facturar=false;
                this.imprimir=true;
                this.urlRecibo=false;    
                this.dataOperaciones=false;
            }
            else{
                msg = new FacesMessage(FacesMessage.SEVERITY_ERROR , "No se pudo pagar cuenta x cobrar, intente de nuevo. ", "Si el problema persiste consulte con el administrador." );
            }
        }
        else{ 
            msg = new FacesMessage(FacesMessage.SEVERITY_ERROR , "No se pudo reservar pago, Revise el saldo.", msj ); 
            
        }
            
        FacesContext.getCurrentInstance().addMessage("*", msg);

        
    }
    
    public void imprimirRecibo(ActionEvent event) throws Exception{
        FacesMessage msj=null;
        String impresion = "";
        String cadena = "";
        if (this.tipImpresion.equalsIgnoreCase("true"))
            impresion = "R";
        else
            impresion = "C";
        
           this.imprimeRecibo = reportesDao.generaReporteRecibo(nroDeposito, impresion);
           msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Recibo Generado",nroRecibo);           



           FacesContext.getCurrentInstance().addMessage("***", msj) ;
    
            inicializaNuevo();
        
    }
}
