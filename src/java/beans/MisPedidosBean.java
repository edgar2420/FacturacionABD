package beans;

import dao.MisPedidosDao;
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
import objetos.Pedido;

/**
 *
 * @author marce
 */
@Named(value = "misPedidosBean")
@SessionScoped
public class MisPedidosBean implements Serializable{
    private static final long serialVersionUID = 5511011930376333689L;
    private static final String CLASSNAME = MisPedidosBean.class.getName();
    private static final Logger LOGGER = Logger.getLogger(MisPedidosBean.class.getName());
    private static final String CABLOG = "PEDIDOS-ABD"+"["+CLASSNAME+"]";
    private static final String LOG_ERROR_FILE = "logs/Errores.log";    
    private String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    private String userLogin = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString();
    private String valorBusqueda, fechaBusqueda;
    private String tipoBusqueda;   
    private String selectedOption;
    private String almacen;
    
    private List<Pedido> listPedidos = new ArrayList<>();
    private MisPedidosDao misPedidosDao;
    
    FacesMessage msg;


    public String getSelectedOption() {
        return selectedOption;
    }

    public void setSelectedOption(String selectedOption) {
        this.selectedOption = selectedOption;
    }

    public String getValorBusqueda() {
        return valorBusqueda;
    }

    public void setValorBusqueda(String valorBusqueda) {
        this.valorBusqueda = valorBusqueda;
    }

    public String getFechaBusqueda() {
        return fechaBusqueda;
    }

    public void setFechaBusqueda(String fechaBusqueda) {
        this.fechaBusqueda = fechaBusqueda;
    }

    public String getTipoBusqueda() {
        return tipoBusqueda;
    }

    public void setTipoBusqueda(String tipoBusqueda) {
        this.tipoBusqueda = tipoBusqueda;
    }

    public List<Pedido> getListPedidos() {
        return listPedidos;
    }

    public void setListPedidos(List<Pedido> listPedidos) {
        this.listPedidos = listPedidos;
    }

    public String getAlmacen() {
        return almacen;
    }

    public void setAlmacen(String almacen) {
        this.almacen = almacen;
    }
   
    
    
    public MisPedidosBean(){        
        this. misPedidosDao = new MisPedidosDao();        
        inicializa();
    }
    
    private void inicializa(){
        this.listPedidos.clear();
        this.tipoBusqueda = "";
        this.valorBusqueda = "";
        this.fechaBusqueda = "";               
        this.almacen = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "unidad").toString(); 
    }
    
    public void buscarPedidos(ActionEvent event){
        LOGGER.log(Level.INFO, "{0} [buscarPedidos] Almacen: {1} ValorBusqueda: {2} TipoBusqueda: {3} FechaBusqueda: {4} ", new Object[]{CABLOG, almacen,userLogin});
        listPedidos = misPedidosDao.getPedidos(almacen, tipoBusqueda, valorBusqueda, fechaBusqueda);
        if (listPedidos != null && listPedidos.size() > 1) 
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Pedidos", "Encontrados");       
        else
            msg = new FacesMessage(FacesMessage.SEVERITY_WARN , "Pedidos No", "Encontrados");   
        FacesContext.getCurrentInstance().addMessage("*", msg); 
            
    }
    
    
    
    
}
