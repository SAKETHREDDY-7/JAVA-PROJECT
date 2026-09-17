package com.p2pskill.model;

import java.time.LocalDateTime;

/**
 * Represents a confirmed skill-exchange partnership between two students.
 * A Match is created when a SkillExchangeRequest is ACCEPTED.
 *
 * OOP Concepts:
 *  - Encapsulation
 *  - Association: references the originating request and both student IDs
 *
 * Used in:
 *  - MatchDAO (DB persistence)
 *  - MatchService (business logic)
 *  - MatchesController (UI display)
 *  - FeedbackService (verifying match exists before feedback)
 *
 * Member 2 responsibility (model package).
 */
public class Match {

    private int           matchId;
    private int           requestId;
    private int           studentId1;       // was the sender
    private int           studentId2;       // was the receiver
    private Student       student1;         // populated on join
    private Student       student2;         // populated on join
    private double        matchScore;       // 0.0 – 100.0
    private LocalDateTime matchedAt;
    private boolean       isActive;

    // ── Constructors ────────────────────────────────────────

    public Match() {}

    /**
     * Constructor for creating a match when a request is accepted.
     * matchId is set by DB after insert.
     */
    public Match(int requestId, int studentId1, int studentId2, double matchScore) {
        this.requestId  = requestId;
        this.studentId1 = studentId1;
        this.studentId2 = studentId2;
        this.matchScore = matchScore;
        this.isActive   = true;
    }

    /**
     * Full constructor for loading from DB.
     */
    public Match(int matchId, int requestId, int studentId1, int studentId2,
                 double matchScore, LocalDateTime matchedAt, boolean isActive) {
        this.matchId    = matchId;
        this.requestId  = requestId;
        this.studentId1 = studentId1;
        this.studentId2 = studentId2;
        this.matchScore = matchScore;
        this.matchedAt  = matchedAt;
        this.isActive   = isActive;
    }

    // ── Getters and Setters ─────────────────────────────────

    public int getMatchId() { return matchId; }
    public void setMatchId(int matchId) { this.matchId = matchId; }

    public int getRequestId() { return requestId; }
    public void setRequestId(int requestId) { this.requestId = requestId; }

    public int getStudentId1() { return studentId1; }
    public void setStudentId1(int studentId1) { this.studentId1 = studentId1; }

    public int getStudentId2() { return studentId2; }
    public void setStudentId2(int studentId2) { this.studentId2 = studentId2; }

    public Student getStudent1() { return student1; }
    public void setStudent1(Student student1) {
        this.student1   = student1;
        this.studentId1 = student1 != null ? student1.getStudentId() : 0;
    }

    public Student getStudent2() { return student2; }
    public void setStudent2(Student student2) {
        this.student2   = student2;
        this.studentId2 = student2 != null ? student2.getStudentId() : 0;
    }

    public double getMatchScore() { return matchScore; }
    public void setMatchScore(double matchScore) { this.matchScore = matchScore; }

    public LocalDateTime getMatchedAt() { return matchedAt; }
    public void setMatchedAt(LocalDateTime matchedAt) { this.matchedAt = matchedAt; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    // ── Convenience methods ─────────────────────────────────

    /**
     * Returns the peer Student from the current user's perspective.
     * E.g., if currentUserId == studentId1, peer is student2.
     */
    public Student getPeer(int currentUserId) {
        if (currentUserId == studentId1) return student2;
        if (currentUserId == studentId2) return student1;
        return null;
    }

    /** Returns peer's student ID. */
    public int getPeerId(int currentUserId) {
        return currentUserId == studentId1 ? studentId2 : studentId1;
    }

    /** Returns match score as a formatted string e.g., "92%". */
    public String getMatchScoreDisplay() {
        return String.format("%.0f%%", matchScore);
    }

    // ── Object methods ──────────────────────────────────────

    @Override
    public String toString() {
        return "Match#" + matchId + " [" + studentId1 + "↔" + studentId2
             + "] Score: " + getMatchScoreDisplay();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Match)) return false;
        Match other = (Match) o;
        return matchId == other.matchId;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(matchId);
    }
}
