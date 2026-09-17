package com.p2pskill.dao;

import com.p2pskill.config.DatabaseConnection;
import com.p2pskill.model.Skill;
import com.p2pskill.model.SkillCategory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Direct Skill DAO class using JDBC PreparedStatement.
 * Standard implementation for college mini project (no interfaces).
 */
public class SkillDAO {

    public List<SkillCategory> findAllCategories() {
        String sql = "SELECT * FROM skill_category ORDER BY category_name ASC";
        List<SkillCategory> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(new SkillCategory(
                    rs.getInt("category_id"),
                    rs.getString("category_name"),
                    rs.getString("description")
                ));
            }
        } catch (SQLException e) {
            System.err.println("Error fetching skill categories: " + e.getMessage());
        }
        return list;
    }

    public List<Skill> findByCategory(int categoryId) {
        String sql = "SELECT s.*, c.category_name, c.description AS cat_desc "
                   + "FROM skill s JOIN skill_category c ON s.category_id = c.category_id "
                   + "WHERE s.category_id = ? ORDER BY s.skill_name ASC";
        List<Skill> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, categoryId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToSkill(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching skills by category: " + e.getMessage());
        }
        return list;
    }

    public List<Skill> findAllSkills() {
        String sql = "SELECT s.*, c.category_name, c.description AS cat_desc "
                   + "FROM skill s JOIN skill_category c ON s.category_id = c.category_id "
                   + "ORDER BY s.skill_name ASC";
        List<Skill> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapResultSetToSkill(rs));
            }
        } catch (SQLException e) {
            System.err.println("Error fetching all skills: " + e.getMessage());
        }
        return list;
    }

    public List<Skill> findOfferedSkills(int studentId) {
        String sql = "SELECT s.*, c.category_name, c.description AS cat_desc "
                   + "FROM student_offered_skill ss "
                   + "JOIN skill s ON ss.skill_id = s.skill_id "
                   + "JOIN skill_category c ON s.category_id = c.category_id "
                   + "WHERE ss.student_id = ? "
                   + "ORDER BY s.skill_name ASC";
        return fetchSkills(sql, studentId);
    }

    public List<Skill> findWantedSkills(int studentId) {
        String sql = "SELECT s.*, c.category_name, c.description AS cat_desc "
                   + "FROM student_wanted_skill ss "
                   + "JOIN skill s ON ss.skill_id = s.skill_id "
                   + "JOIN skill_category c ON s.category_id = c.category_id "
                   + "WHERE ss.student_id = ? "
                   + "ORDER BY s.skill_name ASC";
        return fetchSkills(sql, studentId);
    }

    private List<Skill> fetchSkills(String sql, int studentId) {
        List<Skill> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToSkill(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching skills: " + e.getMessage());
        }
        return list;
    }

    public List<Integer> findOfferedSkillIds(int studentId) {
        String sql = "SELECT skill_id FROM student_offered_skill WHERE student_id = ?";
        return fetchSkillIds(sql, studentId);
    }

    public List<Integer> findWantedSkillIds(int studentId) {
        String sql = "SELECT skill_id FROM student_wanted_skill WHERE student_id = ?";
        return fetchSkillIds(sql, studentId);
    }

    private List<Integer> fetchSkillIds(String sql, int studentId) {
        List<Integer> list = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(rs.getInt("skill_id"));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching skill IDs: " + e.getMessage());
        }
        return list;
    }

    public void addOfferedSkill(int studentId, int skillId) {
        executeSkillUpdate("INSERT INTO student_offered_skill (student_id, skill_id) VALUES (?, ?)", studentId, skillId);
    }

    public void removeOfferedSkill(int studentId, int skillId) {
        executeSkillUpdate("DELETE FROM student_offered_skill WHERE student_id = ? AND skill_id = ?", studentId, skillId);
    }

    public void addWantedSkill(int studentId, int skillId) {
        executeSkillUpdate("INSERT INTO student_wanted_skill (student_id, skill_id) VALUES (?, ?)", studentId, skillId);
    }

    public void removeWantedSkill(int studentId, int skillId) {
        executeSkillUpdate("DELETE FROM student_wanted_skill WHERE student_id = ? AND skill_id = ?", studentId, skillId);
    }

    private void executeSkillUpdate(String sql, int studentId, int skillId) {
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            ps.setInt(2, skillId);
            ps.executeUpdate();
        } catch (SQLException e) {
            // Ignore duplicate key error gracefully
            String msg = e.getMessage().toLowerCase();
            if (!msg.contains("duplicate") && !msg.contains("unique") && !msg.contains("primary")) {
                throw new RuntimeException("Database error updating skill: " + e.getMessage(), e);
            }
        }
    }

    public int countAllSkills() {
        String sql = "SELECT COUNT(*) FROM skill";
        try (Connection conn = DatabaseConnection.getInstance().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            System.err.println("Error counting skills: " + e.getMessage());
        }
        return 0;
    }

    private Skill mapResultSetToSkill(ResultSet rs) throws SQLException {
        SkillCategory cat = new SkillCategory(
            rs.getInt("category_id"),
            rs.getString("category_name"),
            rs.getString("cat_desc")
        );
        return new Skill(
            rs.getInt("skill_id"),
            rs.getString("skill_name"),
            cat
        );
    }
}
