/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package objetos;

/**
 *
 * @author marce
 */
public class DetalleProductos {
    private String almacen;
    private String producto;
    private String nombre;
    private String unidad;
    private String lote;
    private String fecha;
    private String saldo;

    public DetalleProductos() {
    }

    public DetalleProductos(String almacen, String producto, String nombre, String unidad, String lote, String fecha, String saldo) {
        this.almacen = almacen;
        this.producto = producto;
        this.nombre = nombre;
        this.unidad = unidad;
        this.lote = lote;
        this.fecha = fecha;
        this.saldo = saldo;
    }

    public String getAlmacen() {
        return almacen;
    }

    public void setAlmacen(String almacen) {
        this.almacen = almacen;
    }

    public String getProducto() {
        return producto;
    }

    public void setProducto(String producto) {
        this.producto = producto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }

    public String getLote() {
        return lote;
    }

    public void setLote(String lote) {
        this.lote = lote;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getSaldo() {
        return saldo;
    }

    public void setSaldo(String saldo) {
        this.saldo = saldo;
    }

    @Override
    public String toString() {
        return "DetalleProductos{" + "almacen=" + almacen + ", producto=" + producto + ", nombre=" + nombre + ", unidad=" + unidad + ", lote=" + lote + ", fecha=" + fecha + ", saldo=" + saldo + '}';
    }
    
    
}
