
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
import objetos.DetallePedido;
import objetos.DetalleProductos;
import objetos.DetalleRecibos;
import objetos.Pedido;
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
public class PedidosDao {
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
    public List<Personas> model = null; 
    public List<DetalleCuentasXCobrar> listCXC = new ArrayList();
    public DetalleCuentasXCobrar cuentaXCobrar;
    public DetalleRecibos recibo;
    public DetalleProductos producto;
    public DetallePedido detallePedido;
    public Pedido pedido;
    ResultSet cuotasRes, recibosRes, productosRes, pedidoRes, pedidosRes = null;    
    
    
    
    public PedidosDao(){
        
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
    
    public List<DetalleRecibos> getRecibos(String nroRecibo, String cliente,  String usuario, String fecha){
        List<DetalleRecibos> model = new ArrayList();
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_RECIBOS(?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.CURSOR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, nroRecibo); 
                    stmt.setString(3, cliente); 
                    stmt.setString(4, usuario);
                    stmt.setString(5, fecha);
                    stmt.execute();
                    recibosRes = (ResultSet)stmt.getObject(1);
                    while (recibosRes.next()){
                       
                        recibo = new DetalleRecibos(recibosRes.getString(1),
                                                    recibosRes.getString(2),
                                                    recibosRes.getString(3),
                                                    recibosRes.getString(4),
                                                    recibosRes.getString(5),
                                                    recibosRes.getString(6));
                        model.add(recibo);
                    }   
                    recibosRes.close();
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getRecibos", "Error durante el proceso de busqueda de recibos. NroRecibo: "+nroRecibo+" Fecha: "+fecha+" Usuario: "+usuario, "ABD.PCK_OPERACIONES.F_OBTENER_RECIBOS(?,?,?,?)");            
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
                    cuotasRes.close();
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getCuentasXCobrar", "Error durante el proceso de busqueda de cuotas de cobrar. Codigo: "+codigo, "ABD.PCK_OPERACIONES.F_OBTENER_DEUDAS_CLIENTE(?,?)");            
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

    public List<DetalleProductos> getProductos(String codigo, String nombre,  String almacen, String tipo){
        List<DetalleProductos> model = new ArrayList();
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_PRODUCTOS(?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.CURSOR ); 
                    switch (tipo) {
                        case "N":   
                            stmt.setString(2, null); 
                            stmt.setString(3, nombre.toUpperCase()); 
                            break;
                        case "O":
                            stmt.setString(2, codigo.toUpperCase()); 
                            stmt.setString(3, null); 
                            break;
                    }    
                    stmt.setString(4, almacen.toUpperCase());
                    stmt.execute();
                    productosRes = (ResultSet)stmt.getObject(1);
                    while (productosRes.next()){                       
                        producto = new DetalleProductos(productosRes.getString(1),
                                                        productosRes.getString(2),
                                                        productosRes.getString(3),
                                                        productosRes.getString(4),
                                                        productosRes.getString(5),
                                                        productosRes.getString(6),
                                                        productosRes.getString(7));
                        model.add(producto);
                    }                               
                    productosRes.close();
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getRecibos", "Error durante el proceso de busqueda de recibos. Producto: "+producto+" Nombre: "+nombre+" Almacen: "+almacen, "ABD.PCK_OPERACIONES.F_OBTENER_PRODUCTOS(?,?,?)");            
        }
        finally{
           sesion.close();
        }    
        return model;         
    }    
    
    public String[] crearPedido(String almacen, String cliente, String nombre, String fechaEntrega, String login, String vendedor, String codItem, Integer cantidad, String unidad, Double porcDescto, String lote, String fecVencimiento){
        String respuestas[] = new String[5];           
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_CREAR_PEDIDO(?,?,?,?,?,?,?,?,?,?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, almacen);
                    stmt.setString(3, cliente);
                    stmt.setString(4, nombre);
                    stmt.setString(5, fechaEntrega);
                    stmt.setString(6, login);
                    stmt.setString(7, vendedor);
                    stmt.setString(8, codItem);
                    stmt.setInt(9, cantidad);
                    stmt.setString(10, unidad);
                    stmt.setDouble(11, porcDescto);
                    stmt.setString(12, lote);
                    stmt.setString(13, fecVencimiento);
                    stmt.registerOutParameter(14, OracleTypes.VARCHAR);
                    stmt.registerOutParameter(15, OracleTypes.VARCHAR);
                    stmt.execute();
                    
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(14);
                    respuestas[2] = stmt.getString(15);
                        
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            String msj = " Almacen: "+almacen+" Cliente: "+cliente+" fehcEntrega: "+fechaEntrega+" login: "+login+" Vendedor: "+vendedor+" Item: "+codItem+" Cantidad: "+cantidad+" Fec.Vencimiento: "+fecVencimiento;
            manejaExcepcion( e, "crearPedido", "Error durante el proceso. Datos: "+msj, "ABD.PCK_OPERACIONES.F_CREAR_PEDIDO(?,?,?,?,?,?,?,?,?,?,?,?,?,?)");            
        }       
        finally{
           sesion.close();
        }    
        return respuestas;                 
    }     

    public String[] crearDetallePedido(String almacen, Integer pedido, String cliente, String codItem, Integer cantidad, String unidad, Double porcDescto, String login, String lote, String fecVencimiento){
        String respuestas[] = new String[5];           
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_CREAR_DETALLE_PEDIDO(?,?,?,?,?,?,?,?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, almacen);
                    stmt.setInt(3, pedido);
                    stmt.setString(4, cliente);
                    stmt.setString(5, codItem);
                    stmt.setInt(6, cantidad);
                    stmt.setString(7, unidad);
                    stmt.setDouble(8, porcDescto);
                    stmt.setString(9, login);
                    stmt.setString(10, lote);
                    stmt.setString(11, fecVencimiento);
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
            String msj = " Almacen: "+almacen+" Pedido: "+pedido+" Cliente: "+cliente+" Item: "+codItem+" Cantidad: "+cantidad+" unidad: "+unidad+" PorcDescuento: "+porcDescto+" Login: "+login+" Lote: "+lote+" Fec.Vencimiento: "+fecVencimiento;
            manejaExcepcion( e, "crearDetallePedido", "Error durante el proceso. Datos: "+msj, "ABD.PCK_OPERACIONES.F_CREAR_DETALLE_PEDIDO(?,?,?,?,?,?,?,?,?,?,?,?)");            
        }       
        finally{
           sesion.close();
        }    
        return respuestas;                 
    }   

    public Pedido getPedido(String almacen, Integer nroPedido){
        Pedido model = null;
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_PEDIDO(?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.CURSOR );                     
                    stmt.setString(2, almacen); 
                    stmt.setInt(3, nroPedido);    
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
                    }                               
                    pedidoRes.close();
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getPedido", "Error durante el proceso de busqueda. Almacen: "+almacen+" Pedido: "+pedido, "ABD.PCK_OPERACIONES.F_OBTENER_PEDIDO(?,?)");            
        }
        finally{
           sesion.close();
        } 
        model = pedido;
        return model;         
    }     

    public List<DetallePedido> getDetallePedido(String almacen, Integer pedido){
        List<DetallePedido> model = new ArrayList();
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_DET_PEDIDO(?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.CURSOR );                     
                    stmt.setString(2, almacen); 
                    stmt.setInt(3, pedido);    
                    stmt.execute();
                    pedidoRes = (ResultSet)stmt.getObject(1);
                    while (pedidoRes.next()){                       
                        detallePedido = new DetallePedido(pedidoRes.getInt(1),
                                                          pedidoRes.getString(2),
                                                          pedidoRes.getString(3),
                                                          pedidoRes.getString(4),
                                                          pedidoRes.getInt(5),
                                                          pedidoRes.getString(6),
                                                          pedidoRes.getDouble(7),
                                                          pedidoRes.getDouble(8),
                                                          pedidoRes.getDouble(9),
                                                          pedidoRes.getDouble(10),
                                                          pedidoRes.getDouble(11),
                                                          pedidoRes.getString(12),
                                                          pedidoRes.getString(13),
                                                          pedidoRes.getString(14),
                                                          pedidoRes.getString(15),
                                                          pedidoRes.getString(16),
                                                          pedidoRes.getString(17) 
                        );
                        model.add(detallePedido);
                    }                               
                    pedidoRes.close();
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getDetallePedido", "Error durante el proceso de busqueda. Almacen: "+almacen+" Pedido: "+pedido, "ABD.PCK_OPERACIONES.F_OBTENER_DET_PEDIDO(?,?)");            
        }
        finally{
           sesion.close();
        }    
        return model;         
    }     
    
    public List<Pedido> getPedidos(String almacen, String fecha){
        List<Pedido> model = new ArrayList();
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_OBTENER_PEDIDOS(?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.CURSOR );                     
                    stmt.setString(2, almacen); 
                    stmt.setString(3, fecha);    
                    stmt.execute();
                    pedidosRes = (ResultSet)stmt.getObject(1);
                    while (pedidosRes.next()){                       
                        pedido = new Pedido(pedidosRes.getString(1),
                                            pedidosRes.getString(2),
                                            pedidosRes.getString(3),
                                            pedidosRes.getString(4),
                                            pedidosRes.getString(5),
                                            pedidosRes.getString(6),
                                            pedidosRes.getString(7),
                                            pedidosRes.getDouble(8),
                                            pedidosRes.getDouble(9),
                                            pedidosRes.getString(10),
                                            pedidosRes.getString(11),
                                            pedidosRes.getString(12),
                                            pedidosRes.getString(13),
                                            pedidosRes.getString(14),
                                            pedidosRes.getString(15),
                                            pedidosRes.getString(16),
                                            pedidosRes.getString(17),
                                            pedidosRes.getString(18),
                                            pedidosRes.getString(19),
                                            pedidosRes.getString(20),
                                            pedidosRes.getString(21),
                                            pedidosRes.getString(22),
                                            pedidosRes.getString(23),
                                            pedidosRes.getString(24),
                                            pedidosRes.getString(25)    
                        );
                        model.add(pedido);
                    }                               
                    pedidosRes.close();
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            manejaExcepcion( e, "getPedidos", "Error durante el proceso de busqueda. Almacen: "+almacen+" Pedido: "+pedido, "ABD.PCK_OPERACIONES.F_OBTENER_PEDIDOS(?,?)");            
        }
        finally{
           sesion.close();
        }    
        return model;         
    }        

    public String[] terminarPedido(String almacen, Integer pedido, String login){
        String respuestas[] = new String[5];           
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_TERMINAR_PEDIDO(?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, almacen);
                    stmt.setInt(3, pedido);
                    stmt.setString(4, login);
                    stmt.registerOutParameter(5, OracleTypes.VARCHAR);
                    stmt.execute();
                    
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(5);                        
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            String msj = "Error al procesar:  Almacen: "+almacen+" Pedido: "+pedido;
            manejaExcepcion( e, "terminarPedido", "Error durante el proceso. Datos: "+msj, "ABD.PCK_OPERACIONES.F_TERMINAR_PEDIDO(?,?,?,?)");            
        }       
        finally{
           sesion.close();
        }    
        return respuestas;                 
    }             

    public String[] pagarPedido(String almacen, Integer pedido, String login, String formaPago, String tipoPago, String analitico, String razonSocial, String nit){
        String respuestas[] = new String[5];           
        iniciaOperacion();
         try{
            sesion.doWork(new Work() 
            {  
                @Override 
                public void execute(Connection conn) throws SQLException {
                    CallableStatement stmt = conn.prepareCall("{? = call ABD.PCK_OPERACIONES.F_PAGAR_PEDIDO(?,?,?,?,?,?,?,?,?)}");
                    stmt.clearParameters();
                    stmt.registerOutParameter(1, OracleTypes.VARCHAR );//java.sql.Types.VARCHAR); //  java.sql.ResultSet
                    stmt.setString(2, almacen);
                    stmt.setInt(3, pedido);
                    stmt.setString(4, login);
                    stmt.setString(5, formaPago);
                    stmt.setString(6, tipoPago);
                    stmt.setString(7, analitico);
                    stmt.setString(8, razonSocial);
                    stmt.setString(9, nit);
                    stmt.registerOutParameter(10, OracleTypes.VARCHAR); 
                    stmt.execute();
                    
                    respuestas[0] = stmt.getString(1);
                    respuestas[1] = stmt.getString(10); 
                        
                    stmt.close();
                }
            });   
        }         
        catch(HibernateException e){
            String msj = " Almacen: "+almacen+" Pedido: "+pedido+" login: "+login+" formaPago: "+formaPago+" tipoPago: "+tipoPago+" analitico: "+analitico+" RazonSOaicl: "+razonSocial+" Nit: "+nit;
            manejaExcepcion( e, "crearDetallePedido", "Error durante el proceso. Datos: "+msj, "ABD.PCK_OPERACIONES.F_PAGAR_PEDIDO(?,?,?,?,?,?,?)");            
        }       
        finally{
           sesion.close();
        }    
        return respuestas;                 
    }      
}
