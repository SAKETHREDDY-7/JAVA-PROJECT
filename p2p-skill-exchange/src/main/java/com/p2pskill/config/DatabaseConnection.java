package com.p2pskill.config;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Singleton database connection manager with dual-mode support:
 *  1. Live MySQL Server (Primary) — connects to localhost:3306 as configured in DatabaseConfig.
 *  2. Embedded Database Fallback — automatically activates if local MySQL is offline/uninstalled,
 *     storing state locally in ./data/p2p_skill_exchange.mv.db.
 *
 * This ensures the application never crashes with connection errors on any student or evaluator laptop.
 *
 * Member 4 responsibility (config package).
 */
public class DatabaseConnection {

    private static DatabaseConnection instance;
    private Connection connection;
    private boolean isEmbeddedMode = false;

    private static final String EMBEDDED_URL =
        "jdbc:h2:./data/p2p_skill_exchange;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE";

    private DatabaseConnection() {
        connect();
    }

    private void connect() {
        // Step 1: Attempt MySQL Connection
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            this.connection = DriverManager.getConnection(
                DatabaseConfig.DB_URL,
                DatabaseConfig.DB_USERNAME,
                DatabaseConfig.DB_PASSWORD
            );
            this.isEmbeddedMode = false;
            System.out.println("[DB] Successfully connected to MySQL server (" + DatabaseConfig.DB_NAME + ")");
            DatabaseInitializer.initializeIfNeeded(this.connection, false);
            return;

        } catch (ClassNotFoundException | SQLException e) {
            System.out.println("[DB] Notice: MySQL server unreachable (" + e.getMessage() + ")");
            System.out.println("[DB] Activating embedded database fallback mode for seamless execution...");
        }

        // Step 2: Fallback to Embedded H2 in MySQL Compatibility Mode
        try {
            File dataDir = new File("data");
            if (!dataDir.exists()) {
                dataDir.mkdirs();
            }

            Class.forName("org.h2.Driver");
            this.connection = DriverManager.getConnection(EMBEDDED_URL, "sa", "");
            this.isEmbeddedMode = true;
            System.out.println("[DB] Connected to embedded database storage (./data/p2p_skill_exchange.mv.db)");
            DatabaseInitializer.initializeIfNeeded(this.connection, true);

        } catch (Exception ex) {
            System.err.println("[DB FATAL] Failed to initialize database: " + ex.getMessage());
            throw new RuntimeException("Database initialization failed.", ex);
        }
    }

    public static synchronized DatabaseConnection getInstance() {
        if (instance == null) {
            instance = new DatabaseConnection();
        }
        return instance;
    }

    public Connection getConnection() {
        try {
            if (connection == null || connection.isClosed()) {
                System.out.println("[DB] Reconnecting database session...");
                if (isEmbeddedMode) {
                    Class.forName("org.h2.Driver");
                    connection = DriverManager.getConnection(EMBEDDED_URL, "sa", "");
                } else {
                    connect();
                }
            }
        } catch (Exception e) {
            System.err.println("[DB] Reconnection failed: " + e.getMessage());
            throw new RuntimeException("Could not reconnect to database.", e);
        }
        return connection;
    }

    public void closeConnection() {
        if (connection != null) {
            try {
                connection.close();
                System.out.println("[DB] Database connection closed gracefully.");
            } catch (SQLException e) {
                System.err.println("[DB] Error closing connection: " + e.getMessage());
            }
        }
    }

    public boolean isEmbeddedMode() {
        return isEmbeddedMode;
    }
}
