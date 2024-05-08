/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package util;


import java.util.Enumeration;
import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
/**
 *
 * @author 
 */
public class SessionUtil {
    

    public static Object getAttribute(ServletRequest request, String key) {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpSession session = (HttpSession) req.getSession(false);
        Object o = null;
        if (session != null) {
            o = session.getAttribute(key);
        }
        return o;
    }
    
    public static boolean removeAttribute(ServletRequest request, String key) {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpSession session = (HttpSession) req.getSession(false);
        boolean o = false;
        if (session != null) {
            session.removeAttribute(key);
            o = true;
        }
        return o;
    }   
    public static boolean removeAllAttribute(ServletRequest request) {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpSession session = (HttpSession) req.getSession(false);
        boolean o = false;
        if (session != null) {
            Enumeration<String> attributeNames = session.getAttributeNames();
            if (attributeNames != null) {
                while (attributeNames.hasMoreElements()){
                    session.removeAttribute(attributeNames.nextElement());
                    o = true;
                }            
            }
        }
        return o;
    }       
}
