/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package security;

import java.io.IOException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.faces.event.PhaseEvent;
import javax.faces.event.PhaseId;
import javax.faces.event.PhaseListener;
import util.FacesUtil;

/**
 *
 * @author 
 */
public class AutenticationListener implements PhaseListener{
    static final Logger LOGGER =Logger.getLogger(AutenticationListener.class.getName());
    public static final String CARPETAS_USUARIO ="/views/";//Carpeta donde estan las vistas del usuario

    @Override
    public void afterPhase(PhaseEvent pe) {
        String cabLog = "ABDCOBROS[AutenticationListener][afterPhase]";
        String paginaActual = FacesContext.getCurrentInstance().getViewRoot().getViewId();
        LOGGER.log(Level.INFO,cabLog+ " paginaActual: "+paginaActual );
        ExternalContext ec = FacesContext.getCurrentInstance().getExternalContext();
        Map params = ec.getRequestParameterMap();  
        boolean esArchivoPolizaADesacargar = false;
        for (Object object : params.keySet()) {
            if ( object.getClass().equals(String.class) ){
                String key = String.valueOf(object);
                if (key.equals("link")) {
                    esArchivoPolizaADesacargar = true;
                    LOGGER.log(Level.INFO,cabLog+ " valor de atributo link: "+params.get(object) );
                }            
            }
        }
        if (!esArchivoPolizaADesacargar) {
            boolean esPaginaQueNecesitaAutenticacion = paginaActual.contains(CARPETAS_USUARIO);
            if (esPaginaQueNecesitaAutenticacion) {
                Object nombreUsuario = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario"); 
                
               //String usuario = util.FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario").toString(); 
                LOGGER.log(Level.INFO,cabLog+ " nombreUsuario: "+nombreUsuario); //+" Usuario: "+usuario );
 // FacesUtil.getSessionMapValue(FacesContext.getCurrentInstance(), "usuario");//TODO Mejorar para que tome un 
                String urlLogin = FacesUtil.getWebContext(FacesContext.getCurrentInstance()) + "/login.xhtml";
                if (nombreUsuario ==null) {
                    try {
                    //No está logueado
                    LOGGER.log(Level.INFO,cabLog+ " nombreUsuario: "+nombreUsuario +" no esta logueado redireccionando: "+urlLogin );
                    FacesUtil.direccionarAUnaPagina(FacesContext.getCurrentInstance(), urlLogin);
                    } catch (IOException ex) {
                        LOGGER.getLogger(AutenticationListener.class.getName()).log(Level.SEVERE, null, ex);
                    }
                } 
            }            
        }

    }

    @Override
    public void beforePhase(PhaseEvent pe) {
        
    }

    @Override
    public PhaseId getPhaseId() {
        return PhaseId.RESTORE_VIEW;
    }
    
}
