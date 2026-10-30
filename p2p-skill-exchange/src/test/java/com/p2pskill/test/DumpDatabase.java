package com.p2pskill.test;

import com.p2pskill.config.DatabaseConnection;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Diagnostic tool to dump and display database tables in clean ASCII table format.
 * Ideal for external viva evaluations and project demonstrations.
 */
public class DumpDatabase {

    public static void main(String[] args) {
        try {
            Connection conn = DatabaseConnection.getInstance().getConnection();
            Statement stmt = conn.createStatement();

            System.out.println("\n" + "=".repeat(85));
            System.out.println("          PEER-TO-PEER SKILL EXCHANGE SYSTEM — DATABASE TABLE VIEWER");
            System.out.println("=".repeat(85));

            // 1. STUDENTS TABLE
            System.out.println("\n[TABLE 1: STUDENT (Registered Users)]");
            String studentSql = "SELECT student_id, student_number, full_name, email, department, year_of_study FROM student ORDER BY student_id";
            ResultSet rs = stmt.executeQuery(studentSql);

            String studentBorder = "+-----+------------+----------------------+-----------------------+---------+------+";
            System.out.println(studentBorder);
            System.out.printf("| %-3s | %-10s | %-20s | %-21s | %-7s | %-4s |%n", "ID", "Reg No", "Full Name", "Email", "Dept", "Year");
            System.out.println(studentBorder);

            while (rs.next()) {
                System.out.printf("| %-3d | %-10s | %-20s | %-21s | %-7s | %-4d |%n",
                        rs.getInt("student_id"),
                        rs.getString("student_number"),
                        truncate(rs.getString("full_name"), 20),
                        truncate(rs.getString("email"), 21),
                        rs.getString("department"),
                        rs.getInt("year_of_study"));
            }
            System.out.println(studentBorder);
            rs.close();

            // 2. SKILLS OFFERED TABLE
            System.out.println("\n[TABLE 2: STUDENT_OFFERED_SKILL (Skills Taught)]");
            String skillSql = "SELECT s.student_id, st.full_name, sk.skill_name, sc.category_name " +
                              "FROM student_offered_skill s " +
                              "JOIN student st ON s.student_id = st.student_id " +
                              "JOIN skill sk ON s.skill_id = sk.skill_id " +
                              "JOIN skill_category sc ON sk.category_id = sc.category_id " +
                              "ORDER BY s.student_id, sk.skill_name";
            rs = stmt.executeQuery(skillSql);

            String skillBorder = "+-----+----------------------+----------------------+----------------------+";
            System.out.println(skillBorder);
            System.out.printf("| %-3s | %-20s | %-20s | %-20s |%n", "ID", "Student Name", "Skill Offered", "Category");
            System.out.println(skillBorder);

            while (rs.next()) {
                System.out.printf("| %-3d | %-20s | %-20s | %-20s |%n",
                        rs.getInt("student_id"),
                        truncate(rs.getString("full_name"), 20),
                        truncate(rs.getString("skill_name"), 20),
                        truncate(rs.getString("category_name"), 20));
            }
            System.out.println(skillBorder);
            rs.close();

            // 3. TABLE SUMMARY & RECORD COUNTS
            System.out.println("\n[DATABASE SCHEMA SUMMARY & TOTAL RECORD COUNTS]");
            String summaryBorder = "+-------------------------------------+------------+";
            System.out.println(summaryBorder);
            System.out.printf("| %-35s | %-10s |%n", "Database Table Name", "Row Count");
            System.out.println(summaryBorder);

            String[] tables = {
                "student",
                "skill_category",
                "skill",
                "student_offered_skill",
                "student_wanted_skill",
                "skill_exchange_request",
                "`match`",
                "feedback"
            };

            for (String tbl : tables) {
                rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tbl);
                if (rs.next()) {
                    String cleanName = tbl.replace("`", "");
                    System.out.printf("| %-35s | %-10d |%n", cleanName, rs.getInt(1));
                }
                rs.close();
            }
            System.out.println(summaryBorder);

            stmt.close();
            conn.close();
            System.out.println("\n[OK] All tables queried successfully.\n");
            System.exit(0);

        } catch (Exception e) {
            System.err.println("Database query error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static String truncate(String val, int maxLen) {
        if (val == null) return "";
        return val.length() <= maxLen ? val : val.substring(0, maxLen - 1) + "…";
    }
}
