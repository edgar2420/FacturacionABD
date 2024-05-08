/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package util;

import config.Parametros;
import java.io.IOException;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;
import java.util.logging.Level;
import java.util.logging.Logger;
public class FacesUtil {
    //También se puede utilizar un RequestMap para pasar objetos al siguiente request, teniendo en cuenta que serán "limpiados" después de un request.
    public static Object getRequestMapValue(FacesContext context, String key) {
        return context.getExternalContext().getRequestMap().get(key);
    }
    public static void setRequestMapValue(FacesContext context, String key, Object value) {
        context.getExternalContext().getRequestMap().put(key, value);
    }    
   // Otra manera es utilizar un SessionMap para mantener los valores que deben ser guardados durante la sesión del usuario:
    public static Object getSessionMapValue(FacesContext context, String key) {
        return context.getExternalContext().getSessionMap().get(key);
    }
    public static String getStringSessionMapValue(FacesContext context, String key) {
        return context.getExternalContext().getSessionMap().get(key).toString();
    }
    
    public static void setSessionMapValue(FacesContext context, String key, Object value) {
        context.getExternalContext().getSessionMap().put(key, value);
    }
    public static Object removeSessionMapValue(FacesContext context, String key) {
        return context.getExternalContext().getSessionMap().remove(key);
    }
    public static void direccionarAUnaPagina(FacesContext facesContext, String url) throws IOException{  
            ExternalContext context = facesContext.getExternalContext();
            context.redirect(url);  
    }        
    public static String getWebContext(FacesContext facesContext){    
        String nombreProyecto = facesContext.getExternalContext().getRequestContextPath();//   /AppOpcionPagoWeb
        return nombreProyecto;
    }    
    
    public static String baseUrlProject(){
        String nombreProyecto = FacesContext.getCurrentInstance().getExternalContext().getRequestContextPath();//   /AppOpcionPagoWeb    
        String urlBase =  baseServerUrlProject()+nombreProyecto;   
        return urlBase;
    }
    
    public static String baseServerUrlProject(){
        //String nombreProyecto = FacesContext.getCurrentInstance().getExternalContext().getRequestContextPath();//   /AppOpcionPagoWeb
        if (Parametros.BASE_DOMINIO_ACTIVO.equals("true")||Parametros.BASE_DOMINIO_ACTIVO.equals("TRUE")) {
            return Parametros.BASE_DOMINIO_VALOR;
        }

        HttpServletRequest origRequest = (HttpServletRequest)FacesContext.getCurrentInstance().getExternalContext().getRequest();        
        String puertoServidor = String.valueOf(origRequest.getServerPort());
        String nombreServidor = origRequest.getServerName();
        String protocol = "http://";
        if (origRequest.isSecure()) {
            protocol = "https://";
        }        
        String urlBase =  protocol+nombreServidor+":"+puertoServidor;   
        return urlBase;
    }       
    public static void redirectSubPage(FacesContext facesContext, String paginaInterna, String cabLog){
        String nombreProyecto = facesContext.getExternalContext().getRequestContextPath();//  
        try {         
            String ruta = nombreProyecto+paginaInterna;
            System.out.println(cabLog+"[redirectSubPage] "+ruta);
            facesContext.getExternalContext().redirect(nombreProyecto+paginaInterna);
        } catch (IOException ex) {
            Logger.getLogger(FacesUtil.class.getName()).log(Level.SEVERE, cabLog+"Excepcion al direccionar página: " + ex.getMessage(), ex);
        }
    }      
}
