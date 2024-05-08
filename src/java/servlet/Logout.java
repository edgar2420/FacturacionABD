package servlet;

//import config.Constantes;
//import enums.SessionKey;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.context.FacesContext;
import util.SessionUtil;
/**
 * 
 * @autor 
 */
public class Logout extends HttpServlet {
    static final Logger LOGGER = Logger.getLogger(Logout.class.getName());
    private static final String CLASSNAME = Logout.class.getName();   
    private static final String CABLOG = CLASSNAME+"[servlet]["+CLASSNAME+"]";  
    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code> methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");        
        String username = (String) SessionUtil.getAttribute(request, "usuario");
        String address = request.getRemoteAddr();            
        HttpSession session = request.getSession(false);            
        if (session != null && username != null) {
            LOGGER.log(Level.INFO, "{0}[ABDFacturacion][servlet][Logout][processRequest][sessionInvalidated][remoteAdress]:"+address + "[username]:"+username, "APP-TRASNPORTE");
            session.invalidate();
        }
        boolean removeAllAttribute = SessionUtil.removeAllAttribute(request);

        LOGGER.log(Level.INFO, "{0}[ABDFacturacion][servlet][Logout][processRequest][sesionCerradaDeUsuario][remoteAdress]:"+address + "[username]:"+username + "[removeAllAttribute]:"+removeAllAttribute, "APP-TRASNPORTE");

        response.sendRedirect(request.getContextPath());        
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
