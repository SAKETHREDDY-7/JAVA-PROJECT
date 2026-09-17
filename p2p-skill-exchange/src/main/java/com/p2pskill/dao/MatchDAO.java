package com.p2pskill.dao;

import com.p2pskill.config.DatabaseConnection;
import com.p2pskill.model.Match;
import com.p2pskill.model.Student;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Direct Match DAO class using JDBC PreparedStatement.
 */
public class MatchDAO {

    public int insertMatch(Match match) {
        String sql = "INSERT INTO `match` (request_id, student_id_1, student_id_2, match_score, is_active) VALUES (?, ?, ?, ?, 1)";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, match.getRequestId());
            ps.setInt(2, match.getStudentId1());
            ps.setInt(3, match.getStudentId2());
            ps.setDouble(4, match.getMatchScore());

            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    int id = keys.getInt(1);
                    match.setMatchId(id);
                    return id;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error creating match record: " + e.getMessage(), e);
        }
        return -1;
    }

    public Optional<Match> findById(int matchId) {
        String sql = """
            SELECT m.*,
                   s1.full_name AS s1_name, s1.email AS s1_email, s1.department AS s1_dept, s1.year_of_study AS s1_year,
                   s2.full_name AS s2_name, s2.email AS s2_email, s2.department AS s2_dept, s2.year_of_study AS s2_year
            FROM `match` m
            JOIN student s1 ON s1.student_id = m.student_id_1
            JOIN student s2 ON s2.student_id = m.student_id_2
            WHERE m.match_id = ?
            """;
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matchId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(buildMatchWithStudents(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error finding match by ID: " + e.getMessage());
        }
        return Optional.empty();
    }

    public List<Match> findActiveMatchesByStudent(int studentId) {
        String sql = """
            SELECT m.*,
                   s1.full_name AS s1_name, s1.email AS s1_email, s1.department AS s1_dept, s1.year_of_study AS s1_year,
                   s2.full_name AS s2_name, s2.email AS s2_email, s2.department AS s2_dept, s2.year_of_study AS s2_year
            FROM `match` m
            JOIN student s1 ON s1.student_id = m.student_id_1
            JOIN student s2 ON s2.student_id = m.student_id_2
            WHERE (m.student_id_1 = ? OR m.student_id_2 = ?) AND m.is_active = 1
            ORDER BY m.matched_at DESC
            """;
        List<Match> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            ps.setInt(2, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(buildMatchWithStudents(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error loading active matches: " + e.getMessage());
        }
        return list;
    }

    public int countActiveMatchesByStudent(int studentId) {
        String sql = "SELECT COUNT(*) FROM `match` WHERE (student_id_1 = ? OR student_id_2 = ?) AND is_active = 1";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            ps.setInt(2, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            System.err.println("Error counting active matches: " + e.getMessage());
        }
        return 0;
    }

    private Match buildMatchWithStudents(ResultSet rs) throws SQLException {
        Match m = new Match();
        m.setMatchId(rs.getInt("match_id"));
        m.setRequestId(rs.getInt("request_id"));
        m.setStudentId1(rs.getInt("student_id_1"));
        m.setStudentId2(rs.getInt("student_id_2"));
        m.setMatchScore(rs.getDouble("match_score"));
        m.setActive(rs.getBoolean("is_active"));

        Timestamp ts = rs.getTimestamp("matched_at");
        if (ts != null) m.setMatchedAt(ts.toLocalDateTime());

        Student s1 = new Student();
        s1.setStudentId(rs.getInt("student_id_1"));
        s1.setFullName(rs.getString("s1_name"));
        s1.setEmail(rs.getString("s1_email"));
        s1.setDepartment(rs.getString("s1_dept"));
        s1.setYearOfStudy(rs.getInt("s1_year"));

        Student s2 = new Student();
        s2.setStudentId(rs.getInt("student_id_2"));
        s2.setFullName(rs.getString("s2_name"));
        s2.setEmail(rs.getString("s2_email"));
        s2.setDepartment(rs.getString("s2_dept"));
        s2.setYearOfStudy(rs.getInt("s2_year"));

        m.setStudent1(s1);
        m.setStudent2(s2);
        return m;
    }
}
