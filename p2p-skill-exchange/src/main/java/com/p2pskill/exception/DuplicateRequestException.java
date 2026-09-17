package com.p2pskill.exception;

/**
 * Thrown when a student tries to send a skill-exchange request
 * to a peer when a PENDING request between the same pair already exists.
 *
 * Business Rule:
 *  Only one PENDING request is allowed between any two students at a time.
 *  A new request can be sent only after the previous one is ACCEPTED or REJECTED.
 *
 * Member 2 responsibility (exception package).
 */
public class DuplicateRequestException extends RuntimeException {

    public DuplicateRequestException(String message) {
        super(message);
    }

    public DuplicateRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
