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
            rs.close();
            
            System.out.println("--- OFFERED SKILLS FOR STUDENT 1 ---");
            rs = stmt.executeQuery("SELECT s.skill_id, s.skill_name FROM student_offered_skill sos JOIN skill s ON sos.skill_id = s.skill_id WHERE sos.student_id = 1");
            while (rs.next()) {
                System.out.printf("Offered: %d - %s%n", rs.getInt("skill_id"), rs.getString("skill_name"));
            }
            rs.close();

            System.out.println("--- WANTED SKILLS FOR STUDENT 1 ---");
            rs = stmt.executeQuery("SELECT s.skill_id, s.skill_name FROM student_wanted_skill sws JOIN skill s ON sws.skill_id = s.skill_id WHERE sws.student_id = 1");
            while (rs.next()) {
                System.out.printf("Wanted: %d - %s%n", rs.getInt("skill_id"), rs.getString("skill_name"));
            }
            rs.close();
            stmt.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
