package com.p2pskill.exception;

/**
 * Thrown when a feedback rating is outside the valid range of 1–5,
 * or when duplicate feedback is attempted for the same match.
 *
 * Business Rules:
 *  - Rating must be an integer between 1 and 5 (inclusive).
 *  - A student can submit only one feedback per match (unique constraint).
 *  - A student cannot review themselves.
 *
 * Member 2 responsibility (exception package).
 */
public class InvalidRatingException extends RuntimeException {

    public InvalidRatingException(String message) {
        super(message);
    }

    public InvalidRatingException(int providedRating) {
        super("Invalid rating: " + providedRating
            + ". Rating must be between 1 and 5.");
    }
}
