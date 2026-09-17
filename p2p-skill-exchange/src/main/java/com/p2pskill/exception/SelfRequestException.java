package com.p2pskill.exception;

/**
 * Thrown when a student attempts to send a skill-exchange request
 * to themselves.
 *
 * Business Rule:
 *  sender_id must never equal receiver_id.
 *  Enforced at both Java service layer and DB CHECK constraint.
 *
 * Member 2 responsibility (exception package).
 */
public class SelfRequestException extends RuntimeException {

    public SelfRequestException() {
        super("You cannot send a skill-exchange request to yourself.");
    }

    public SelfRequestException(String message) {
        super(message);
    }
}
