package com.p2pskill.exception;

/**
 * Thrown when a student-related operation fails validation.
 * Examples:
 *  - Email already registered
 *  - Student number already taken
 *  - Student not found by ID
 *
 * Extends RuntimeException so callers don't need to declare it,
 * but meaningful messages are always provided.
 *
 * Member 2 responsibility (exception package).
 */
public class InvalidStudentException extends RuntimeException {

    public InvalidStudentException(String message) {
        super(message);
    }

    public InvalidStudentException(String message, Throwable cause) {
        super(message, cause);
    }
}
