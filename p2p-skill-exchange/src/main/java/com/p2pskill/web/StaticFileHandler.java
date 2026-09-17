package com.p2pskill.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.nio.file.Files;

/**
 * Handles HTTP requests for static frontend files (HTML, CSS, JavaScript).
 * Serves files directly using standard Java I/O.
 */
public class StaticFileHandler implements HttpHandler {

    private final String baseDir;

    public StaticFileHandler(String baseDir) {
        this.baseDir = baseDir;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();

        if (path.equals("/") || path.isBlank()) {
            path = "/index.html";
        }

        if (path.contains("..")) {
            sendResponse(exchange, 403, "Access Denied", "text/plain");
            return;
        }

        // 1. Try local disk path first
        File file = new File(baseDir + path);
        if (file.exists() && file.isFile()) {
            byte[] bytes = Files.readAllBytes(file.toPath());
            String contentType = getContentType(path);
            sendBytes(exchange, 200, bytes, contentType);
            return;
        }

        // 2. Fallback to classpath resource
        try (InputStream in = getClass().getResourceAsStream("/web" + path)) {
            if (in != null) {
                byte[] bytes = in.readAllBytes();
                String contentType = getContentType(path);
                sendBytes(exchange, 200, bytes, contentType);
                return;
            }
        }

        sendResponse(exchange, 404, "404 Not Found: " + path, "text/plain");
    }

    private String getContentType(String path) {
        if (path.endsWith(".html")) return "text/html; charset=UTF-8";
        if (path.endsWith(".css")) return "text/css; charset=UTF-8";
        if (path.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (path.endsWith(".json")) return "application/json; charset=UTF-8";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String message, String contentType) throws IOException {
        byte[] bytes = message.getBytes("UTF-8");
        sendBytes(exchange, statusCode, bytes, contentType);
    }

    private void sendBytes(HttpExchange exchange, int statusCode, byte[] bytes, String contentType) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
