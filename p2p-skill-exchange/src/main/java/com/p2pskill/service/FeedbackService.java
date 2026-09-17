package com.p2pskill.service;

import com.p2pskill.dao.FeedbackDAO;
import com.p2pskill.dao.MatchDAO;
import com.p2pskill.exception.InvalidRatingException;
import com.p2pskill.exception.InvalidStudentException;
import com.p2pskill.model.Feedback;
import com.p2pskill.model.Match;
import com.p2pskill.util.InputValidator;
import com.p2pskill.util.SessionManager;

import java.util.List;

/**
 * Service class for managing post-exchange feedback and ratings.
 *
 * Handles:
 *  - Submitting a rating and comment for a completed match
 *  - Preventing duplicate feedback for the same match
 *  - Loading feedback for display on profiles and match screens
 *  - Average rating calculation
 */
public class FeedbackService {

    private final FeedbackDAO feedbackDAO;
    private final MatchDAO    matchDAO;

    public FeedbackService() {
        this.feedbackDAO = new FeedbackDAO();
        this.matchDAO    = new MatchDAO();
    }

    public FeedbackService(FeedbackDAO feedbackDAO, MatchDAO matchDAO) {
        this.feedbackDAO = feedbackDAO;
        this.matchDAO    = matchDAO;
    }

    // ── Submit feedback ─────────────────────────────────────────────────────

    /**
     * Submits feedback for a completed match.
     *
     * Validation:
     *  1. Rating must be 1–5.
     *  2. Match must exist and the current user must be a participant.
     *  3. Duplicate feedback for the same match is not allowed.
     *  4. A student cannot review themselves.
     *
     * @param matchId the match being reviewed
     * @param rating  1–5 star rating
     * @param comment optional comment
     * @return the saved Feedback object
     * @throws InvalidRatingException  if rating is out of range
     * @throws InvalidStudentException if match invalid or duplicate feedback
     */
    public Feedback submitFeedback(int matchId, int reviewerId, int rating, String comment) {
        String ratingError = InputValidator.validateRating(rating);
        if (ratingError != null) {
            throw new InvalidRatingException(rating);
        }

        Match match = matchDAO.findById(matchId)
            .orElseThrow(() -> new InvalidStudentException("Match not found."));

        if (match.getStudentId1() != reviewerId && match.getStudentId2() != reviewerId) {
            throw new InvalidStudentException("You are not a participant in this match.");
        }

        int reviewedId = match.getPeerId(reviewerId);
        if (reviewedId == reviewerId) {
            throw new InvalidStudentException("You cannot review yourself.");
        }

        if (feedbackDAO.feedbackExists(matchId, reviewerId)) {
            throw new InvalidStudentException("You have already submitted feedback for this match.");
        }

        Feedback feedback = new Feedback(
            matchId,
            reviewerId,
            reviewedId,
            rating,
            (comment != null && !comment.isBlank()) ? comment.trim() : null
        );
        feedbackDAO.insertFeedback(feedback);
        return feedback;
    }

    public Feedback submitFeedback(int matchId, int rating, String comment) {
        int reviewerId = SessionManager.getInstance().getCurrentUserId();
        return submitFeedback(matchId, reviewerId, rating, comment);
    }

    // ── Read feedback ───────────────────────────────────────────────────────

    /**
     * Returns all feedback written by the current user.
     */
    public List<Feedback> getMyWrittenFeedback() {
        int myId = SessionManager.getInstance().getCurrentUserId();
        return feedbackDAO.findByReviewer(myId);
    }

    /**
     * Returns all feedback received by the current user.
     */
    public List<Feedback> getMyReceivedFeedback() {
        int myId = SessionManager.getInstance().getCurrentUserId();
        return feedbackDAO.findByReviewed(myId);
    }

    /**
     * Returns all feedback for a specific match.
     * Used in the My Matches screen to show both reviews side-by-side.
     *
     * @param matchId the match ID
     * @return list of feedback (0, 1, or 2 entries)
     */
    public List<Feedback> getFeedbackForMatch(int matchId) {
        return feedbackDAO.findByMatch(matchId);
    }

    /**
     * Returns the average star rating for a student.
     * Used on the Peer Profile screen.
     *
     * @param studentId the student being evaluated
     * @return average rating 0.0–5.0
     */
    public double getAverageRating(int studentId) {
        return feedbackDAO.getAverageRating(studentId);
    }

    public List<Feedback> getFeedbackForStudent(int studentId) {
        return feedbackDAO.findByReviewed(studentId);
    }

    /**
     * Returns whether a specific reviewer has submitted feedback for a match.
     */
    public boolean hasSubmittedFeedback(int matchId, int reviewerId) {
        return feedbackDAO.feedbackExists(matchId, reviewerId);
    }

    /**
     * Returns whether the current user has already submitted feedback
     * for a given match. Used to show/hide the "Leave Feedback" button.
     *
     * @param matchId the match to check
     * @return true if feedback already submitted
     */
    public boolean hasSubmittedFeedback(int matchId) {
        int myId = SessionManager.getInstance().getCurrentUserId();
        return feedbackDAO.feedbackExists(matchId, myId);
    }
}
