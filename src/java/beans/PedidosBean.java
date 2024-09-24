package beans;

import dao.PedidosDao; 
import dao.ReportesDao;
import java.io.Serializable;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.enterprise.context.SessionScoped;
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;
import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;
import model.Personas;
import objetos.DetalleCuentasXCobrar;
import objetos.DetallePedido;
import objetos.DetalleProductos;
import objetos.Pedido;

/**
 *
 * @author marce
 */
@Named(value = "pedidosBean")
@SessionScoped
public class PedidosBean implements Serializable{
    private static final long serialVersionUID = 5511011930376333689L;
    private static final String CLASSNAME = PedidosBean.class.getName();
    private static final Logger LOGGER = Logger.getLogger(PedidosBean.class.getName());
    private static final String CABLOG = "PEDIDOS-ABD"+"["+CLASSNAME+"]";
    private static final String LOG_ERROR_FILE = "logs/Errores.log";    
    private String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    private String userLogin = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString();
    private String valorBusqueda, productoBusqueda;
    private String tipoBusqueda;
    private List<Map<String,?>>  listPersonas = new ArrayList<Map<String, ?>>(); 
    private List<Map<String,?>>  listVendedores = new ArrayList<Map<String, ?>>(); 
    private List<DetalleCuentasXCobrar>  listCXC = new ArrayList<>(); 
    private List<Personas> listClientes;
    private Personas cliente;
    private Personas cliElegido;
    private boolean urlRecibo;
    private boolean imprimir;
    private boolean dataBusqueda;
    private boolean dataClientes;
    private boolean dataPedido;
    private boolean dataFiltro;
    private boolean dataPedidoCrear;
    private boolean dataPedidoAdicionar;
    private boolean dataPedidoTerminar;
    private boolean dataPedidoPagar;
    private boolean dataOperaciones;
    private boolean dataDetallePedido;
    private boolean dataPedidoNuevo;
    private boolean dataPedidoFinalizar;
    private boolean dataBano;
    
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
    private String pagado;
    private String tipDocPago;
    private String banco;
    private String codMonedaPago;
    private String sCodMonedaPago;
    private String formaPago;
    private String razonSocial;
    private String nit;
    
    private String clasificador = "CO-ABD";
    private String contabilidad = "A";
    
    private String datos[] = new String[10];
    private ArrayList<String> respuestas = new ArrayList<>();
    
    private PedidosDao pedidosDao;
    private ReportesDao reportesDao;
    private List<String> bancos;
    
    private String fechaEntrega;
    private String producto;
    private List<DetalleProductos>  listProductos = new ArrayList<>();    
    private List<DetallePedido>  detallePedido = new ArrayList<>(); 
    private Pedido pedido;
    private String almacen;
    private DetalleProductos productoElegido;
    private Integer cantidadReserva = 0;
    
    private String nroPedido = "";
    private String mensaje;
    
    FacesMessage msg;
    /*****/
    public String getValorBusqueda() {
        return valorBusqueda;
    }
    public void setValorBusqueda(String valorBusqueda) {
        this.valorBusqueda = valorBusqueda;
    }

    public String getProductoBusqueda() {
        return productoBusqueda;
    }

    public void setProductoBusqueda(String productoBusqueda) {
        this.productoBusqueda = productoBusqueda;
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

    public String getPagado() {
        return pagado;
    }

    public void setPagado(String pagado) {
        this.pagado = pagado;
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

    public String getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(String fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public String getProducto() {
        return producto;
    }

    public void setProducto(String producto) {
        this.producto = producto;
    }
    public String getAlmacen() {
        return almacen;
    }

    public void setAlmacen(String almacen) {
        this.almacen = almacen;
    }

    public List<DetalleProductos> getListProductos() {
        return listProductos;
    }

    public void setListProductos(List<DetalleProductos> listProductos) {
        this.listProductos = listProductos;
    }

    public DetalleProductos getProductoElegido() {
        return productoElegido;
    }

    public void setProductoElegido(DetalleProductos productoElegido) {
        this.productoElegido = productoElegido;
    }

    public Integer getCantidadReserva() {
        return cantidadReserva;
    }

    public void setCantidadReserva(Integer cantidadReserva) {
        this.cantidadReserva = cantidadReserva;
    }

    public boolean isDataPedido() {
        return dataPedido;
    }

    public void setDataPedido(boolean dataPedido) {
        this.dataPedido = dataPedido;
    }

    public boolean isDataDetallePedido() {
        return dataDetallePedido;
    }

    public void setDataDetallePedido(boolean dataDetallePedido) {
        this.dataDetallePedido = dataDetallePedido;
    }

    public boolean isDataPedidoCrear() {
        return dataPedidoCrear;
    }

    public void setDataPedidoCrear(boolean dataPedidoCrear) {
        this.dataPedidoCrear = dataPedidoCrear;
    }

    public boolean isDataPedidoAdicionar() {
        return dataPedidoAdicionar;
    }

    public void setDataPedidoAdicionar(boolean dataPedidoAdicionar) {
        this.dataPedidoAdicionar = dataPedidoAdicionar;
    }

    public boolean isDataPedidoTerminar() {
        return dataPedidoTerminar;
    }

    public void setDataPedidoTerminar(boolean dataPedidoTerminar) {
        this.dataPedidoTerminar = dataPedidoTerminar;
    }

    public String getNroPedido() {
        return nroPedido;
    }

    public void setNroPedido(String nroPedido) {
        this.nroPedido = nroPedido;
    }

    public List<DetallePedido> getDetallePedido() {
        return detallePedido;
    }

    public void setDetallePedido(List<DetallePedido> detallePedido) {
        this.detallePedido = detallePedido;
    }

    public boolean isDataPedidoPagar() {
        return dataPedidoPagar;
    }

    public void setDataPedidoPagar(boolean dataPedidoPagar) {
        this.dataPedidoPagar = dataPedidoPagar;
    }

    public String getFormaPago() {
        return formaPago;
    }

    public void setFormaPago(String formaPago) {
        this.formaPago = formaPago;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public void setPedido(Pedido pedido) {
        this.pedido = pedido;
    }

    public boolean isDataFiltro() {
        return dataFiltro;
    }

    public void setDataFiltro(boolean dataFiltro) {
        this.dataFiltro = dataFiltro;
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

    public boolean isDataPedidoNuevo() {
        return dataPedidoNuevo;
    }

    public void setDataPedidoNuevo(boolean dataPedidoNuevo) {
        this.dataPedidoNuevo = dataPedidoNuevo;
    }

    public boolean isDataBano() {
        return dataBano;
    }

    public void setDataBano(boolean dataBano) {
        this.dataBano = dataBano;
    }

    public boolean isDataPedidoFinalizar() {
        return dataPedidoFinalizar;
    }

    public void setDataPedidoFinalizar(boolean dataPedidoFinalizar) {
        this.dataPedidoFinalizar = dataPedidoFinalizar;
    }

   
    
    /*
    *
    * @author marce        
    */
    public PedidosBean(){        
        this.pedidosDao = new PedidosDao();
        inicializa();
        //this.montoPagar = 0.0;
    
    }
    
    public void inicializa(){
        this.dataBusqueda = true;
        this.dataClientes = false;
        this.dataPedido = false;
        this.dataDetallePedido = false;
        this.dataOperaciones = false;
        this.dataFiltro = false;
        this.dataPedidoCrear = false;
        this.dataPedidoAdicionar = false;
        this.dataPedidoTerminar = false;
        this.dataPedidoPagar = false;
        this.dataPedidoNuevo = false;
        this.dataBano = false;
        this.dataPedidoFinalizar = true;
        this.producto = "";
        this.listPersonas.clear();
        this.listProductos.clear();
        this.detallePedido.clear();
        this.almacen = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "unidad").toString(); 
        this.valorBusqueda = "";
        this.productoBusqueda = "";
        this.tipoBusqueda = "";
        this.cantidadReserva = 0;
        this.nroPedido = "";
        this.formaPago = "";
        this.tipDocPago = "";
        this.banco = "";
        this.razonSocial = "";
        this.nit = "";
        this.pagado = "No";
        //this.codMonedaPago = "false";
    }

    public void inicializaNuevo(){
        this.dataPedidoCrear = false;
        this.dataPedidoAdicionar = false;
        this.dataPedidoTerminar = false;
        this.dataBusqueda = false;
        this.dataClientes = false;
        this.dataPedido = false;
        this.dataDetallePedido = false;
        this.dataOperaciones = false;   
        this.dataFiltro = false;
        this.dataPedidoPagar = false;
        this.dataPedidoNuevo = false;
        this.dataBano = false;
        this.dataPedidoFinalizar = true;
        this.listPersonas.clear();
        this.listProductos.clear();
        this.detallePedido.clear();
        this.razonSocial = "";
        this.nit = "";
        this.pagado = "No";
        //this.codMonedaPago = "false";
    }
    public void busqueda(){
        this.dataBusqueda = true;
        this.dataClientes = true;   
        this.dataPedido = false;
        this.dataDetallePedido = false;
        this.dataOperaciones = false;   
        this.dataFiltro = false;
        this.dataPedidoCrear = false;
        this.dataPedidoAdicionar = false;
        this.dataPedidoTerminar = false;
        this.valorBusqueda = "";
        this.productoBusqueda = "";
    }     
    
    public void pedidos(){
        this.dataBusqueda = false;
        this.dataClientes = false;
        this.dataPedido = true;
        this.dataDetallePedido = true;
        this.dataOperaciones = false;
        this.dataFiltro = false;
        this.dataPedidoCrear = false;
        this.dataPedidoAdicionar = false;
        this.dataPedidoTerminar = false;
    }
    
    public void operaciones(){
        this.dataBusqueda = false;
        this.dataClientes = false;
        this.dataPedido = true;
        this.dataOperaciones = true; 
        this.dataFiltro = true;
        if (!this.dataPedidoAdicionar){
            this.dataPedidoCrear = true;
            this.dataPedidoAdicionar = false;
            this.dataPedidoTerminar = false;
        }
        this.valorBusqueda = "";
        //this.tipoBusqueda = "";
        this.cantidadReserva = 0;
    }
    
    public void buscarCliente(ActionEvent event){
        listPersonas = pedidosDao.buscarCliente(valorBusqueda, tipoBusqueda);
        if (listPersonas.isEmpty()){
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Cliente no encontrado.", "Revise los datos de búsqueda e intente de nuevo." ); 
        }
        else{
            msg = new FacesMessage(FacesMessage.SEVERITY_INFO , "Cliente encontrado.", "Elija la cuenta para realizar operaciones." ); 
        }
        busqueda();
        FacesContext.getCurrentInstance().addMessage("*", msg);      
    }
    
    public void buscarProducto(ActionEvent event){
        listProductos = pedidosDao.getProductos(productoBusqueda, productoBusqueda, almacen, tipoBusqueda);
        if (listProductos.isEmpty()){
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Producto no encontrado.", "Revise los datos de búsqueda e intente de nuevo." ); 
        }
        else{
            msg = new FacesMessage(FacesMessage.SEVERITY_INFO , "Producto encontrado.", "Elija la cuenta y asigne una cantidad para inicar pedido." ); 
        }
        operaciones();
        FacesContext.getCurrentInstance().addMessage("*", msg);      
    }
    
    public void elegirCliente(ActionEvent event){
        //System.out.println("ABDFacturacion -> RecibosBean -> elegirCLiente -> codigo: "+cliElegido.getCodigo());
        LOGGER.log(Level.INFO, "{0}Cliente ELegido: {1}", new Object[]{CABLOG, cliElegido.getCodigo()});
        cliente = pedidosDao.buscarCliente(cliElegido.getCodigo());
        this.listVendedores =  pedidosDao.buscarVendedores("R");   
        this.razonSocial = cliente.getNombre();
        this.nit = cliente.getRuc();
        operaciones();
                
    }    
       
    public void nuevoPedido(ActionEvent event){
        this.pedidosDao = new PedidosDao();
        inicializa();       
    }

    public void crearPedido(ActionEvent event){
        SimpleDateFormat formato = new SimpleDateFormat("dd/MM/yyyy");
        formato.setLenient(false); 
        LOGGER.log(Level.INFO, "{0} [crearPedido] Cantidad Reserva: {1} {2} {3} Producto Elegido: {3} FechaEntrega: {4}", new Object[]{CABLOG, cantidadReserva,almacen, productoElegido.getProducto()+"-"+ productoElegido.getLote()+"-"+ productoElegido.getSaldo(), fechaEntrega});
        try{
            Date fechaIngresada = formato.parse(fechaEntrega);
            Date fechaActual = new Date();
            if (fechaIngresada.before(fechaActual)) { 
                LOGGER.log(Level.INFO, "{0} [crearPedido][Error fecha entrega anterior a la actual] Cantidad Reserva: {1} {2} {3} Producto Elegido: {3} FechaEntrega: {4} ", new Object[]{CABLOG, cantidadReserva,almacen, productoElegido.getProducto()+"-"+ productoElegido.getLote()+"-"+ productoElegido.getSaldo(), fechaEntrega});
        mensaje = "La fecha de entrega no puede ser anterior a la fecha actual.";
                msg = new FacesMessage(FacesMessage.SEVERITY_ERROR , "Error de validacion", mensaje); 
            } 
            else {
                /* Validamos que cantidad no sobrepase al saldo actual */
                if (cantidadReserva>Integer.valueOf(productoElegido.getSaldo())){
                    msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Producto inexistente", "Revise la cantidad de su reserva, no puede sobrepasar el salgo actual. Producto: "+ productoElegido.getNombre()+" Saldo: "+productoElegido.getSaldo() ); 
                }
                else{        
                    this.datos = pedidosDao.crearPedido(almacen, cliente.getCodigo(), cliente.getNombre(), fechaEntrega, userLogin, codVendedor, productoElegido.getProducto(), cantidadReserva, productoElegido.getUnidad(), 0.0, productoElegido.getLote(), productoElegido.getFecha());
                    if (datos[0].equalsIgnoreCase("1")){
                        this.dataPedido = false;
                        this.dataPedidoCrear = false;
                        this.dataPedidoAdicionar = true;
                        this.dataPedidoTerminar = true;
                        this.nroPedido = datos[1];
                        mensaje = datos[2];
                        detallePedido = pedidosDao.getDetallePedido(almacen, Integer.valueOf(nroPedido));
                        msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Pedido Creado con éxito", "Se creo pedido Nro: "+ nroPedido +" para el Almacen: "+almacen); 
                    }
                    else{
                        mensaje = datos[2];
                        msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Error al crear pedido Pedido", "Hubo un problema al crear pedido, mensaje:  "+mensaje); 
                    }              
                }
            }
        }
        catch (ParseException e) {
            LOGGER.log(Level.INFO, "{0} [crearPedido][Error en formato de fecha] Cantidad Reserva: {1} {2} {3} Producto Elegido: {3} FechaEntrega: {4}", new Object[]{CABLOG, cantidadReserva,almacen, productoElegido.getProducto()+"-"+ productoElegido.getLote()+"-"+ productoElegido.getSaldo(), fechaEntrega});
            mensaje = "Formato de fecha inválido. Asegúrate de usar el formato dd/MM/yyyy.";
            msg = new FacesMessage(FacesMessage.SEVERITY_ERROR , "Error de validacion", mensaje); 
        }
        FacesContext.getCurrentInstance().addMessage("*", msg);      
    }
    
    public void adicionarItemPedido(ActionEvent event){         
        LOGGER.log(Level.INFO, "{0} [adicionarItemPedido] Cantidad Reserva: {1} Almacen: {2} Pedido: {3} Producto Elegido: {4}", new Object[]{CABLOG, almacen, nroPedido, cantidadReserva,productoElegido.getProducto()+"-"+ productoElegido.getLote()+"-"+ productoElegido.getSaldo()});
        /* Validamos que cantidad no sobrepase al saldo actual */
  
        this.datos =   pedidosDao.crearDetallePedido(almacen, Integer.valueOf(nroPedido), cliente.getCodigo(), productoElegido.getProducto(), cantidadReserva, productoElegido.getUnidad(), 0.0, userLogin, productoElegido.getLote(), productoElegido.getFecha());
        if (datos[0].equalsIgnoreCase("1")){
            this.dataPedido = false;
            this.dataPedidoCrear = false;
            this.dataPedidoAdicionar = true;
            this.dataPedidoTerminar = true;
            String nroLinPedido = datos[1];
            mensaje = datos[2];
            detallePedido = pedidosDao.getDetallePedido(almacen, Integer.valueOf(nroPedido));
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Item de Pedido adicionado con éxito", "Se creo Item Nro: "+ nroLinPedido ); 
        }
        else{
            mensaje = datos[2];
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Error al adicionar item al Pedido", "Hubo un problema al adicionar Item, mensaje:  "+mensaje); 
        }           
       
        FacesContext.getCurrentInstance().addMessage("*", msg);     
                
                    
    }
    public void terminarPedido(ActionEvent event){
        LOGGER.log(Level.INFO, "{0} [terminarPedido] Pedido: {1} User:{2} Almacen: {3} Pedido: {4} ", new Object[]{CABLOG, nroPedido,userLogin, almacen, nroPedido});
        /* Validamos que cantidad no sobrepase al saldo actual */
  
        this.datos =   pedidosDao.terminarPedido(almacen, Integer.valueOf(nroPedido), userLogin);
        if (datos[0].equalsIgnoreCase("1")){
            this.dataPedido = false;
            this.dataPedidoCrear = false;
            this.dataPedidoAdicionar = false;
            this.dataFiltro = false;
            this.dataPedidoTerminar = false;
            this.dataPedidoPagar = true;
            this.dataPedidoFinalizar = true;
            mensaje = datos[1];
            detallePedido = pedidosDao.getDetallePedido(almacen, Integer.valueOf(nroPedido));
            pedido = pedidosDao.getPedido(almacen,Integer.valueOf(nroPedido));
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Pedido se proceso con éxito", "A continuacion indique si el pedido fue pagado."); 
        }
        else{
            mensaje = datos[1];
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Error al terminar proceeso de Pedido", "mensaje:  "+mensaje); 
        }   
        FacesContext.getCurrentInstance().addMessage("*", msg);         
    }
    
    public void onDocPagoChanged(){
        this.codMonedaPago = "BS";
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
            this.dataBano = true;
        }
    } 
    
    public void pagarPedido(ActionEvent event){
        LOGGER.log(Level.INFO, "{0} [pagarPedSido] Pedido: {1} User: {2} ", new Object[]{CABLOG, nroPedido,userLogin});
        if (pagado.equalsIgnoreCase("Si"))
           formaPago = "Contado";
        else
            formaPago = "CxC";
        this.datos =  pedidosDao.pagarPedido(almacen, Integer.valueOf(nroPedido), userLogin, formaPago, tipDocPago, banco, razonSocial, nit);
        if (datos[0].equalsIgnoreCase("1")){
            this.dataPedido = false;
            this.dataPedidoCrear = false;
            this.dataPedidoAdicionar = false;
            this.dataPedidoTerminar = false;
            this.dataPedidoPagar = true;
            this.dataPedidoFinalizar = false;
            this.dataPedidoNuevo = true;
            mensaje = datos[1];
            detallePedido = pedidosDao.getDetallePedido(almacen, Integer.valueOf(nroPedido));
            this.pedido = pedidosDao.getPedido(almacen, Integer.valueOf(nroPedido));
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Pago de pedido se proceso con éxito", mensaje); 
        }
        else{
            mensaje = datos[1];
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Error en el  proceeso de pagar Pedido", "mensaje:  "+mensaje); 
        }   
        FacesContext.getCurrentInstance().addMessage("*", msg);         
    }    
}
