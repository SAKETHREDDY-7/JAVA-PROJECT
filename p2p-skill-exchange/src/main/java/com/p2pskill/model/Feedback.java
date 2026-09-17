package com.p2pskill.model;

import java.time.LocalDateTime;

/**
 * Represents post-exchange feedback left by one student about another,
 * associated with a specific Match.
 *
 * Rules:
 *  - Rating must be 1–5 (enforced in DB CHECK and Java validation).
 *  - Each (match_id, reviewer_id) pair is unique — one review per match per student.
 *  - A student cannot review themselves.
 *
 * OOP Concepts:
 *  - Encapsulation
 *  - Association: references Match, reviewer Student, reviewed Student
 *
 * Member 2 responsibility (model package).
 */
public class Feedback {

    private int           feedbackId;
    private int           matchId;
    private int           reviewerId;
    private int           reviewedId;
    private Student       reviewer;   // populated on join
    private Student       reviewed;  // populated on join
    private String        reviewerName;
    private int           rating;    // 1–5
    private String        comment;
    private LocalDateTime createdAt;

    public String getReviewerName() {
        if (reviewerName != null && !reviewerName.isBlank()) return reviewerName;
        if (reviewer != null) return reviewer.getFullName();
        return "Anonymous Peer";
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    // ── Constructors ────────────────────────────────────────

    public Feedback() {}

    /**
     * Constructor for submitting new feedback.
     * feedbackId and createdAt set by DB.
     */
    public Feedback(int matchId, int reviewerId, int reviewedId,
                    int rating, String comment) {
        this.matchId    = matchId;
        this.reviewerId = reviewerId;
        this.reviewedId = reviewedId;
        this.rating     = rating;
        this.comment    = comment;
    }

    /**
     * Full constructor for loading from DB.
     */
    public Feedback(int feedbackId, int matchId, int reviewerId, int reviewedId,
                    int rating, String comment, LocalDateTime createdAt) {
        this.feedbackId = feedbackId;
        this.matchId    = matchId;
        this.reviewerId = reviewerId;
        this.reviewedId = reviewedId;
        this.rating     = rating;
        this.comment    = comment;
        this.createdAt  = createdAt;
    }

    // ── Getters and Setters ─────────────────────────────────

    public int getFeedbackId() { return feedbackId; }
    public void setFeedbackId(int feedbackId) { this.feedbackId = feedbackId; }

    public int getMatchId() { return matchId; }
    public void setMatchId(int matchId) { this.matchId = matchId; }

    public int getReviewerId() { return reviewerId; }
    public void setReviewerId(int reviewerId) { this.reviewerId = reviewerId; }

    public int getReviewedId() { return reviewedId; }
    public void setReviewedId(int reviewedId) { this.reviewedId = reviewedId; }

    public Student getReviewer() { return reviewer; }
    public void setReviewer(Student reviewer) {
        this.reviewer   = reviewer;
        this.reviewerId = reviewer != null ? reviewer.getStudentId() : 0;
    }

    public Student getReviewed() { return reviewed; }
    public void setReviewed(Student reviewed) {
        this.reviewed   = reviewed;
        this.reviewedId = reviewed != null ? reviewed.getStudentId() : 0;
    }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // ── Convenience methods ─────────────────────────────────

    /**
     * Returns a star string representation for UI display.
     * e.g., rating=4 → "★★★★☆"
     */
    public String getRatingStars() {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append(i <= rating ? "★" : "☆");
        }
        return sb.toString();
    }

    // ── Object methods ──────────────────────────────────────

    @Override
    public String toString() {
        return "Feedback#" + feedbackId + " Match#" + matchId
             + " " + getRatingStars() + " by student#" + reviewerId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Feedback)) return false;
        Feedback other = (Feedback) o;
        return feedbackId == other.feedbackId;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(feedbackId);
    }
}
