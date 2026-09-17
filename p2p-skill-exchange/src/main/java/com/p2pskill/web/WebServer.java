package com.p2pskill.web;

import com.p2pskill.config.DatabaseConnection;
import com.sun.net.httpserver.HttpServer;

import java.awt.Desktop;
import java.io.File;
import java.io.IOException;
import java.net.*;
import java.util.Enumeration;
import java.util.concurrent.Executors;

/**
 * Main Web Server Application Entry Point.
 *
 * Uses Java's native built-in HttpServer (zero external frameworks).
 * Automatically detects your Wi-Fi/LAN IP address so you can open the project
 * on smartphones, tablets, or other laptops on the same network.
 */
public class WebServer {

    private static final int PORT = 8080;

    public static void main(String[] args) {
        try {
            // Find base web assets directory
            String baseDir = detectWebDir();

            // Initialize database connection
            DatabaseConnection.getInstance().getConnection();

            // Create HTTP Server bound to all network interfaces (0.0.0.0)
            HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

            // Register handlers
            server.createContext("/api", new ApiHandler());
            server.createContext("/", new StaticFileHandler(baseDir));

            // Multi-threaded request handling
            server.setExecutor(Executors.newFixedThreadPool(12));

            // Start server
            server.start();

            String localIp = getLocalNetworkIp();

            System.out.println("==================================================================");
            System.out.println("    🎓 PEER-TO-PEER SKILL EXCHANGE SYSTEM — WEB APPLICATION      ");
            System.out.println("==================================================================");
            System.out.println(" [✓] Java HTTP Web Server is LIVE and RUNNING!");
            System.out.println();
            System.out.println(" 💻 On this Laptop/PC, open in your browser:");
            System.out.println("      http://localhost:" + PORT);
            System.out.println();
            if (localIp != null) {
                System.out.println(" 📱 On your Phone / other devices (connected to same Wi-Fi):");
                System.out.println("      http://" + localIp + ":" + PORT);
                System.out.println();
            }
            System.out.println(" Press Ctrl+C in this terminal window to stop the server.");
            System.out.println("==================================================================");

            // Automatically open browser on PC
            openBrowser("http://localhost:" + PORT);

        } catch (Exception e) {
            System.err.println("Failed to start Web Server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static String detectWebDir() {
        // 1. Direct project directory
        File dir1 = new File("src/main/resources/web");
        if (dir1.exists() && dir1.isDirectory()) return dir1.getAbsolutePath();

        File dir2 = new File("web");
        if (dir2.exists() && dir2.isDirectory()) return dir2.getAbsolutePath();

        File dir3 = new File("p2p-skill-exchange/src/main/resources/web");
        if (dir3.exists() && dir3.isDirectory()) return dir3.getAbsolutePath();

        File dir4 = new File("p2p-skill-exchange/web");
        if (dir4.exists() && dir4.isDirectory()) return dir4.getAbsolutePath();

        return "src/main/resources/web";
    }

    private static String getLocalNetworkIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;

                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String ip = addr.getHostAddress();
                        if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
                            return ip;
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static void openBrowser(String url) {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(url));
            } else {
                // Windows fallback
                Runtime.getRuntime().exec(new String[]{"rundll32", "url.dll,FileProtocolHandler", url});
            }
        } catch (Exception ignored) {}
    }
}
