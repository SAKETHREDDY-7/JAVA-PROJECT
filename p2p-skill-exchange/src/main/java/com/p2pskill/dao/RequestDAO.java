package com.p2pskill.dao;

import com.p2pskill.config.DatabaseConnection;
import com.p2pskill.model.RequestStatus;
import com.p2pskill.model.SkillExchangeRequest;
import com.p2pskill.model.Student;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Direct Request DAO class using JDBC PreparedStatement.
 * Standard implementation for college mini project (no interfaces).
 */
public class RequestDAO {

    public int insertRequest(SkillExchangeRequest request) {
        String sql = "INSERT INTO skill_exchange_request (sender_id, receiver_id, message, status) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, request.getSenderId());
            ps.setInt(2, request.getReceiverId());
            ps.setString(3, request.getMessage());
            ps.setString(4, request.getStatus().name());

            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    int id = keys.getInt(1);
                    request.setRequestId(id);
                    return id;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Database error creating exchange request: " + e.getMessage(), e);
        }
        return -1;
    }

    public Optional<SkillExchangeRequest> findById(int requestId) {
        String sql = "SELECT r.*, s.full_name AS sender_name, s.department AS sender_dept, "
                   + "rec.full_name AS receiver_name, rec.department AS receiver_dept "
                   + "FROM skill_exchange_request r "
                   + "JOIN student s ON r.sender_id = s.student_id "
                   + "JOIN student rec ON r.receiver_id = rec.student_id "
                   + "WHERE r.request_id = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, requestId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToRequest(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error finding request by ID: " + e.getMessage());
        }
        return Optional.empty();
    }

    public List<SkillExchangeRequest> findByReceiver(int receiverId) {
        String sql = "SELECT r.*, s.full_name AS sender_name, s.department AS sender_dept, "
                   + "rec.full_name AS receiver_name, rec.department AS receiver_dept "
                   + "FROM skill_exchange_request r "
                   + "JOIN student s ON r.sender_id = s.student_id "
                   + "JOIN student rec ON r.receiver_id = rec.student_id "
                   + "WHERE r.receiver_id = ? ORDER BY r.created_at DESC";
        return queryRequestList(sql, receiverId);
    }

    public List<SkillExchangeRequest> findBySender(int senderId) {
        String sql = "SELECT r.*, s.full_name AS sender_name, s.department AS sender_dept, "
                   + "rec.full_name AS receiver_name, rec.department AS receiver_dept "
                   + "FROM skill_exchange_request r "
                   + "JOIN student s ON r.sender_id = s.student_id "
                   + "JOIN student rec ON r.receiver_id = rec.student_id "
                   + "WHERE r.sender_id = ? ORDER BY r.created_at DESC";
        return queryRequestList(sql, senderId);
    }

    private List<SkillExchangeRequest> queryRequestList(String sql, int paramId) {
        List<SkillExchangeRequest> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, paramId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToRequest(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error querying requests: " + e.getMessage());
        }
        return list;
    }

    public void updateStatus(int requestId, RequestStatus status) {
        String sql = "UPDATE skill_exchange_request SET status = ? WHERE request_id = ?";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status.name());
            ps.setInt(2, requestId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Database error updating request status: " + e.getMessage(), e);
        }
    }

    public boolean pendingRequestExists(int senderId, int receiverId) {
        String sql = "SELECT COUNT(*) FROM skill_exchange_request WHERE sender_id = ? AND receiver_id = ? AND status = 'PENDING'";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, senderId);
            ps.setInt(2, receiverId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error checking pending request: " + e.getMessage());
        }
        return false;
    }

    public int countPendingByReceiver(int receiverId) {
        String sql = "SELECT COUNT(*) FROM skill_exchange_request WHERE receiver_id = ? AND status = 'PENDING'";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, receiverId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            System.err.println("Error counting pending requests: " + e.getMessage());
        }
        return 0;
    }

    public boolean hasActiveOrPendingRequest(int studentA, int studentB) {
        String sql = "SELECT COUNT(*) FROM skill_exchange_request "
                   + "WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) "
                   + "AND status IN ('PENDING', 'ACCEPTED')";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentA);
            ps.setInt(2, studentB);
            ps.setInt(3, studentB);
            ps.setInt(4, studentA);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error checking existing request: " + e.getMessage());
        }
        return false;
    }

    private SkillExchangeRequest mapResultSetToRequest(ResultSet rs) throws SQLException {
        SkillExchangeRequest req = new SkillExchangeRequest();
        req.setRequestId(rs.getInt("request_id"));
        req.setSenderId(rs.getInt("sender_id"));
        req.setReceiverId(rs.getInt("receiver_id"));
        req.setMessage(rs.getString("message"));
        req.setStatus(RequestStatus.valueOf(rs.getString("status")));

        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) req.setCreatedAt(ts.toLocalDateTime());

        Student sender = new Student();
        sender.setStudentId(rs.getInt("sender_id"));
        try { sender.setFullName(rs.getString("sender_name")); } catch (Exception ignored) {}
        try { sender.setDepartment(rs.getString("sender_dept")); } catch (Exception ignored) {}
        req.setSender(sender);

        Student receiver = new Student();
        receiver.setStudentId(rs.getInt("receiver_id"));
        try { receiver.setFullName(rs.getString("receiver_name")); } catch (Exception ignored) {}
        try { receiver.setDepartment(rs.getString("receiver_dept")); } catch (Exception ignored) {}
        req.setReceiver(receiver);

        return req;
    }
}
