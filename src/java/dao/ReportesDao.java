/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package dao;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.Serializable;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;
import lib.Constantes;
import lib.DBConnection;
import lib.Errores;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRExporter;
import net.sf.jasperreports.engine.JRExporterParameter;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.Transaction;
import util.HibernateUtil;

/**
 *
 * @author marce
 */
public class ReportesDao implements Serializable {
    private static final long serialVersionUID = 8792346478674716638L;
    String claseJava = "ReporteDao.java";
    private Session sesion;
    private Transaction tx;
    String ip = ((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    String userLogin = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString(); 
    private String erroresLog = "logs/errores.log";
    private String operacionesLog = "logs/reportes.log";
    static private String aplicacion = "ABDFacturacion";

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
    
    public String generaQR(String qrText, String nombre){
        QRGeneratorDao q = new QRGeneratorDao();
        q.generarQRCode(qrText, nombre, userLogin, ip);
        return qrText;
    }
    
    public String generaReporteFactura(String tipo, String factura, String autorizacion) throws FileNotFoundException, Exception{
        System.out.println("ABDFacturacion -> ReporteDao -> generaReporteFactura -> Inicio...  Tipo: "+tipo+" Autorizacion: "+autorizacion+" Factura: "+factura);
        String path;
        String rutaReporte; 
        String rutaReporteGenerado; 
        String fileName0="";
        String fileName1="";
        String nombreArchivo="";     
        String repHojaInicial;
        String nombreReporte;
        String sql ;
        File reportFile;
        try (Connection conn = DBConnection.openDBConnection())
        {
            CallableStatement stmt = conn.prepareCall("{call P_GENERA_QR_FACTURA(?,?)}");
            stmt.setString(1, autorizacion);
            stmt.setString(2, factura);
            stmt.execute();
            
            path = Constantes.dbRepPath;
            rutaReporte = path; 
            path = Constantes.dbRepGenPath;
            rutaReporteGenerado = path; 
            try{
               /*** Para reporte: Condiciones Particulares ***/
               if (tipo.equalsIgnoreCase("R"))
                   nombreReporte = "rptFactRollo_SFE";               
               else
                   nombreReporte = "rptFact_SFE";
               
               System.out.println("ABDFacturacion -> ReporteDao -> generaReporteFactura -> Inicio...  Tipo: "+tipo+" Autorizacion: "+autorizacion+" Factura: "+factura+"  nombreReporte: "+nombreReporte);
               reportFile = new File(rutaReporte+nombreReporte+".jasper");
               fileName0 = "Factura_"+factura+"_Autorizacion_"+ autorizacion;
               nombreArchivo = rutaReporteGenerado+fileName0+".pdf";
               repHojaInicial = nombreArchivo;
              //Mapeamos parametros de reporte
               Map parameters = new HashMap();
               parameters.put("SUBREPORT_DIR", rutaReporte);
               parameters.put("P_NUMERO", factura);     
               parameters.put("P_AUTORIZACION", autorizacion);    
               JasperPrint jasperPrint = JasperFillManager.fillReport(new FileInputStream(reportFile), parameters, conn);
               JRExporter exporter = new  net.sf.jasperreports.engine.export.JRPdfExporter();
               exporter.setParameter(JRExporterParameter.OUTPUT_FILE_NAME, nombreArchivo);
               exporter.setParameter(JRExporterParameter.JASPER_PRINT,jasperPrint);
               exporter.exportReport();   
               parameters.clear();
               System.out.println("ABDFacturacion -> ReporteDao -> generaReporteFactura -> Generado... reporte1-2: "+repHojaInicial);                 
               conn.close();             
           }
           catch (JRException e)
           {   
               conn.close();
               e.printStackTrace();
               Errores.registrarLogArchivo
                   ("ERROR CREACION FACTURA","generaReporteFactura"
                   +"\n Nombre (User SO): " + System.getProperty("os.name")
                   +"\n Version (SO): "+ System.getProperty("os.version")
                   +"\n Arquitectura (SO): "+ System.getProperty("os.arch")      
                   +"\n Usuario: "+userLogin
                   +"\n Nro. Factura: "+factura
                   +"\n Autorizacion: "+autorizacion
                   +"\n IP Ususario: "+ip
                   +"\n Descripcion: "+e.getMessage(),
                   "No se pudo crear Factura.",
                   erroresLog, "ABDFActuracion",  "Error en la ejecucion del reporte");                 
           }               
        
           catch (FileNotFoundException e)
           {
               conn.close(); 
               Errores.registrarLogArchivo
                   ("ERROR CREACION FACTURA","generaReporteFactura"
                   +"\n Nombre (User SO): " + System.getProperty("os.name")
                   +"\n Version (SO): "+ System.getProperty("os.version")
                   +"\n Arquitectura (SO): "+ System.getProperty("os.arch")       
                   +"\n Usuario: " + userLogin
                   +"\n Nro. Factura: "+factura
                   +"\n Autorizacion: "+autorizacion
                   +"\n IP Ususario: "+ip
                   +"\n Descripcion: "+e.getMessage(),
                   "No se pudo generar Factura",
                   erroresLog, "ABDFActuracion",  "Archivo no encotrado en la ejecucion del reporte");                 
            }
        }
        catch(SQLException  e)  { 
            e.printStackTrace();
           Errores.registrarLogArchivo
              ("ERROR CREACION FACTURA","generaReporteFactura"
              +"\n Nombre (User SO): " + System.getProperty("os.name")
              +"\n Version (SO): "+ System.getProperty("os.version")
              +"\n Arquitectura (SO): "+ System.getProperty("os.arch")         
              +"\n Usuario: "+ userLogin
              +"\n Nro. Factura: "+factura
              +"\n Autorizacion: "+autorizacion
              +"\n IP Ususario: "+ip
              +"\n Descripcion: "+e.getMessage(),
              "No se pudo conectar a la Base de datos",
              erroresLog, "ABDFActuracion",  "Error durante la conexion");             
        }
        
       return fileName0;
    }
    
   
    public String generaReporteRecibo(String deposito, String tipo) throws FileNotFoundException, Exception{
        System.out.println("ABDFacturacion -> ReporteDao -> generaReporteRecibo -> Inicio...  deposito: "+deposito+" Tipo: "+tipo);
        String path;
        String rutaReporte; 
        String rutaReporteGenerado; 
        String fileName0="";
        String fileName1="";
        String nombreArchivo="";     
        String repHojaInicial;
        String nombreReporte;
        String sql ;
        File reportFile;
        try (Connection conn = DBConnection.openDBConnection())
        {            
            path = Constantes.dbRepPath;
            rutaReporte = path; 
            path = Constantes.dbRepGenPath;
            rutaReporteGenerado = path; 
            try{
               /*** Para reporte: Condiciones Particulares ***/
               if (tipo.equalsIgnoreCase("R"))
                   nombreReporte = "rptReciboRollo";               
               else
                   nombreReporte = "rptRecibo";
               
               System.out.println("ABDFacturacion -> ReporteDao -> generaReporteRecibo -> Inicio...  Nro. Deposito: "+deposito+" Tipo: "+tipo+"  NombreReporte: "+nombreReporte);
               reportFile = new File(rutaReporte+nombreReporte+".jasper");
               fileName0 = "ABD-Recibo_"+deposito;
               nombreArchivo = rutaReporteGenerado+fileName0+".pdf";
               repHojaInicial = nombreArchivo;
              //Mapeamos parametros de reporte
               Map parameters = new HashMap();
               parameters.put("SUBREPORT_DIR", rutaReporte);
               parameters.put("P_DEPOSITO", deposito);    
               JasperPrint jasperPrint = JasperFillManager.fillReport(new FileInputStream(reportFile), parameters, conn);
               JRExporter exporter = new  net.sf.jasperreports.engine.export.JRPdfExporter();
               exporter.setParameter(JRExporterParameter.OUTPUT_FILE_NAME, nombreArchivo);
               exporter.setParameter(JRExporterParameter.JASPER_PRINT,jasperPrint);
               exporter.exportReport();   
               parameters.clear();
               System.out.println("ABDFacturacion -> ReporteDao -> generaReporteRecibo -> Generado... reporte1-2: "+repHojaInicial);                 
               conn.close();             
           }
           catch (JRException e)
           {   
               
               e.printStackTrace();
               conn.close();
               Errores.registrarLogArchivo
                   ("ERROR CREACION RECIBO","generaReporteRecibo"
                   +"\n Nombre (User SO): " + System.getProperty("os.name")
                   +"\n Version (SO): "+ System.getProperty("os.version")
                   +"\n Arquitectura (SO): "+ System.getProperty("os.arch")      
                   +"\n Usuario: "+userLogin
                   +"\n Nro. Deposito: "+deposito
                   +"\n tipo: "+tipo
                   +"\n IP Ususario: "+ip
                   +"\n Descripcion: "+e.getMessage(),
                   "No se pudo crear Factura.",
                   erroresLog, "ABDFActuracion",  "Error en la ejecucion del reporte");                 
           }               
        
           catch (FileNotFoundException e)
           {
               
               e.printStackTrace();
               conn.close(); 
               Errores.registrarLogArchivo
                   ("ERROR CREACION RECIBO","generaReporteRecibo"
                   +"\n Nombre (User SO): " + System.getProperty("os.name")
                   +"\n Version (SO): "+ System.getProperty("os.version")
                   +"\n Arquitectura (SO): "+ System.getProperty("os.arch")       
                   +"\n Usuario: " + userLogin
                   +"\n Nro. Deposito: "+deposito
                   +"\n tipo: "+tipo
                   +"\n IP Ususario: "+ip
                   +"\n Descripcion: "+e.getMessage(),
                   "No se pudo generar Factura",
                   erroresLog, "ABDFActuracion",  "Archivo no encotrado en la ejecucion del reporte");                 
            }
        }
        catch(SQLException  e)  { 
            e.printStackTrace();
           Errores.registrarLogArchivo
              ("ERROR CREACION RECIBO","generaReporteRecibo"
              +"\n Nombre (User SO): " + System.getProperty("os.name")
              +"\n Version (SO): "+ System.getProperty("os.version")
              +"\n Arquitectura (SO): "+ System.getProperty("os.arch")         
              +"\n Usuario: "+ userLogin
                   +"\n Nro. Deposito: "+deposito
                   +"\n tipo: "+tipo
              +"\n IP Ususario: "+ip
              +"\n Descripcion: "+e.getMessage(),
              "No se pudo conectar a la Base de datos",
              erroresLog, "ABDFActuracion",  "Error durante la conexion");             
        }
        
       return fileName0;
    }
        
}
