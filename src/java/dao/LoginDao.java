/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package dao;
import java.io.Serializable;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;
import model.Usuarios;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import util.HibernateUtil;
import lib.Errores;
import oracle.jdbc.OracleTypes;
import org.hibernate.Transaction;
import org.hibernate.jdbc.Work;
/**
 *
 * @author Administrador
 */
public class LoginDao implements Serializable{
    // Variables  globales
    String claseJava = "LoginDao.java";
    private Session sesion;
    private Transaction tx;
    String archivoLog = "logs/jsf.log";
    String archivoLogLogin = "logs/login.log";
    String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    String tabla = "USUARIOS";
    String objetoLog = "logs/Operaciones.log";
    String erroresLog = "logs/Errores.log";      
    String resp ="0";
    String nombreBD="", versionBD="";
    private void iniciaOperacion() throws HibernateException{
       sesion = HibernateUtil.getSessionFactory().openSession();
       tx = sesion.beginTransaction();
    }
    
    public void manejaExcepcion(HibernateException e, String nomFuncion, String mensaje, String tabla) throws HibernateException{
        String userLogin = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString(); 
    
        System.out.println("Causa: "+e.getCause()
        + "\n Clase: "+ e.getClass().getName()
        + "\n Mensaje: "+ e.getMessage() );
        Errores.registrarLogErrores
        (e,"Error : Durante el proceso de la funcion. "
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
    
    public Usuarios encontrarUsuario(String usuario){
        Usuarios model= null;
        iniciaOperacion();
        String sql = "from Usuarios where login='"+usuario+"' ";
        try{
            model = (Usuarios) sesion.createQuery(sql).uniqueResult();
        }
           catch (HibernateException e) {
            manejaExcepcion( e, "encontrarUsuario", "Error al Obtener Objeto Usuairo. Usuario:"+usuario, "USUARIOS");           
        }
        finally{
            sesion.close();
        }     
        return model;
    }
            
            
    public String login(String usuario, String password){
        resp ="0";          
        try{
            iniciaOperacion();  
            sesion.doWork(new Work() {
              @Override 
              public void execute(Connection conn) throws SQLException {
                CallableStatement stmt = conn.prepareCall("{? = call PCK_OPERACIONES.F_VALIDA_USUARIO(?,?)}");
                stmt.registerOutParameter(1, OracleTypes.VARCHAR);
                stmt.setString(2, usuario); 
                stmt.setString(3, password);
                stmt.execute();
                resp = stmt.getString(1);
                stmt.close();
              }
            });
        }
        catch (HibernateException e) {
            manejaExcepcion( e, "login", "Error durante el proceso de Inicio de Sesion. Usuario:"+usuario+" Contraseña: "+password, "PCK_OPERACIONES.F_VALIDA_USUARIO(?,?)");           
        }
        finally{
            sesion.close();
        }
        return resp;
    }    

    public String nombreBD(){                  
        try{
            iniciaOperacion();
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call PCK_UTILS.F_OBTENER_DBNAME}");
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR);//java.sql.Types.VARCHAR); // 
                    stmt.execute();
                    nombreBD = stmt.getString(1);                       
                }
            }); 
        }
        catch (HibernateException e) {
            manejaExcepcion( e, "nombreBD", "Error al obtener nombre de la Instancia de Base de Datos", "PCK_UTILS.F_OBTENER_DBNAME");           
        }
        finally{
            sesion.close();
        }        
        return nombreBD;
    }
  
    public String versionBD(){                  
        try{
            iniciaOperacion();
            sesion.doWork(new Work() {
                  @Override 
                  public void execute(Connection conn) throws SQLException {
                      CallableStatement stmt = conn.prepareCall("{? = call PCK_UTILS.F_OBTENER_DBVERSION}");
                      stmt.registerOutParameter(1, OracleTypes.VARCHAR);//java.sql.Types.VARCHAR); // 
                      stmt.execute();
                      versionBD = stmt.getString(1);                       
                  }
              }); 
        }
        catch (HibernateException e) {
            manejaExcepcion( e, "versionBD", "Error al obtener la version  de Base de Datos", "PCK_UTILSF_OBTENER_DBVERSIONF_OBTENER_DBNAME");           
        }
        finally{
            sesion.close();
        }        
        return nombreBD;
    }    

    public Usuarios findMyUsuario(String usuario){
        Usuarios model = null;
        iniciaOperacion();
        String sql = "from Usuarios where login='"+usuario+"'";
        try{
            model = (Usuarios) sesion.createQuery(sql).uniqueResult();
        }
        catch(HibernateException e){
            Errores.registrarLogErrores
           (e,"Error : No se pudo obtener información de la Sesión "
            +"\nID de Usuario (UID): "+usuario
            +"\nIP Ususario: "+ip,
             "Error al validar usuario en findMyUsuario de Clase: UsuarioDaoImpl  " + "Posible sesión vencida, o intento no autorizado de ingreso. ",
             archivoLogLogin, "USUARIOS");
           sesion.beginTransaction().rollback(); 
        }        
        finally{
            sesion.close();
        }
        return model;
    }    
    
    public String guardaLogin(String nomUsuario, String lat, String lng, String loggedIn){
        resp="0";                
        try{
            iniciaOperacion();  
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call PCK_OPERACIONES.F_REGISTRA_INGREGO(?,?,?,?,?)}");
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR);//java.sql.Types.VARCHAR); // 
                    stmt.setString(2, nomUsuario);
                    stmt.setString(3, lat);
                    stmt.setString(4, lng);
                    stmt.setString(5, loggedIn);
                    stmt.setString(6, ip);
                    stmt.execute();
                    resp = stmt.getString(1);
                    // And then you'd do something with this outputValue
                }
            }); 
        }
        catch (HibernateException e) {
            manejaExcepcion( e, "guardaLogin", "Error alguardar registro de inicio de sesion", "PCK_OPERACIONES.F_REGISTRA_INGREGO(?,?,?,?,?)");           
        }
        finally{
            sesion.close();
        } 
        return resp;
    } 
}
