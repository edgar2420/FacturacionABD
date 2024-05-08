/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package config;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.ResourceBundle;
import java.util.logging.Level;

/**
 * 
 * @autor mguardia
 * @fecha enero 16. 2023
 * @empresa LAboratorios ABD
 */
public class Parametros implements Serializable{
    /**
     * Nombre del archivo de configuracion
     **/
    protected final static String FILECONF = "config.constantes_validacion";
    protected final static String MAILFILECONF = "config.constantes_mails";

    
    //Parmametros para generales para envío de mail
    public static String REGEX_EMAIL;
    public static String REGEX_USERNAME;
    
    //Parmametros para generales para envío de mail
    public static String SENDER_MAIL_SMTP_SSL_TRUST;
    public static String SENDER_MAIL_SMTP_PORT;
    public static String SENDER_MAIL_SMTP_SERVER;
    public static String SENDER_MAIL_USERNAME;
    public static String SENDER_MAIL_PASSWORD;
    public static String SENDER_MAIL_EMAILFROM;
        

    //Parmametros para email de recuperacion de contraseña
    public static String SENDER_MAIL_RECUPERAR_PASSWORD_SUBJECT;
    public static String SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_SALUDO;
    public static String SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_PARRAFO1;
    public static String SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_PARRAFO2;
    public static String SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_DESPEDIDA;
    
    
    //Parametros mail de notificacion para soporte
    public static String SENDER_MAIL_NOTIFICACION_ERROR_SUBJECT;
    public static String SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_SALUDO;
    public static String SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_PARRAFO1;
    public static String SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_PARRAFO2;
    public static String SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_DESPEDIDA;
    public static String SENDER_MAIL_NOTIFICACION_ERROR_EMAIL_SUPPORT;
    
    
    public static String BASE_DOMINIO_ACTIVO;
    public static String BASE_DOMINIO_VALOR;
        
    static {
        try {
            ResourceBundle ps = loadProperties(FILECONF);
            REGEX_EMAIL = ps.getString("REGEX_EMAIL");
            REGEX_USERNAME = ps.getString("REGEX_USERNAME");            
            
            ResourceBundle psmail = loadProperties(MAILFILECONF);

            BASE_DOMINIO_ACTIVO = psmail.getString("BASE_DOMINIO_ACTIVO");
            BASE_DOMINIO_VALOR = psmail.getString("BASE_DOMINIO_VALOR");
            
            
            SENDER_MAIL_SMTP_SSL_TRUST = psmail.getString("SENDER_MAIL_SMTP_SSL_TRUST");
            SENDER_MAIL_SMTP_PORT = psmail.getString("SENDER_MAIL_SMTP_PORT");
            SENDER_MAIL_SMTP_SERVER = psmail.getString("SENDER_MAIL_SMTP_SERVER");
            SENDER_MAIL_USERNAME = psmail.getString("SENDER_MAIL_USERNAME");
            SENDER_MAIL_PASSWORD = psmail.getString("SENDER_MAIL_PASSWORD");
            SENDER_MAIL_EMAILFROM = psmail.getString("SENDER_MAIL_EMAILFROM");            
            
            SENDER_MAIL_RECUPERAR_PASSWORD_SUBJECT = psmail.getString("SENDER_MAIL_RECUPERAR_PASSWORD_SUBJECT");
            SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_SALUDO = psmail.getString("SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_SALUDO");
            SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_PARRAFO1 = psmail.getString("SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_PARRAFO1");
            SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_PARRAFO2 = psmail.getString("SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_PARRAFO2");
            SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_DESPEDIDA = psmail.getString("SENDER_MAIL_RECUPERAR_PASSWORD_CONTENT_HTML_DESPEDIDA");            

            SENDER_MAIL_NOTIFICACION_ERROR_SUBJECT = psmail.getString("SENDER_MAIL_NOTIFICACION_ERROR_SUBJECT");
            SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_SALUDO = psmail.getString("SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_SALUDO");
            SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_PARRAFO1 = psmail.getString("SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_PARRAFO1");
            SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_PARRAFO2 = psmail.getString("SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_PARRAFO2");
            SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_DESPEDIDA = psmail.getString("SENDER_MAIL_NOTIFICACION_ERROR_CONTENT_HTML_DESPEDIDA");
            SENDER_MAIL_NOTIFICACION_ERROR_EMAIL_SUPPORT = psmail.getString("SENDER_MAIL_NOTIFICACION_ERROR_EMAIL_SUPPORT");
            
                        
          
            java.util.logging.Logger.getLogger(Parametros.class.getName()).log(Level.INFO, Constantes.WPBAPP + "[SENDER_MAIL_SMTP_SERVER]:" +SENDER_MAIL_SMTP_SERVER +"[SENDER_MAIL_USERNAME]:"+SENDER_MAIL_USERNAME +"[SENDER_MAIL_EMAILFROM]:"+SENDER_MAIL_EMAILFROM );
        } catch (Exception e) {
            java.util.logging.Logger.getLogger(Parametros.class.getName()).log(Level.SEVERE, Constantes.WPBAPP + " Excepcion al cargar parametros ",e);
        }
    }

    /**
     * Metodos para realizar el cargado del archivo de propiedades de la ruta de jboss o local del proyecto
     */
    private static ResourceBundle loadProperties(String fileProperties) throws Exception {
        try {
            ResourceBundle bundle = ResourceBundle.getBundle(fileProperties);
            return bundle;
        } catch (Exception e) {
            throw new Exception("No se pudo loadInit el archivo de propiedades "+fileProperties+".properties", e);
        }
    }


}

