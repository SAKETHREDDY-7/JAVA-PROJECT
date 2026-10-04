package com.p2pskill.test;

import com.p2pskill.config.DatabaseConnection;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class DumpDatabase {
    public static void main(String[] args) {
        try {
            Connection conn = DatabaseConnection.getInstance().getConnection();
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT student_id, student_number, full_name, email, department, year_of_study FROM student");
            System.out.println("--- STUDENTS IN DATABASE ---");
            while (rs.next()) {
                System.out.printf("ID=%d, Num=%s, Name=%s, Email=%s, Dept=%s, Year=%d%n",
                        rs.getInt("student_id"),
                        rs.getString("student_number"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("department"),
                        rs.getInt("year_of_study"));
            }
            System.out.println("--- TABLE COUNTS ---");
            String[] tables = {"student", "skill_category", "skill", "student_offered_skill", "student_wanted_skill", "skill_exchange_request", "`match`", "feedback"};
            for (String tbl : tables) {
                rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tbl);
                if (rs.next()) {
                    System.out.printf("%s: %d rows%n", tbl, rs.getInt(1));
                }
                rs.close();
            }
            stmt.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
