/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package beans;

import java.io.Serializable;
import javax.faces.application.FacesMessage;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.event.ActionEvent;
import javax.faces.context.FacesContext;
import model.Usuarios; 
import dao.LoginDao;
import org.primefaces.context.RequestContext;


import lib.*;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import oracle.jdbc.internal.OracleTypes;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.jdbc.Work;
import util.FacesUtil;
import util.HibernateUtil;
import util.MyUtil;
/**
 *
 * @author Administrador
 */
@ManagedBean
@SessionScoped
public class LoginBean implements Serializable  {
    private LoginDao  loginDao;
    private Usuarios usuario;
    private Session session;
    private Transaction tx;    
    private String nomUsuario;
    private String passUsuario;
    private String browser;
    private String lat ;
    private String lng;     
    private String dbname;
    private String dbversion;
    
    String archivoLog = "logs/jsf.log";
    String archivoLogLogin = "logs/login.log";
    String claseJava = "LoginBean.java";
    String tabla  = "SCO_USUARIOS";
    String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    String pass="";
    String password ="";
    String ruta = "";
    String respLogin;
    String loggedIn;
    String rolFacturar;
    
    String mensajeInicial = "Módulo de Facturación - Ingrese sus datos de sesión";
    String colorMensaje = "black";
    
    /**
     * Creates a new instance of LoginBean
     */    
    public LoginBean() {
        this.loginDao = new LoginDao();
        this.usuario = new Usuarios();                   
        this.nomUsuario = "";
        this.passUsuario = "";            
        this.dbname ="";
        this.dbversion = "";        
        this.lat = "";
        this.lng = "";
        this.rolFacturar="";
    }

    public String getNomUsuario(){
        return nomUsuario;
    }
    public void setNomUsuario(String nomUsuario){
        this.nomUsuario = nomUsuario;
    }
    
    public String getPassUsuario(){
        return passUsuario;
    }
    public void setPassUsuario(String passUsuario){
        this.passUsuario = passUsuario;
    }
    
    public Usuarios getUsuario() {
        return usuario;
    }
    public void setUsuario(Usuarios usuario) {
        this.usuario = usuario;
    }
    
    public String getMensajeInicio(String mensajeInicio){
        return mensajeInicio;
    }

    public String getLat() {
        return lat;
    }
    public void setLat(String lat) {
        this.lat = lat;
    }

    public String getLng() {
        return lng;
    }
    public void setLng(String lng) {
        this.lng = lng;
    }

    public String getDbname() {
        return dbname;
    }

    public void setDbname(String dbname) {
        this.dbname = dbname;
    }

    public String getDbversion() {
        return dbversion;
    }

    public void setDbversion(String dbversion) {
        this.dbversion = dbversion;
    }

    public String getMensajeInicial() {
        return mensajeInicial;
    }

    public void setMensajeInicial(String mensajeInicial) {
        this.mensajeInicial = mensajeInicial;
    }

    public String getColorMensaje() {
        return colorMensaje;
    }

    public void setColorMensaje(String colorMensaje) {
        this.colorMensaje = colorMensaje;
    }

    public String getRolFacturar() {
        return rolFacturar;
    }

    public void setRolFacturar(String rolFacturar) {
        this.rolFacturar = rolFacturar;
    }


    
 
    private void iniciaOperacion() throws HibernateException{
       session = HibernateUtil.getSessionFactory().openSession();
       tx = session.beginTransaction();
    }
    
    private void manejaExcepcion(HibernateException e) throws HibernateException{
        System.out.println("Causa: "+e.getCause()
        + "\n Clase: "+ e.getClass()
        + "\n Mensaje: "+ e.getMessage() );
        session.getTransaction().rollback();
    }   
     
    public void submit() {
        FacesMessage msg = new FacesMessage(FacesMessage.SEVERITY_INFO, "Correcto", "Ud. no es un robot!!");
        FacesContext.getCurrentInstance().addMessage(null, msg);
    }   
    
    public void login(ActionEvent event) {
        String respuesta;
        RequestContext context = RequestContext.getCurrentInstance();  
        FacesMessage msg = null;  
        boolean loggedIn = false, validationFailed = false;  
        pass = getPassUsuario(); 
        String user = getNomUsuario();
        System.out.println("Cobranzas -> login -> Usuario: "+user+" Password: "+pass);
        // Obtenemos al usuario
        this.browser = FacesContext.getCurrentInstance().getExternalContext().getRequestParameterMap().get("browser");
        Usuarios model = loginDao.findMyUsuario(user);       
        try {
            this.usuario = loginDao.encontrarUsuario(nomUsuario);
            FacesContext fc = FacesContext.getCurrentInstance();
            if (model!=null){
                respuesta = loginDao.login(user, pass); 
                if(respuesta.equals("1")) {
                    loggedIn = true;  
                    validationFailed = true;
                    String webContext = FacesUtil.getWebContext(fc);
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("usuario", model.getLogin());
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("rol", model.getRol() ) ;
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("unidad", model.getUniNeg());
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("lat", lat);
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("lng", lng);
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("loggedIn", true);
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("webContext", webContext);
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("facturar", model.getImprimeFac());
                    msg = new FacesMessage(FacesMessage.SEVERITY_INFO, "Bienvenido: ", model.getNombre());  
                    ruta = "/faces/views/facturacion.xhtml"; 
                    System.out.println("Cobranzas -> login -> Ruta login ok -> " + ruta);
                    //Obtengo nombre y version de la Base de Datos
                    dbname = loginDao.nombreBD();
                    dbversion = loginDao.versionBD();
                    rolFacturar = model.getImprimeFac();
                    Errores.registrarLogArchivoJsp
                    ("Ingreso con Exito",
                    "login.xhtml",
                    "\nID de Usuario vàlido(UID): "+usuario.getLogin()+
                    "\n Password:"+pass+        
                    "\nIP Ususario: "+ip, 
                    archivoLogLogin,
                    tabla,
                    usuario.getLogin(),
                    ip);   
                    respuesta = loginDao.guardaLogin(user, lat, lng, String.valueOf(loggedIn) );
                    if (loggedIn) {
                        FacesUtil.redirectSubPage(fc, ruta, "");
                    }
                }
                else{
                    mensajeInicial = "Error, datos de sesión no válidos, usuario o contraseña incorrectos!! ";
                    colorMensaje = "red";
                    loggedIn = false;  
                    validationFailed = false;
                    msg = new FacesMessage(FacesMessage.SEVERITY_WARN, "Datos de sesión no válidos", "Usuario o contraseña incorrectos, intente nuevamente ");  
                    //fc.addMessage("idPoliza", msg);
                    FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("loggedIn", false);
                    this.usuario = new Usuarios();
                    HibernateUtil.closeSession();
                    Errores.registrarLogArchivoJsp
                    ("Intento de Ingreso msj: Error al iniciar sesion",
                    "login.xhtml",
                    "\nID de Usuario no vàlido(UID): "+usuario.getLogin()+
                    "\n Password:"+pass+        
                    "\nIP Ususario: "+ip, 
                    archivoLogLogin,
                    "USUARIOS",
                    usuario.getNombre(),
                    ip);   
                    if ("D".equals(browser))
                        ruta = MyUtil.basepathlogin()+"views/desktop/login.xhtml"; 
                    else
                        ruta = MyUtil.basepathlogin()+"views/mobile/login.xhtml"; 
                } 
            }
            else{
                loggedIn = false;  
                validationFailed = false;
                FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("loggedIn", false);
                msg = new FacesMessage(FacesMessage.SEVERITY_ERROR, "Error al iniciar sesión", "No existe usuario.");  
                //fc.addMessage("idPoliza", msg);
                this.usuario = new Usuarios();
                HibernateUtil.closeSession();
                Errores.registrarLogArchivoJsp
                ("Intento de Ingreso. msj:Error al iniciar sesion",
                "login.xhtml",
                "\n ID de Usuario no registrado en Base de Datos(UID): "+usuario.getLogin()+
                "\n Password:"+pass+        
                "\n IP Ususario: "+ip, 
                archivoLogLogin,
                "SCO_USUARIOS",
                usuario.getNombre(),
                ip); 
                if ("D".equals(browser))
                  ruta = MyUtil.basepathlogin()+"login.xhtml"; 
                else
                  ruta = MyUtil.basepathlogin()+"login.xhtml"; 
            }
            FacesContext.getCurrentInstance().addMessage(null, msg); 
            context.addCallbackParam("loggedIn", loggedIn);  
            context.addCallbackParam("validationFailed", validationFailed);
            context.addCallbackParam("ruta", ruta);   
        } 
        catch(HibernateException e) {
            FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("loggedIn", false);
            Errores.registrarLogErrores
            (e,"Error : No se pudo iniciar Sesión "
            +"\n ID de Usuario (UID): "+usuario.getLogin()
            +"\n IP Ususario: "+ip
            +"\n Password:"+pass,
            "Error al validar usuario en login de Clase: LoginBean  " + "Revisar , o intento no autorizado de ingreso. ",
            archivoLogLogin, claseJava);            
        }
    }    
    
    public void logOut(ActionEvent event) {
       ServletContext servletContext = (ServletContext) FacesContext.getCurrentInstance().getExternalContext().getContext();
       String realPath=(String) servletContext.getRealPath("/"); // Sustituye "/" por el directorio ej: "/upload"
       FacesContext facesContext = FacesContext.getCurrentInstance();
       HttpSession session1 = (HttpSession) facesContext.getExternalContext().getSession(false);
       if (session1 != null) {
           session1.invalidate(); //Cierre de sesion
       }
    }  
    
    
    public void refreshIt(){
         FacesContext context = FacesContext.getCurrentInstance();
         Map map = context.getExternalContext().getRequestParameterMap();
         lat=((String) map.get("lat"));
         lng=((String) map.get("lng"));

          //    session.close();
         
         
   }    
    
    public void guardaLogin(){
         FacesContext fc = FacesContext.getCurrentInstance();
         loggedIn = util.FacesUtil.getSessionMapValue(fc, "loggedIn").toString();
         respLogin ="";
         FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("lat", lat);
         FacesContext.getCurrentInstance().getExternalContext().getSessionMap().put("lng", lng);
              //iniciaOperacion();  
              session.doWork(new Work() {
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
                      respLogin = stmt.getString(1);
                     // And then you'd do something with this outputValue
                  }
              }); 
              System.out.println("respLogin (geo) -> "+respLogin);
          //    session.close();
   }    
}
