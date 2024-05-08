/*
 * @author Marcelo Guardia
 * @version 1.0
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package util;

import org.hibernate.HibernateException;
import org.hibernate.cfg.AnnotationConfiguration;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import javax.faces.context.FacesContext;
import model.Usuarios;
import lib.*;
import javax.servlet.http.HttpServletRequest;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.cfg.Configuration;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.service.ServiceRegistryBuilder;
import org.hibernate.context.internal.ThreadLocalSessionContext;
/**
 * Hibernate Utility class with a convenient method to get Session Factory
 * object.
 *
 * @author Marcelo guardia
 */
final public class HibernateUtil {
    private static final String archivoLog = "logs/login.log";
    private static final String claseJava = "HibernateUtil.java";
    private static Usuarios usuario;  
    private static final String ip =((HttpServletRequest) FacesContext.getCurrentInstance().getExternalContext().getRequest()).getRemoteAddr();
    //private static ServiceRegistry serviceRegistry;
    private static  ThreadLocal<Session> threadLocal = new ThreadLocal();
    
    private static SessionFactory sessionFactory; //final SessionFactory sessionFactory;
    private static StandardServiceRegistry serviceRegistry;
    
    static {
        try {
              // Create the SessionFactory from standard (hibernate.cfg.xml) 
              // config file.
              if (sessionFactory==null){
                sessionFactory = new AnnotationConfiguration().configure().buildSessionFactory();
              }//sessionFactory =new AnnotationConfiguration().configure(“com/config/hibernate.cfg.xml”).buildSessionFactory();
            } catch (HibernateException ex) {
              // Log the exception. 
              Errores.registrarLogErrores
              (ex,"Error : Initial SessionFactory creation failed"
              + "\n ID de Usuario (UID): " 
              + "\n IP Ususario: "+ ip,
              "Error al validar usuario en login de Clase: loginBean  " + "Revisar , o intento no autorizado de ingreso. ",
              archivoLog, claseJava); 
              System.err.println("Initial SessionFactory creation failed." + ex);
              throw new ExceptionInInitializerError(ex);
            }
           }
    
    public static SessionFactory getSessionFactory() {
        //reabrimos la sesion si esta cerrada al liberar los recursos
      /*if(sessionFactory.isClosed())
      {
        System.out.println("Reopen session");
        sessionFactory.openSession();
      }*/
      return sessionFactory;//return sessionFactory;
    }
    
    // Se crean varios metodos para garantizar el inicio y cierre de sesionesss
    // Funciones adiocionales para el manejo de sesion: crear sesion, cerrar de sesion, etc
    // Crea el objeto SessionFactory
    public static synchronized void buildSessionFactory() {
      if (sessionFactory == null) {
        Configuration configuration = new Configuration();
        configuration.configure();
        configuration.setProperty("hibernate.current_session_context_class", "thread");
        ServiceRegistry serviceRegistryB = new ServiceRegistryBuilder().applySettings(configuration.getProperties()).build();// .buildServiceRegistry();
        sessionFactory = configuration.buildSessionFactory(serviceRegistryB);
      }
    }
    
    // Nos retorna un objeto SessionFactory que hemos guardado en la variable estática
    public static SessionFactory getSessionFactoryB() {
      if (sessionFactory==null)  {
           buildSessionFactory();
      }
      return sessionFactory;
    }
    // Otro metodo para crear la sesion
    public static SessionFactory createSessionFactory() {
      Configuration configuration = new Configuration();
      configuration.configure();
      serviceRegistry = new ServiceRegistryBuilder().applySettings(configuration.getProperties()).build();// .buildServiceRegistry(); //build();
      sessionFactory = configuration.buildSessionFactory(serviceRegistry);
      return sessionFactory;
   }
   // Crea las sesiones a partir de un hibernate.cfg.xml   
  
    private static SessionFactory configureSessionFactory() throws HibernateException {
        Configuration configuration = new Configuration();
        configuration.configure();
        configuration.configure("/com/rtw/test/hiber/hibernate.cfg.xml"); // -> Ruta para conectarnos a la base de dtos
        serviceRegistry = new ServiceRegistryBuilder().applySettings(configuration.getProperties()).build();// buildServiceRegistry();        
        sessionFactory = configuration.buildSessionFactory(serviceRegistry);
        return sessionFactory;
    }
    
     public static SessionFactory getSessionFactoryC() {
       return configureSessionFactory();
    }
    
    // Crea la nueva sesión
    public static void openSessionAndBindToThread() {
      Session session = sessionFactory.openSession();
      ThreadLocalSessionContext.bind(session);
    }
    
    //Cierra la sesión que se creó mediante openSessionAndBindToThread().
    public static void closeSessionAndUnbindFromThread() {
       Session session = ThreadLocalSessionContext.unbind(sessionFactory);
         if (session!=null) {
             session.close();
         }
    }
    
    // Cierra el objeto SessionFactory.
    public static void closeSessionFactory() {
      if ((sessionFactory!=null) && (sessionFactory.isClosed()==false)) {
             sessionFactory.close();
      }
    }
    // Shutdown de aplicacion
    public static void shutdown() {
      // Close caches and connection pools
      getSessionFactory().close();
    }

    public static Session beginTransaction() {
      Session hibernateSession = HibernateUtil.getSession();
      hibernateSession.beginTransaction();
      return hibernateSession;
    }
 
    public static void commitTransaction() {
      HibernateUtil.getSession().getTransaction().commit();
    }
 
    public static void rollbackTransaction() {
      HibernateUtil.getSession().getTransaction().rollback();
    }
 
    public static void closeSession() {
      HibernateUtil.getSession().close();
    }
 
    public static Session getSession() {
      Session hibernateSession = sessionFactory.getCurrentSession();
      return hibernateSession;
   }

public static void main(String[] args){
     String aux;
     getSessionFactory();
     System.out.println("HibernateUtil -> Se conecto a la base de datos");
    }


}


