package com.p2pskill.dao;

import com.p2pskill.config.DatabaseConnection;
import com.p2pskill.model.Feedback;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Direct Feedback DAO class using JDBC PreparedStatement.
 * Standard implementation for college mini project (no interfaces).
 */
public class FeedbackDAO {

    public int insertFeedback(Feedback feedback) {
        String sql = "INSERT INTO feedback (match_id, reviewer_id, reviewed_id, rating, comment) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, feedback.getMatchId());
            ps.setInt(2, feedback.getReviewerId());
            ps.setInt(3, feedback.getReviewedId());
            ps.setInt(4, feedback.getRating());
            ps.setString(5, feedback.getComment());

            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    int id = keys.getInt(1);
                    feedback.setFeedbackId(id);
                    return id;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error saving feedback: " + e.getMessage(), e);
        }
        return -1;
    }

    public List<Feedback> findByMatch(int matchId) {
        String sql = "SELECT f.*, r.full_name AS reviewer_name FROM feedback f "
                   + "JOIN student r ON f.reviewer_id = r.student_id "
                   + "WHERE f.match_id = ? ORDER BY f.created_at ASC";
        List<Feedback> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matchId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToFeedback(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error finding feedback by match: " + e.getMessage());
        }
        return list;
    }

    public Optional<Feedback> findByMatchId(int matchId) {
        List<Feedback> list = findByMatch(matchId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Feedback> findByReviewer(int reviewerId) {
        String sql = "SELECT f.*, r.full_name AS reviewer_name FROM feedback f "
                   + "JOIN student r ON f.reviewer_id = r.student_id "
                   + "WHERE f.reviewer_id = ? ORDER BY f.created_at DESC";
        List<Feedback> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reviewerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToFeedback(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching reviews by reviewer: " + e.getMessage());
        }
        return list;
    }

    public List<Feedback> findByReviewed(int reviewedId) {
        String sql = "SELECT f.*, r.full_name AS reviewer_name FROM feedback f "
                   + "JOIN student r ON f.reviewer_id = r.student_id "
                   + "WHERE f.reviewed_id = ? ORDER BY f.created_at DESC";
        List<Feedback> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reviewedId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToFeedback(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching reviews for student: " + e.getMessage());
        }
        return list;
    }

    public List<Feedback> findByStudent(int studentId) {
        return findByReviewed(studentId);
    }

    public double getAverageRating(int studentId) {
        String sql = "SELECT AVG(rating) FROM feedback WHERE reviewed_id = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getDouble(1);
                }
            }
        } catch (SQLException e) {
            System.err.println("Error calculating average rating: " + e.getMessage());
        }
        return 0.0;
    }

    public boolean feedbackExists(int matchId, int reviewerId) {
        String sql = "SELECT COUNT(*) FROM feedback WHERE match_id = ? AND reviewer_id = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matchId);
            ps.setInt(2, reviewerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error checking if feedback exists: " + e.getMessage());
        }
        return false;
    }

    public boolean hasFeedbackForMatch(int matchId) {
        String sql = "SELECT COUNT(*) FROM feedback WHERE match_id = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matchId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error checking match feedback: " + e.getMessage());
        }
        return false;
    }

    private Feedback mapResultSetToFeedback(ResultSet rs) throws SQLException {
        Feedback fb = new Feedback();
        fb.setFeedbackId(rs.getInt("feedback_id"));
        fb.setMatchId(rs.getInt("match_id"));
        fb.setReviewerId(rs.getInt("reviewer_id"));
        fb.setReviewedId(rs.getInt("reviewed_id"));
        fb.setRating(rs.getInt("rating"));
        fb.setComment(rs.getString("comment"));

        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) fb.setCreatedAt(ts.toLocalDateTime());

        fb.setReviewerName(rs.getString("reviewer_name"));
        return fb;
    }
}
