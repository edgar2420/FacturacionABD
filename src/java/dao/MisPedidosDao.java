
package dao;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;
import lib.Errores;
import objetos.Pedido;
import oracle.jdbc.OracleTypes;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.jdbc.Work;
import util.HibernateUtil;

/**
 *
 * @author marce
 */
public class MisPedidosDao {
String claseJava = "PedidosDao.java";
    private static final Logger LOGGER = Logger.getLogger(PedidosDao.class.getName());
    private static final String CABLOG ="[LaboratoriosABD][PedidosDao]"; 
    
    private Session sesion;
    private Transaction tx;
    
    String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    String userLogin =  FacesContext.getCurrentInstance().getExternalContext().getSessionMap().get("usuario").toString();
        
    List<Map<String,?>> result = new ArrayList<Map<String, ?>>(); 
    
    String archivoLog = "logs/procesos.log";
    String erroresLog = "logs/errores.log";  
    String tabla = "PROCESO-PEDIDOS";
    String resp, msj, respuesta;
    Integer res;    
    ResultSet cuotasRes, recibosRes, productosRes, pedidoRes, pedidosRes = null;  
    public Pedido pedido;
    
    public MisPedidosDao(){        
    }

    private void iniciaOperacion() throws HibernateException{
        sesion = HibernateUtil.getSessionFactory().openSession();
        tx = sesion.beginTransaction();        
    }   
    
    private void manejaExcepcion(HibernateException e) throws HibernateException{
        String msg = "[Clase:"+e.getClass().getName()+" Mensaje: "+e.getMessage()+" Causa: "+e.getCause()+"]";
        LOGGER.log(Level.FINE, CABLOG+msg);
        sesion.getTransaction().rollback();
    } 
    public void manejaExcepcion(Exception e, String nomFuncion, String mensaje, String tabla) throws HibernateException{
        String msg = "[Clase:"+e.getClass().getName()+" Mensaje: "+e.getMessage()+"]";
        LOGGER.log(Level.FINE, CABLOG+msg);
        Errores.registrarLogErrores
        (e,"Error : Durante el proceso. "
        +"\n ID de Usuario (UID): "+userLogin
        +"\n IP Ususario: "+ip
        +"\n Name (SO): " + System.getProperty("os.name")
        +"\n Version (SO): "+ System.getProperty("os.version")
        +"\n Arquitectura (SO): "+ System.getProperty("os.arch")       
        +"\n Usuario (SO): "+System.getProperty("user.name")  
        +"\n Causa: "+e.getCause()+" "+e.getCause().getMessage()
        +"\n Nombre Funcion: "+nomFuncion,
        "Mensaje: "+mensaje,
        erroresLog, tabla);          

        sesion.getTransaction().rollback();
    } 
    
    public List<Pedido> getPedidos(String almacen, String tipoBusqueda, String valorBusqueda, String fechaBusqueda){
        List<Pedido> model = new ArrayList<>();
        iniciaOperacion();
        try{
            sesion.doWork(new Work()
            {
                @Override
                public void execute(Connection conn) throws SQLException{
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_PEDIDOS(?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.CURSOR );                     
                    stmt.setString(2, almacen); 
                    stmt.setString(3, tipoBusqueda);    
                    stmt.setString(4, valorBusqueda); 
                    stmt.setString(5, fechaBusqueda);       
                    stmt.execute();    
                    pedidoRes = (ResultSet)stmt.getObject(1);
                    while (pedidoRes.next()){                       
                        pedido = new Pedido(pedidoRes.getString(1),
                                            pedidoRes.getString(2),
                                            pedidoRes.getString(3),
                                            pedidoRes.getString(4),
                                            pedidoRes.getString(5),
                                            pedidoRes.getString(6),
                                            pedidoRes.getString(7),
                                            pedidoRes.getDouble(8),
                                            pedidoRes.getDouble(9),
                                            pedidoRes.getString(10),
                                            pedidoRes.getString(11),
                                            pedidoRes.getString(12),
                                            pedidoRes.getString(13),
                                            pedidoRes.getString(14),
                                            pedidoRes.getString(15),
                                            pedidoRes.getString(16),
                                            pedidoRes.getString(17),
                                            pedidoRes.getString(18),
                                            pedidoRes.getString(19),
                                            pedidoRes.getString(20),
                                            pedidoRes.getString(21),
                                            pedidoRes.getString(22),
                                            pedidoRes.getString(23),
                                            pedidoRes.getString(24),
                                            pedidoRes.getString(25)            
                        );
                        model.add(pedido);
                    }                               
                    pedidoRes.close();
                    stmt.close();
                }                
            });            
        }        
        catch(HibernateException e){
            manejaExcepcion(e, "getPedidos", "Error durante el proceso de busqueda de pedidos. Almacen: "+almacen+" TipoBusqueda: "+tipoBusqueda+" ValorBusqueda: "+valorBusqueda+" Fecha: "+fechaBusqueda, "ABD.PCK_OPERACIONES.F_OBTENER_RECIBOS(?,?,?,?)");            
        }
        finally{
           sesion.close();
        }    
        return model;                             
    }
    
}
