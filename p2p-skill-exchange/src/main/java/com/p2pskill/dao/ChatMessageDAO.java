package com.p2pskill.dao;

import com.p2pskill.config.DatabaseConnection;
import com.p2pskill.model.ChatMessage;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for ChatMessage entities.
 * Handles database persistence and queries using JDBC PreparedStatement.
 */
public class ChatMessageDAO {

    /**
     * Checks if a given student is an authorized participant in the match.
     */
    public boolean isUserInMatch(int matchId, int studentId) {
        String sql = "SELECT 1 FROM `match` WHERE match_id = ? AND (student_id_1 = ? OR student_id_2 = ?)";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matchId);
            ps.setInt(2, studentId);
            ps.setInt(3, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            System.err.println("Error verifying match participant: " + e.getMessage());
            return false;
        }
    }

    /**
     * Inserts a new chat message into the database.
     */
    public ChatMessage insertMessage(int matchId, int senderId, String content) {
        String sql = "INSERT INTO chat_message (match_id, sender_id, content, sent_at, is_read) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0)";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, matchId);
            ps.setInt(2, senderId);
            ps.setString(3, content);

            int affected = ps.executeUpdate();
            if (affected == 0) {
                throw new RuntimeException("Creating chat message failed, no rows affected.");
            }

            int generatedId = -1;
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    generatedId = keys.getInt(1);
                }
            }

            // Fetch sender name for display
            String senderName = getSenderName(conn, senderId);
            return new ChatMessage(generatedId, matchId, senderId, senderName, content, LocalDateTime.now(), false);

        } catch (SQLException e) {
            throw new RuntimeException("Database error saving chat message: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieves all chat messages for a specific match, ordered chronologically.
     */
    public List<ChatMessage> getMessagesByMatch(int matchId) {
        String sql = """
            SELECT cm.message_id, cm.match_id, cm.sender_id, cm.content, cm.sent_at, cm.is_read,
                   s.full_name AS sender_name
            FROM chat_message cm
            JOIN student s ON s.student_id = cm.sender_id
            WHERE cm.match_id = ?
            ORDER BY cm.sent_at ASC, cm.message_id ASC
            """;
        List<ChatMessage> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, matchId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int messageId = rs.getInt("message_id");
                    int senderId = rs.getInt("sender_id");
                    String senderName = rs.getString("sender_name");
                    String content = rs.getString("content");
                    Timestamp ts = rs.getTimestamp("sent_at");
                    LocalDateTime sentAt = (ts != null) ? ts.toLocalDateTime() : LocalDateTime.now();
                    boolean isRead = rs.getBoolean("is_read");

                    list.add(new ChatMessage(messageId, matchId, senderId, senderName, content, sentAt, isRead));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching chat messages: " + e.getMessage());
        }
        return list;
    }

    private String getSenderName(Connection conn, int studentId) {
        String sql = "SELECT full_name FROM student WHERE student_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("full_name");
                }
            }
        } catch (SQLException ignored) {}
        return "Student #" + studentId;
    }
}
