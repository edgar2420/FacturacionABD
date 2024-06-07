
package dao;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;
import lib.Errores;
import model.Personas;
import objetos.DetalleCuentasXCobrar;
import oracle.jdbc.OracleTypes;
import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.jdbc.Work;
import util.HibernateUtil;

/**
 *
 * @author marce
 */
public class RecibosDao {
String claseJava = "SiniestrosDao.java";
    private static final Logger LOGGER = Logger.getLogger(RecibosDao.class.getName());
    private static final String CABLOG ="[LaboratoriosABD][RecibosDao]"; 
    
    private Session sesion;
    private Transaction tx;
    
    String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    String userLogin =  FacesContext.getCurrentInstance().getExternalContext().getSessionMap().get("usuario").toString();
        
    List<Map<String,?>> result = new ArrayList<Map<String, ?>>(); 
    
    String archivoLog = "logs/procesos.log";
    String erroresLog = "logs/errores.log";  
    String tabla = "PROCESO-RECIBOS";
    String resp, msj, respuesta;
    Integer res;
    public List<Personas> model = null; 
    public List<DetalleCuentasXCobrar> listCXC = new ArrayList();
    public DetalleCuentasXCobrar cuentaXCobrar;
    ResultSet cuotasRes = null;    
    
    
    
    public RecibosDao(){
        
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
    
     public static List<Map<String, ?>> rsToList(ResultSet rs) throws SQLException {
        ResultSetMetaData md = rs.getMetaData();
        int columns = md.getColumnCount();
        List<Map<String, ?>> results = new ArrayList<Map<String, ?>>();
        while (rs.next()) {
            Map<String, Object> row = new HashMap<String, Object>();
            for (int i = 1; i <= columns; i++) {
                row.put(md.getColumnLabel(i).toLowerCase(), rs.getObject(i));
            }
            results.add(row);
        }
        return results;
    }     

    public List<Map<String,?>> buscarCliente(String valor, String tipo){
        FacesMessage msg;        
        String sql="";
        List<Map<String,?>> model = null;
        String log = "[buscarCliente][Inicio]: Valor: "+valor+" Tipo: "+tipo;
        LOGGER.log(Level.FINE, CABLOG+log);
        iniciaOperacion();
       try{
           switch (tipo) {
               // Nombre
               case "N":
                    sql = "from Personas where upper(nombre) like '%"+valor.toUpperCase()+"%' order by nombre";
                    /*sql = "SELECT * FROM personas WHERE nombre LIKE :nombre ORDER BY nombre";
                    Query query = sesion.createSQLQuery(sql);
                    query.setParameter("nombre", "%primitiva%");
                    List results = query.list();*/
                   break;
               // Razon social
               case "R":
                   sql = "from Personas where upper(razonSocial) like '%"+valor.toUpperCase()+"%' order by nombre";
                   break;
               // Carnet/Nit    
               case "C":
                   sql = "from Personas where ruc like '%"+valor+"%' order by nombre";
                   break;
               //Codigo cliente    
               case "O":
                   sql = "from Personas where upper(codigo) like '%"+valor.toUpperCase()+"%' order by nombre";
                   break;
           }
           Query query = sesion.createQuery(sql);
           model = (List<Map<String,?>>) query.list();
       }        
       
       
       
        
         catch (HibernateException e) { 
            e.printStackTrace();
            manejaExcepcion( (HibernateException) e, "buscarCliente", "Error durante el proceso de busqueda. DatoBusqueda: "+valor+" TipoBusqueda:"+tipo, "IBSADM.PERSONAS");
        }       
        finally{
            if (sesion != null)
                sesion.close();
        }
        return model;          
    }

    public List<Map<String,?>> buscarVendedores(String tipo){
        FacesMessage msg;        
        String sql="";
        List<Map<String,?>> model = null;
        String log = "[buscarVendedores][Inicio]:  Tipo: "+tipo;
        LOGGER.log(Level.FINE, CABLOG+log);
        iniciaOperacion();
       try{
           switch (tipo) {
               // Nombre
               case "N":
                    sql = "select codigo, trim(nombre) nombre from Personas where codigoEmpleado='SI' order by trim(nombre)"; 
                   break;
               // Razon social
               case "R":
                   sql = "from Personas where codigoEmpleado='SI' and codigoVendedor is not null order by trim(nombre)";
                   break;
           }
           Query query = sesion.createQuery(sql);
           model = (List<Map<String,?>>) query.list();
       }   
        
         catch (HibernateException e) { 
            e.printStackTrace();
            manejaExcepcion( (HibernateException) e, "buscarVendedores", "Error durante el proceso de busqueda. DatoBusqueda: "+tipo, "IBSADM.PERSONAS");
        }       
        finally{
            if (sesion != null)
                sesion.close();
        }
        return model;          
    }

        
    
    
    public List<Map<String,?>> buscarCXC(String valor, String tipo){
        FacesMessage msg;        
        String sql="";
        List<Map<String,?>> model = null;
        String log = "[buscarCliente][Inicio]: Valor: "+valor+" Tipo: "+tipo;
        LOGGER.log(Level.FINE, CABLOG+log);
        iniciaOperacion();
       try{
           switch (tipo) {
               // Nombre
               case "N":
                    sql = "from Personas where upper(nombre) like '%"+valor.toUpperCase()+"%' order by nombre";
                   break;
               // Razon social
               case "R":
                   sql = "from Personas where upper(razonSocial) like '%"+valor.toUpperCase()+"%' order by nombre";
                   break;
               // Carnet/Nit    
               case "C":
                   sql = "from Personas where ruc like '%"+valor+"%' order by nombre";
                   break;
               //Codigo cliente    
               case "O":
                   sql = "from Personas where upper(codigo) like '%"+valor.toUpperCase()+"%' order by nombre";
                   break;
           }
           Query query = sesion.createQuery(sql);
           model = (List<Map<String,?>>) query.list();
       }        
        
         catch (HibernateException e) { 
            e.printStackTrace();
            manejaExcepcion( (HibernateException) e, "buscarCliente", "Error durante el proceso de busqueda. DatoBusqueda: "+valor+" TipoBusqueda:"+tipo, "IBSADM.PERSONAS");
        }       
        finally{
            if (sesion != null)
                sesion.close();
        }
        return model;          
    }    

    public List<Personas> buscarClientes(String valor, String tipo){
        FacesMessage msg;        
        String sql="";
        List<Personas> model = null;
        String log = "[buscarCliente][Inicio]: Valor: "+valor+" Tipo: "+tipo;
        LOGGER.log(Level.FINE, CABLOG+log);
        iniciaOperacion();
       try{
           switch (tipo) {
               // Nombre
               case "N":
                    sql = "from Personas where nombre like '%"+valor+"%' order by nombre";
                   break;
               // Razon social
               case "R":
                   sql = "from Personas where razonSocial like '%"+valor+"%' order by nombre";
                   break;
               // Carnet/Nit    
               case "C":
                   sql = "from Personas where ruc like '%"+valor+"%' order by nombre";
                   break;
               //Codigo cliente    
               case "O":
                   sql = "from Personas where codigo like '%"+valor+"%' order by nombre";
                   break;
           }
           Query query = sesion.createQuery(sql);
           model = (List<Personas>) query.list();
       }        
        
         catch (HibernateException e) { 
            e.printStackTrace();
            manejaExcepcion( (HibernateException) e, "buscarCliente", "Error durante el proceso de busqueda. DatoBusqueda: "+valor+" TipoBusqueda:"+tipo, "IBSADM.PERSONAS");
        }       
        finally{
            if (sesion != null)
                sesion.close();
        }
        return model;          
    } 
    
    public Personas buscarCliente(String codigo){
        Personas model = null;
        iniciaOperacion();
        String sql = "from Personas where codigo = '"+codigo+"'";
        try{
            model = (Personas) sesion.createQuery(sql).uniqueResult();
        }
         catch(HibernateException e){
            manejaExcepcion( e, "buscarCliente", "Error durante el proceso de busqueda del objeto. codigo: "+codigo, "PERSONAS");             
        }
        finally{
            sesion.close();
        }               
        return model;
    }
    
    
    public List<DetalleCuentasXCobrar> getCuentasXCobrar(String codigo, String contabilidad){
        List<DetalleCuentasXCobrar> model = new ArrayList();        
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_DEUDAS_CLIENTE(?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.CURSOR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, codigo); 
                    stmt.setString(3, contabilidad); 
                    stmt.execute();
                    cuotasRes = (ResultSet)stmt.getObject(1);
                    while (cuotasRes.next()){
                       
                        cuentaXCobrar = new DetalleCuentasXCobrar(cuotasRes.getString(1),
                                                                  cuotasRes.getString(2),
                                                                  cuotasRes.getString(3),
                                                                  cuotasRes.getString(4),
                                                                  cuotasRes.getString(5),
                                                                  cuotasRes.getString(6),
                                                                  cuotasRes.getString(7));
                        model.add(cuentaXCobrar);
                    }                    
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getCuentasXCobrar", "Error durante el proceso de busqueda de cuotas de cobrar. Codigo: "+codigo, "ABD.PCK_OPERACIONES.F_OBTENER_DEUDAS_CLIENTE(?)");            
        }
        finally{
           sesion.close();
        }    
        return model; 
    }
    
    public String[] getTotalesCuentasXCobrar(String codigo, String contabilidad){
        String respuestas[] = new String[5];           
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_SUM_DEUDAS_CLIENTE(?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, codigo);
                    stmt.registerOutParameter(3, OracleTypes.VARCHAR);
                    stmt.registerOutParameter(4, OracleTypes.VARCHAR);
                    stmt.registerOutParameter(5, OracleTypes.VARCHAR);
                    stmt.setString(6, contabilidad);
                    stmt.execute();
                    
                    respuestas[0] = stmt.getString(3);
                    respuestas[1] = stmt.getString(4);
                    respuestas[2] = stmt.getString(5);
                        
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getCuentasXCobrar", "Error durante el proceso de busqueda de cuotas de cobrar. Codigo: "+codigo, "ABD.PCK_OPERACIONES.F_OBTENER_DEUDAS_CLIENTE(?)");            
        }       
        finally{
           sesion.close();
        }    
        return respuestas;                 
    }
    
    public String[] recibirPago(String codigo, String clasificador, Double monto, String conta, String formaPago, String banco){
        String respuestas[] = new String[5];           
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_RESERVA_CXC_CLIENTE(?,?,?,?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, codigo);
                    stmt.setString(3, clasificador);
                    stmt.setDouble(4, monto);
                    stmt.setString(5, conta); // CONTA
                    stmt.setString(6, formaPago);
                    stmt.setString(7, banco);
                    stmt.registerOutParameter(8, OracleTypes.VARCHAR);
                    stmt.registerOutParameter(9, OracleTypes.VARCHAR);
                    stmt.execute();
                    
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(8);
                    respuestas[2] = stmt.getString(9);
                       
                    stmt.close();
                    conn.commit();
                }
            });   
        }         
        catch(HibernateException e){
            String msj = " Clasrficador: "+clasificador+" Monto: "+monto+" Conta: "+conta+" FormaPago: "+formaPago+" Banco: "+banco;
            manejaExcepcion( e, "recibirPago", "Error durante el proceso de recibir pago. Datos: "+msj, "ABD.PCK_OPERACIONES.F_RESERVA_CXC_CLIENTE(?)");            
        }       
        finally{           
           sesion.close();
        }    
        return respuestas;                 
    }    

    public String[] pagarCuentaXCobrar(String codigo, String clasificador, Double monto, int deposito,  String conta, String login ,String unineg, String vendedor, String formaPago, String banco){
        String respuestas[] = new String[5];           
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_PAGAR_CXC_CLIENTE(?,?,?,?,?,?,?,?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, codigo);
                    stmt.setString(3, clasificador);
                    stmt.setDouble(4, monto);
                    stmt.setInt(5, deposito);
                    stmt.setString(6, conta);
                    stmt.setString(7, login);
                    stmt.setString(8, unineg);
                    stmt.setString(9, vendedor);
                    stmt.setString(10, formaPago);
                    stmt.setString(11, banco);
                    stmt.registerOutParameter(12, OracleTypes.VARCHAR);
                    stmt.registerOutParameter(13, OracleTypes.VARCHAR);
                    stmt.execute();
                    
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(12);
                    respuestas[2] = stmt.getString(13);
                        
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            String msj = " Clasrficador: "+clasificador+" Monto: "+monto+" Conta: "+conta+" FormaPago: "+formaPago+" Banco: "+banco;
            manejaExcepcion( e, "pagarCuenaXCobrar", "Error durante el proceso pagar CxC. Datos: "+msj, "ABD.PCK_OPERACIONES.F_RESERVA_CXC_CLIENTE(?)");            
        }       
        finally{
           sesion.close();
        }    
        return respuestas;                 
    }      
    
}
