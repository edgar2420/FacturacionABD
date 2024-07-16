package beans;

import dao.RecibosDao;
import dao.ReportesDao;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.enterprise.context.SessionScoped;
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.faces.event.ActionEvent;
import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;
import objetos.DetalleRecibos;

/**
 *
 * @author marce
 */
@Named(value = "impRecibosBean")
@SessionScoped
public class ImpRecibosBean implements Serializable  {
    
    private static final long serialVersionUID = 5233011930376333689L;
    private static final String CLASSNAME = ImpRecibosBean.class.getName();
    private static final Logger LOGGER = Logger.getLogger(ImpRecibosBean.class.getName());
    private static final String CABLOG = "FACTURACION-ABD"+"["+CLASSNAME+"]";
    private static final String LOG_ERROR_FILE = "logs/Errores.log";    
    private String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    private String userLogin = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString();
    
    private String recibo;
    private String cliente;
    private String fecha;
    private String usuario;
    private String tipImpresion;

    private RecibosDao recibosDao;
    private ReportesDao reportesDao;    
    
    private List<DetalleRecibos> listRecibos = new ArrayList<>();
    private String imprimeRecibo;
    
    
    public String getRecibo() {
        return recibo;
    }

    public void setRecibo(String recibo) {
        this.recibo = recibo;
    }

    public String getCliente() {
        return cliente;
    }

    public void setCliente(String cliente) {
        this.cliente = cliente;
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

    public List<DetalleRecibos> getListRecibos() {
        return listRecibos;
    }

    public void setListRecibos(List<DetalleRecibos> listRecibos) {
        this.listRecibos = listRecibos;
    }

    public String getTipImpresion() {
        return tipImpresion;
    }

    public void setTipImpresion(String tipImpresion) {
        this.tipImpresion = tipImpresion;
    }

    public String getImprimeRecibo() {
        return imprimeRecibo;
    }

    public void setImprimeRecibo(String imprimeRecibo) {
        this.imprimeRecibo = imprimeRecibo;
    }

    
    
    public ImpRecibosBean() {
        this.recibosDao = new RecibosDao();
        this.reportesDao = new ReportesDao();
        inicializa();
    }
    
     public void inicializa(){
         this.recibo = "";
         this.cliente = "";
         this.fecha = "";
         this.usuario = "";
         this.imprimeRecibo = "";
         
         
     }   
    
     public void buscarRecibos(ActionEvent event){
         FacesMessage msj=null;
         LOGGER.log(Level.INFO, CABLOG+"{0}", "Inicio");
         listRecibos = recibosDao.getRecibos(recibo, cliente, usuario, fecha);
         if (listRecibos==null)
            msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Recibo(s) No encontrado(s)", " Recibo: "+recibo+" Cliente: "+cliente+" Fecha: "+fecha+" Usuario= "+usuario);  
         else
            msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Recibo(s) encontrado(s)","");  
         
         FacesContext.getCurrentInstance().addMessage("***", msj) ;
     }
     
 
    
    public void reimprimirRecibo(ActionEvent event) throws Exception{
        FacesMessage msj=null;
        String impresion = "";
        String cadena = "";
        System.out.println("reimprimirRecibo tipImpresion: "+tipImpresion+" Recibo: "+recibo);
        if (this.tipImpresion.equalsIgnoreCase("true"))
            impresion = "C";
        else
            impresion = "R";
        
        this.imprimeRecibo = reportesDao.generaReporteRecibo(recibo, impresion);
        msj = new FacesMessage(FacesMessage.SEVERITY_INFO,  "Recibo Generado",recibo);       
        FacesContext.getCurrentInstance().addMessage("*", msj) ;    
        inicializa();
        
    }    
    
    
}
