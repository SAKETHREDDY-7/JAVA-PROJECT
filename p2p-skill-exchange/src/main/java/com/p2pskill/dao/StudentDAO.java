package com.p2pskill.dao;

import com.p2pskill.config.DatabaseConnection;
import com.p2pskill.model.Student;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Direct Student DAO class using JDBC PreparedStatement.
 * Standard implementation for college mini project (no interfaces).
 */
public class StudentDAO {

    public Optional<Student> findByEmail(String email) {
        String sql = "SELECT * FROM student WHERE email = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToStudent(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error finding student by email: " + e.getMessage());
        }
        return Optional.empty();
    }

    public Optional<Student> findById(int studentId) {
        String sql = "SELECT * FROM student WHERE student_id = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToStudent(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error finding student by ID: " + e.getMessage());
        }
        return Optional.empty();
    }

    public int insertStudent(Student student) {
        String sql = "INSERT INTO student (student_number, full_name, email, password_hash, department, year_of_study, bio) "
                   + "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, student.getStudentNumber());
            ps.setString(2, student.getFullName());
            ps.setString(3, student.getEmail());
            ps.setString(4, student.getPasswordHash());
            ps.setString(5, student.getDepartment());
            ps.setInt(6, student.getYearOfStudy());
            ps.setString(7, student.getBio());

            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    int id = keys.getInt(1);
                    student.setStudentId(id);
                    return id;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error registering student: " + e.getMessage(), e);
        }
        return -1;
    }

    public void updateStudent(Student student) {
        String sql = "UPDATE student SET full_name = ?, department = ?, year_of_study = ?, bio = ? WHERE student_id = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, student.getFullName());
            ps.setString(2, student.getDepartment());
            ps.setInt(3, student.getYearOfStudy());
            ps.setString(4, student.getBio());
            ps.setInt(5, student.getStudentId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Database error updating profile: " + e.getMessage(), e);
        }
    }

    public boolean emailExists(String email) {
        String sql = "SELECT COUNT(*) FROM student WHERE email = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error checking email: " + e.getMessage());
        }
        return false;
    }

    public boolean studentNumberExists(String studentNumber) {
        String sql = "SELECT COUNT(*) FROM student WHERE student_number = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, studentNumber);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error checking student number: " + e.getMessage());
        }
        return false;
    }

    public List<Student> findAllExcept(int studentId) {
        String sql = "SELECT * FROM student WHERE student_id != ? ORDER BY full_name ASC";
        List<Student> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToStudent(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching peer students: " + e.getMessage());
        }
        return list;
    }

    public int countAll() {
        String sql = "SELECT COUNT(*) FROM student";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            System.err.println("Error counting students: " + e.getMessage());
        }
        return 0;
    }

    private Student mapResultSetToStudent(ResultSet rs) throws SQLException {
        Student s = new Student();
        s.setStudentId(rs.getInt("student_id"));
        s.setStudentNumber(rs.getString("student_number"));
        s.setFullName(rs.getString("full_name"));
        s.setEmail(rs.getString("email"));
        s.setPasswordHash(rs.getString("password_hash"));
        s.setDepartment(rs.getString("department"));
        s.setYearOfStudy(rs.getInt("year_of_study"));
        s.setBio(rs.getString("bio"));
        return s;
    }
}
