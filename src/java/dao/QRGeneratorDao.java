/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package dao;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Hashtable;
import javax.imageio.ImageIO;
import lib.Constantes;
import lib.Errores;

/**
 *
 * @author marce
 */
public class QRGeneratorDao {
    
public static void main(String[] args) {
        //generarQRCode("1028175023|COMPAÑIA DE SEGUROS Y REASEGUROS FORTALEZA S.A.|259970|7904001158383|17/07/2014|450,56|CF-F9-2A-ED|30/09/2014|0.0|0.0|3496897|GUARDIA MARCELO", "123456");
        String myCodeText = "1028175023|527|428401800000643|19/03/2018|10451501.89|10451501.89|80-D4-54-9F-31|154422029|0.00|0.00|0.00|0.00"; //1028175023|380|428401100022636|10/02/2022|3375.6|3375.6|1E-54-C5-6A-B0|7230373012|0.00|0.00|0.00|0.00";
                         // "1028175023|6|7904001464163|02/06/2015|142,12|142,12|79-76-4C-6D-07|3291823|0|0|0|0";
        String filePath = "D:\\2089328.png";
        int size = 500;
        String fileType = "png";    
        File myFile = new File(filePath);
        try {
            Hashtable<EncodeHintType, ErrorCorrectionLevel> hintMap = new Hashtable<EncodeHintType, ErrorCorrectionLevel>();
            hintMap.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix byteMatrix = qrCodeWriter.encode(myCodeText,BarcodeFormat.QR_CODE, size, size, hintMap);
            int CrunchifyWidth = byteMatrix.getWidth();
            BufferedImage image = new BufferedImage(CrunchifyWidth, CrunchifyWidth,
            BufferedImage.TYPE_INT_RGB);
            image.createGraphics();
            //-----------//
            Graphics2D graphics = (Graphics2D) image.getGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, CrunchifyWidth, CrunchifyWidth);
            graphics.setColor(Color.BLACK);
            //-----------//
            for (int i = 0; i < CrunchifyWidth; i++) {
                for (int j = 0; j < CrunchifyWidth; j++) {
                    if (byteMatrix.get(i, j)) {
                        graphics.fillRect(i, j, 1, 1);
                    }
                }
            }
            ImageIO.write(image, fileType, myFile);
    } catch (WriterException e) {
        e.printStackTrace();
    } catch (IOException e) {
        e.printStackTrace();
        Errores.registrarLogErrores
                (e,"Error : No se pudo generar QR Code,"
                +"\n ID Transaccion: "+myFile
                +"\n ID de Usuario (UID): "+"prueba"
                +"\n IP Ususario: "+"10.17.31.253",
                "Error de escritura en discoon Clase: qrGeneratorBean  ",
                "logs/procesos.log", "IMAGEN QR_CODE");
    } catch (Exception e) {
        e.printStackTrace();    
        Errores.registrarLogErrores
                (e,"Error : No se pudo generar QR Code,"
                +"\n ID Transaccion: "+myFile
                +"\n ID de Usuario (UID): "+"prueba"
                +"\n IP Ususario: "+"10.17.31.253",
                "Error Exception al generar imagen QR para la transaccion Clase: qrGeneratorBean  ",
                "logs/procesos.log", "IMAGEN QR_CODE");
    }
        System.out.println("\n Se creo satisfactoriamente miaegn  QR Code para: "+filePath);
    }           

public static void generarQRCode(String myCodeText, String nombreArchivo, String usuario, String ip)
{   
    //String myCodeText = "esta es una prueba";
    //myCodeText = "1028175023|6|7904001464163|02/06/2015|142,12|142,12|79-76-4C-6D-07|3291823|0|0|0|0";
    String procesos = "logs/procesos.log";
    String path = Constantes.dbImgQRPath;
    String filePath =  path + nombreArchivo + ".png";
    int size = 125;
    String fileType = "png";
    File myFile = new File(filePath);
    try {
        Hashtable<EncodeHintType, ErrorCorrectionLevel> hintMap = new Hashtable<EncodeHintType, ErrorCorrectionLevel>();
        hintMap.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix byteMatrix = qrCodeWriter.encode(myCodeText,BarcodeFormat.QR_CODE, size, size, hintMap);
        int CrunchifyWidth = byteMatrix.getWidth();
        BufferedImage image = new BufferedImage(CrunchifyWidth, CrunchifyWidth,
        BufferedImage.TYPE_INT_RGB);
        image.createGraphics();
        //-----------//
        Graphics2D graphics = (Graphics2D) image.getGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, CrunchifyWidth, CrunchifyWidth);
        graphics.setColor(Color.BLACK);
        //-----------//
        for (int i = 0; i < CrunchifyWidth; i++) {
            for (int j = 0; j < CrunchifyWidth; j++) {
                if (byteMatrix.get(i, j)) {
                    graphics.fillRect(i, j, 1, 1);
                }
            }
        }
        ImageIO.write(image, fileType, myFile);
    } catch (WriterException e) {
        e.printStackTrace();
    } catch (IOException e) {
        e.printStackTrace();
        Errores.registrarLogErrores
                (e,"Error : No se pudo generar QR Code,"
                +"\n ID Transaccion: "+nombreArchivo
                +"\n ID de Usuario (UID): "+usuario
                +"\n IP Ususario: "+ip,
                "Error de escritura en discoon Clase: qrGeneratorBean  ",
                procesos, "IMAGEN QR_CODE");
    } catch (Exception e) {
        e.printStackTrace();    
        Errores.registrarLogErrores
                (e,"Error : No se pudo generar QR Code,"
                +"\n ID Transaccion: "+nombreArchivo
                +"\n ID de Usuario (UID): "+usuario
                +"\n IP Ususario: "+ip,
                "Error Exception al generar imagen QR para la transaccion Clase: qrGeneratorBean  ",
                procesos, "IMAGEN QR_CODE");
    }
    System.out.println("\n\n Codigo QR creado satisfactoriamente.");   
    
}
        

}