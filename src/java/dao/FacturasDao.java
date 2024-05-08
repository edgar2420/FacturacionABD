/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package dao;

import java.math.BigDecimal;
import java.util.List;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException; 
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;
import lib.Errores;
import model.Facturas;
import model.LinFacturas;
import oracle.jdbc.OracleTypes;
import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;
import org.hibernate.jdbc.Work;
import util.HibernateUtil;

/**
 *
 * @author marce
 */
public class FacturasDao {
    String claseJava = "ClienteDao.java";
    private Session sesion;
    private Transaction tx;
    String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    String userLogin = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString(); 
    String erroresLog = "logs/errores.log";        
    String objetoLog = "logs/facturas.log";
    String codCliente = "";
    String mensaje = "";  
    
    Boolean valida;
    String numFactura, numAutorizacion;
    
    private String datosQR[] = new String[3];
    
    public void manejaExcepcion(HibernateException e, String nomFuncion, String mensaje, String tabla) throws HibernateException{
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

    private void iniciaOperacion() throws HibernateException{
        sesion = HibernateUtil.getSessionFactory().openSession();
        tx = sesion.beginTransaction();
    }
    
    public Facturas buscarPreFactura(String almacen, String tipo, Integer numero, String fecha){
        Facturas model = null;
        iniciaOperacion();
        /*
        try{
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{call PCK_OPERACIONES.P_ACTUALIZA_ESTADO_FACTURAS}");
                    stmt.clearParameters();
                    stmt.execute();
                    System.out.println("FacturacionABD -> FacturasDao -> buscarPreFactura  -> -> Factura: P_ACTFACSIAT");
                    stmt.close();

                }
            });               
        }
        catch(HibernateException e){
            manejaExcepcion( e, "buscarPreFactura", "Error durante el proceso P_ACTFACSIAT Data  Almacen: "+almacen+" Tipo:"+tipo+" Numero:"+numero+" Fecha: "+fecha, "IBSADM.P_ACTFACSIAT");  
        }  */       
        
        String sql = "from Facturas where id.tipo='"+tipo+"' and id.almacen='"+almacen+"' and id.numero='"+numero+"' and fecha=to_date('"+fecha+"','dd/MM/yyyy')"; 
        try{
            model = (Facturas) sesion.createQuery(sql).uniqueResult();
        }
        catch(HibernateException e){
            manejaExcepcion( e, "buscarPreFactura", "Error durante el proceso de busqueda del objeto. Almacen: "+almacen+" Tipo:"+tipo+" Numero:"+numero+" Fecha: "+fecha, "Facturas");  
        }
        finally{
            sesion.close();
        }
        return model;
    }
    
    public List<LinFacturas> buscarDetalleFactura(String almacen, String tipo, Integer numero, String fecha){
        List<LinFacturas> model = null;
        iniciaOperacion();
        String sql = "from LinFacturas where id.tipo='"+tipo+"' and id.almacen='"+almacen+"' and id.numero='"+numero+"' and fecha=to_date('"+fecha+"','dd/MM/yyyy')"; 
        try{
            Query query = sesion.createQuery(sql);
            model = (List<LinFacturas>) query.list();
        }
        catch(HibernateException e){
            manejaExcepcion( e, "buscarDetalleFactura", "Error durante el proceso de busqueda del objeto. Almacen: "+almacen+" Tipo:"+tipo+" Numero:"+numero+" Fecha: "+fecha, "Facturas");  

        }
        finally{
            sesion.close();
        }
        return model;
    }
    
    public String[] verificaQR(String factura, String autorizacion, String almacen, String tipo, Integer numero, String fecha){
        buscarPreFactura(almacen, tipo, numero, fecha);
        String respuestas[] = new String[2];
        iniciaOperacion();
        try{
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_RETORNA_QRTXT(?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR);//java.sql.Types.VARCHAR); // 
                    stmt.setString(2, factura); 
                    stmt.setString(3, autorizacion);
                    stmt.registerOutParameter(4, OracleTypes.VARCHAR); 
                    stmt.execute();
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(4);
                    System.out.println("FacturacionABD -> FacturasDao -> verificaQR  -> Factura: "+factura+" Autorizacion: "+autorizacion+" Respuesta  "+stmt.getString(1)+" Cadena: "+stmt.getString(4));
                    stmt.close();

                }
            });               
        }
        catch(HibernateException e){
            manejaExcepcion( e, "verificaQR", "Error durante el proceso de busqueda del TXTQR. Factura: "+factura+" Autorizacion:"+autorizacion, "PCK_OPERACIONES.F_RETORNA_QRTXT");  
        }    
        finally{
            sesion.close();
        }
        return respuestas;        
    }

    public String[] verificaQR(String factura, String autorizacion){
        String respuestas[] = new String[2];
        iniciaOperacion();
        try{
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_RETORNA_QRTXT(?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR);//java.sql.Types.VARCHAR); // 
                    stmt.setString(2, factura); 
                    stmt.setString(3, autorizacion);
                    stmt.registerOutParameter(4, OracleTypes.VARCHAR); 
                    stmt.execute();
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(4);
                    System.out.println("FacturacionABD -> FacturasDao -> verificaQR  -> Factura: "+factura+" Autorizacion: "+autorizacion+" Respuesta  "+stmt.getString(1)+" Cadena: "+stmt.getString(4));
                    stmt.close();

                }
            });               
        }
        catch(HibernateException e){
            manejaExcepcion( e, "verificaQR", "Error durante el proceso de busqueda del TXTQR. Factura: "+factura+" Autorizacion:"+autorizacion, "PCK_OPERACIONES.F_RETORNA_QRTXT");  
        }    
        finally{
            sesion.close();
        }
        return respuestas;        
    }
    
    public String[] verEstadoFactura(String almacen, String tipo, String orden, String autorizacion){
         System.out.println("FacturacionABD -> FacturasDao -> verEstadoFactura  -> Almacen: "+almacen+" Tipo: "+tipo+" Orden;  "+orden+" Autorizacion: "+autorizacion);
                    
        numFactura ="";
        numAutorizacion = "";
        String respuestas[] = new String[3];
        iniciaOperacion();
        valida = false;
                try{
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{call PCK_OPERACIONES.P_ACTUALIZA_ESTADO_FACT_WEB(?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.setString(1, almacen);
                    stmt.setString(2, tipo);
                    stmt.setString(3, orden);
                    stmt.setString(4, autorizacion); 
                    stmt.execute();
                    System.out.println("FacturacionABD -> FacturasDao -> buscarPreFactura  -> -> Factura: P_ACTFACSIAT");
                    stmt.close();

                }
            });               
        }
        catch(HibernateException e){
            manejaExcepcion( e, "verEstadoFactura", "Error durante el proceso de busqueda del objeto. Almacen: "+almacen+" Tipo:"+tipo+" Orden:"+orden+" NumAutorizacion: "+autorizacion, "Facturas_dgi");  

        }  
        try{
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_VALIDAR_ESTADO_FACTURA(?,?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR);//java.sql.Types.VARCHAR); // 
                    stmt.setString(2, almacen); 
                    stmt.setString(3, tipo); 
                    stmt.setString(4, orden); 
                    stmt.setString(5, autorizacion);
                    stmt.registerOutParameter(6, OracleTypes.VARCHAR);
                    stmt.registerOutParameter(7, OracleTypes.VARCHAR);
                    stmt.execute();
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(6);
                    respuestas[2] = stmt.getString(7);
                    System.out.println("FacturacionABD -> FacturasDao -> verEstadoFactura: Entradas -> Almacen: "+almacen+" Tipo: "+tipo+" NumOrden: "+orden+" NUmAutorizacion: "+autorizacion);
                    System.out.println("FacturacionABD -> FacturasDao -> verEstadoFactura: Salidas -> Respuesta: "+stmt.getString(1)+" NumFacrura: "+stmt.getString(6)+" Autorizacion: "+stmt.getString(7));
                    stmt.close();

                }
            });   
        }
        catch(HibernateException e){
            manejaExcepcion( e, "verEstadoFactura", "Error durante el proceso de busqueda del objeto. Almacen: "+almacen+" Tipo:"+tipo+" Orden:"+orden+" NumAutorizacion: "+autorizacion, "Facturas_dgi");  

        }        
        finally{
            sesion.close();
        }
        return respuestas;      
    }
    
    public String[] facturar(String almacen, String tipo, String numero, String orden, String fecha, BigDecimal neto, String gestion, String periodo, String nit, String razonSocial){
        numFactura ="";
        numAutorizacion = "";
        String respuestas[] = new String[3];
        iniciaOperacion();
        valida = false;
        String data = "Almacen: "+almacen+" Tipo: "+tipo+" Numero: "+numero+" NumeroOrden: "+orden+" Fecha: "+fecha+" Neto: "+neto+" Gestion: "+gestion+" Periodo: "+periodo+" Nit: "+nit+" RazonSocial: "+razonSocial+" login: "+userLogin;//+" NUmAutorizacion: "+autorizacion";
        System.out.println("FacturacionABD -> FacturasDao -> facturar:  -> "+data );
                    
        try{
            sesion.doWork(new Work() {
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call PCK_OPERACIONES.F_GRABA_FACTURA_WEB(?,?,?,?,?,?,?,?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR);//java.sql.Types.VARCHAR); // 
                    stmt.setString(2, almacen); 
                    stmt.setString(3, tipo); 
                    stmt.setString(4, numero); 
                    stmt.setString(5, orden);
                    stmt.setString(6, fecha);
                    stmt.setBigDecimal(7, neto);
                    stmt.setString(8, gestion);
                    stmt.setString(9, periodo);
                    stmt.setString(10, nit);
                    stmt.setString(11, razonSocial);
                    stmt.setString(12, userLogin);
                    stmt.registerOutParameter(13, OracleTypes.VARCHAR);
                    stmt.execute();
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(13);
                    System.out.println("FacturacionABD -> FacturasDao -> Facturar. Entradas: "+data+" Salidas -> Respuesta: "+stmt.getString(1)+" Mensaje: "+stmt.getString(13));
                    stmt.close();
                }
            });   
        }
        catch(HibernateException e){
            manejaExcepcion( e, "facturar", "Error durante el proceso de Facturacion del objeto. "+data, "PCK_OPERACIONES.F_GRABA_FACTURA_WEB");  

        }        
        finally{
            sesion.close();
        }
        return respuestas;      
    }
    
    public String verificaEstadoFactura(String almacen, String tipo, String orden, String autorizacion) {
        System.out.println("ABDFacturacion][FacturasDa0][verificaEstadoFactura] Datos: almacen: "+almacen+" tipo: "+tipo+" orden: "+orden+" autorizacion: "+autorizacion);
        String respuesta = "";
        Integer cont = 0;
        datosQR[0] = "0";
        while (datosQR[0].equalsIgnoreCase("0")){
            datosQR = verEstadoFactura(almacen, tipo, orden, autorizacion);
            respuesta = datosQR[0];
            if (!datosQR[0].equalsIgnoreCase("1")){
                try{ 
                    cont=cont+1;
                    Thread.sleep(500);//5000=5s
                    System.out.println("ABDFacturacion][FacturasDa0][verificaEstadoFactura] Datos: "+" Iteracion: "+cont);
        
                } catch (InterruptedException e) {
                // Manejo de excepciones si algo interrumpe el proceso de espera
                e.printStackTrace();
                }
            }
        }
        return respuesta;
    }
        
}
