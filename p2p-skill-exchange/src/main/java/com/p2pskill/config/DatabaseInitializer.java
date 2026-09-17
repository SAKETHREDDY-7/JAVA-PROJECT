package com.p2pskill.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Automatically initializes database tables and sample data if they do not yet exist.
 *
 * Ensures the application works out-of-the-box on both:
 *  1. Live local MySQL instances
 *  2. Embedded H2 database (zero-configuration fallback when local MySQL is offline)
 *
 * Member 4 responsibility (config package).
 */
public class DatabaseInitializer {

    public static void initializeIfNeeded(Connection conn, boolean isEmbedded) {
        if (!tablesExist(conn)) {
            System.out.println("[DB-Init] Tables not detected. Automatically initializing schema and sample data...");
            createSchema(conn, isEmbedded);
            populateSampleData(conn);
            System.out.println("[DB-Init] Database initialization complete! System ready.");
        }
    }

    private static boolean tablesExist(Connection conn) {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1 FROM student LIMIT 1")) {
            return true;
        } catch (SQLException e) {
            return false;
        }
    }

    private static void createSchema(Connection conn, boolean isEmbedded) {
        String[] ddl = {
            """
            CREATE TABLE IF NOT EXISTS skill_category (
                category_id   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                category_name VARCHAR(100) NOT NULL UNIQUE,
                description   VARCHAR(255) DEFAULT NULL
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS skill (
                skill_id    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                skill_name  VARCHAR(100) NOT NULL UNIQUE,
                category_id INT NOT NULL,
                CONSTRAINT fk_skill_cat FOREIGN KEY (category_id)
                    REFERENCES skill_category(category_id) ON DELETE RESTRICT ON UPDATE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS student (
                student_id     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                student_number VARCHAR(20) NOT NULL UNIQUE,
                full_name      VARCHAR(150) NOT NULL,
                email          VARCHAR(200) NOT NULL UNIQUE,
                password_hash  VARCHAR(64) NOT NULL,
                department     VARCHAR(100) DEFAULT NULL,
                year_of_study  TINYINT DEFAULT 1,
                bio            TEXT DEFAULT NULL,
                profile_photo  VARCHAR(255) DEFAULT NULL,
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS student_offered_skill (
                student_id INT NOT NULL,
                skill_id   INT NOT NULL,
                added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (student_id, skill_id),
                CONSTRAINT fk_off_stu FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
                CONSTRAINT fk_off_ski FOREIGN KEY (skill_id) REFERENCES skill(skill_id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS student_wanted_skill (
                student_id INT NOT NULL,
                skill_id   INT NOT NULL,
                added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (student_id, skill_id),
                CONSTRAINT fk_wan_stu FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
                CONSTRAINT fk_wan_ski FOREIGN KEY (skill_id) REFERENCES skill(skill_id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS skill_exchange_request (
                request_id   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                sender_id    INT NOT NULL,
                receiver_id  INT NOT NULL,
                message      TEXT DEFAULT NULL,
                status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_req_sender FOREIGN KEY (sender_id) REFERENCES student(student_id) ON DELETE CASCADE,
                CONSTRAINT fk_req_receiver FOREIGN KEY (receiver_id) REFERENCES student(student_id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS `match` (
                match_id     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                request_id   INT NOT NULL UNIQUE,
                student_id_1 INT NOT NULL,
                student_id_2 INT NOT NULL,
                match_score  DECIMAL(5,2) DEFAULT NULL,
                matched_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active    TINYINT DEFAULT 1,
                CONSTRAINT fk_match_stu1 FOREIGN KEY (student_id_1) REFERENCES student(student_id) ON DELETE CASCADE,
                CONSTRAINT fk_match_stu2 FOREIGN KEY (student_id_2) REFERENCES student(student_id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS feedback (
                feedback_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                match_id    INT NOT NULL,
                reviewer_id INT NOT NULL,
                reviewed_id INT NOT NULL,
                rating      TINYINT NOT NULL,
                comment     TEXT DEFAULT NULL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_one_review UNIQUE (match_id, reviewer_id),
                CONSTRAINT fk_fb_match FOREIGN KEY (match_id) REFERENCES `match`(match_id) ON DELETE CASCADE,
                CONSTRAINT fk_fb_reviewer FOREIGN KEY (reviewer_id) REFERENCES student(student_id) ON DELETE CASCADE,
                CONSTRAINT fk_fb_reviewed FOREIGN KEY (reviewed_id) REFERENCES student(student_id) ON DELETE CASCADE
            );
            """
        };

        try (Statement stmt = conn.createStatement()) {
            for (String sql : ddl) {
                stmt.execute(sql);
            }
        } catch (SQLException e) {
            System.err.println("[DB-Init] Error executing DDL: " + e.getMessage());
        }
    }

    private static void populateSampleData(Connection conn) {
        File sampleFile = new File("sql/sample_data.sql");
        if (!sampleFile.exists()) {
            sampleFile = new File("p2p-skill-exchange/sql/sample_data.sql");
        }
        if (!sampleFile.exists()) {
            sampleFile = new File("../sql/sample_data.sql");
        }

        if (sampleFile.exists()) {
            executeSqlScript(conn, sampleFile);
        } else {
            System.err.println("[DB-Init] sample_data.sql file not found; skipping sample population.");
        }
    }

    private static void executeSqlScript(Connection conn, File file) {
        try (BufferedReader reader = new BufferedReader(new FileReader(file));
             Statement stmt = conn.createStatement()) {

            StringBuilder sb = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("/*")) {
                    continue;
                }
                int commentIndex = line.indexOf("--");
                if (commentIndex != -1) {
                    line = line.substring(0, commentIndex).trim();
                }
                if (line.isEmpty()) {
                    continue;
                }

                sb.append(line).append(" ");
                if (line.endsWith(";")) {
                    String statementSql = sb.toString().trim();
                    statementSql = statementSql.substring(0, statementSql.length() - 1); // strip semicolon
                    sb.setLength(0);

                    // Skip MySQL specific directives or select queries
                    if (statementSql.toUpperCase().startsWith("USE ") ||
                        statementSql.toUpperCase().startsWith("SET FOREIGN_KEY_CHECKS") ||
                        statementSql.toUpperCase().startsWith("LOCK TABLES") ||
                        statementSql.toUpperCase().startsWith("UNLOCK TABLES") ||
                        statementSql.toUpperCase().startsWith("SELECT ")) {
                        continue;
                    }

                    // Convert MySQL INTERVAL syntax to portable timestamp
                    statementSql = statementSql.replaceAll("(?i)NOW\\(\\)\\s*-\\s*INTERVAL\\s+\\d+\\s+DAY", "CURRENT_TIMESTAMP");

                    try {
                        stmt.execute(statementSql);
                    } catch (SQLException ex) {
                        System.err.println("[DB-Init] SQL Warning: " + ex.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[DB-Init] Error executing sample_data.sql: " + e.getMessage());
        }
    }
}
