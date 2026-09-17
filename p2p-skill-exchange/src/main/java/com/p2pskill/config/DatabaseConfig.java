package com.p2pskill.config;

/**
 * Central configuration class for all database credentials and settings.
 *
 * HOW TO CONFIGURE FOR YOUR LOCAL MACHINE:
 * ─────────────────────────────────────────
 * 1. Open this file.
 * 2. Change DB_USERNAME to your MySQL username (default: "root").
 * 3. Change DB_PASSWORD to your MySQL root password.
 * 4. Ensure MySQL is running on port 3306.
 * 5. Run sql/schema.sql then sql/sample_data.sql before launching the app.
 *
 * NEVER commit your real password to GitHub.
 * Add this file to .gitignore if needed, or use environment variables.
 *
 * Member 4 responsibility (config package).
 */
public final class DatabaseConfig {

    // ── Connection settings ─────────────────────────────────
    public static final String DB_HOST     = "localhost";
    public static final int    DB_PORT     = 3306;
    public static final String DB_NAME     = "p2p_skill_exchange";
    public static final String DB_USERNAME = "root";          // ← CHANGE THIS
    public static final String DB_PASSWORD = "yourpassword";  // ← CHANGE THIS

    /**
     * Full JDBC URL assembled from individual settings.
     * useSSL=false is suitable for local college development.
     * serverTimezone ensures LocalDateTime mapping works correctly.
     */
    public static final String DB_URL =
        "jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME
        + "?useSSL=false"
        + "&serverTimezone=Asia/Kolkata"
        + "&allowPublicKeyRetrieval=true"
        + "&characterEncoding=UTF-8";

    // ── KNN algorithm settings ──────────────────────────────
    /** Default number of nearest neighbours for KNN recommendation. */
    public static final int KNN_K = 5;

    /**
     * Weight applied to mutual skill overlap score in final match %.
     * (1 - MUTUAL_WEIGHT) is applied to KNN score.
     */
    public static final double MUTUAL_WEIGHT = 0.6;
    public static final double KNN_WEIGHT    = 0.4;  // must equal 1 - MUTUAL_WEIGHT

    // ── Application settings ────────────────────────────────
    public static final String APP_TITLE   = "Peer-to-Peer Skill Exchange System";
    public static final String APP_VERSION = "1.0.0";

    /** Prevent instantiation — this is a constants class. */
    private DatabaseConfig() {
        throw new UnsupportedOperationException("DatabaseConfig is a utility class.");
    }
}
