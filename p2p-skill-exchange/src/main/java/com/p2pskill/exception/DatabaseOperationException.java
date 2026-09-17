package com.p2pskill.exception;

/**
 * Thrown when a database operation fails in a DAO class.
 * Wraps the underlying SQLException with a user-friendly message,
 * preventing raw SQL errors from leaking into the UI or service layer.
 *
 * Usage in DAOs:
 *   try {
 *       // JDBC operation
 *   } catch (SQLException e) {
 *       throw new DatabaseOperationException("Failed to save student profile.", e);
 *   }
 *
 * The controllers and services catch this exception and show
 * a generic "Database error" message to the user via AlertHelper.
 *
 * Member 4 responsibility (exception package — used by DAO layer).
 */
public class DatabaseOperationException extends RuntimeException {

    public DatabaseOperationException(String message) {
        super(message);
    }

    public DatabaseOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
