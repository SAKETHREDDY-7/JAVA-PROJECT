package com.p2pskill.util;

import java.util.regex.Pattern;

/**
 * Central validation utility for all user input across the application.
 *
 * Two levels of validation exist:
 *  1. UI-level: JavaFX controllers call these methods to show red error
 *     labels before even calling a service.
 *  2. Service-level: Services call these as a second guard before
 *     touching the database.
 *
 * All methods return a String error message (non-null, non-empty = invalid),
 * or null/empty string when input is valid.
 * This makes it easy for controllers to display the error directly.
 *
 * Member 2 responsibility (util package).
 */
public final class InputValidator {

    // ── Regex patterns ──────────────────────────────────────────────────────
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final Pattern STUDENT_NUMBER_PATTERN =
        Pattern.compile("^[A-Za-z0-9]{4,20}$");

    private InputValidator() {}

    // ── Generic helpers ─────────────────────────────────────────────────────

    /** Returns true if the string is null or blank. */
    public static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /**
     * Returns an error message if any of the provided field values are blank.
     * Returns null if all are filled.
     *
     * @param fieldNames comma-separated list for the error message
     * @param values     the field values to check
     */
    public static String requireNonBlank(String fieldNames, String... values) {
        for (String v : values) {
            if (isBlank(v)) {
                return fieldNames + " cannot be empty.";
            }
        }
        return null;
    }

    // ── Registration validation ─────────────────────────────────────────────

    /**
     * Validates a student's full name.
     * @return error message, or null if valid
     */
    public static String validateFullName(String name) {
        if (isBlank(name))         return "Full name is required.";
        if (name.trim().length() < 2) return "Full name must be at least 2 characters.";
        if (name.trim().length() > 150) return "Full name is too long (max 150 chars).";
        return null;
    }

    /**
     * Validates a student number (e.g., "CS2024001").
     * @return error message, or null if valid
     */
    public static String validateStudentNumber(String number) {
        if (isBlank(number)) return "Student number is required.";
        if (!STUDENT_NUMBER_PATTERN.matcher(number.trim()).matches()) {
            return "Student number must be 4–20 alphanumeric characters.";
        }
        return null;
    }

    /**
     * Validates an email address format.
     * @return error message, or null if valid
     */
    public static String validateEmail(String email) {
        if (isBlank(email)) return "Email address is required.";
        if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            return "Please enter a valid email address (e.g., name@domain.com).";
        }
        return null;
    }

    /**
     * Validates a password for minimum strength.
     * Requirements: at least 6 characters.
     * (Kept simple intentionally for a college project.)
     * @return error message, or null if valid
     */
    public static String validatePassword(String password) {
        if (isBlank(password)) return "Password is required.";
        if (password.length() < 6) return "Password must be at least 6 characters.";
        if (password.length() > 100) return "Password is too long (max 100 chars).";
        return null;
    }

    /**
     * Validates that confirm password matches the original password.
     * @return error message, or null if they match
     */
    public static String validatePasswordConfirm(String password,
                                                  String confirmPassword) {
        if (isBlank(confirmPassword)) return "Please confirm your password.";
        if (!password.equals(confirmPassword)) return "Passwords do not match.";
        return null;
    }

    /**
     * Validates year of study (1–6).
     * @return error message, or null if valid
     */
    public static String validateYearOfStudy(int year) {
        if (year < 1 || year > 6) {
            return "Year of study must be between 1 and 6.";
        }
        return null;
    }

    /**
     * Validates department field.
     * @return error message, or null if valid
     */
    public static String validateDepartment(String department) {
        if (isBlank(department)) return "Department is required.";
        if (department.trim().length() > 100) {
            return "Department name is too long (max 100 chars).";
        }
        return null;
    }

    // ── Feedback validation ─────────────────────────────────────────────────

    /**
     * Validates a feedback rating (must be 1–5).
     * @return error message, or null if valid
     */
    public static String validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            return "Rating must be between 1 and 5 stars.";
        }
        return null;
    }

    // ── Request message validation ──────────────────────────────────────────

    /**
     * Validates an optional request message (can be blank, but not too long).
     * @return error message, or null if valid
     */
    public static String validateRequestMessage(String message) {
        if (message != null && message.length() > 500) {
            return "Message is too long (max 500 characters).";
        }
        return null;
    }

    // ── Bio validation ──────────────────────────────────────────────────────

    /**
     * Validates an optional bio field.
     * @return error message, or null if valid
     */
    public static String validateBio(String bio) {
        if (bio != null && bio.length() > 1000) {
            return "Bio is too long (max 1000 characters).";
        }
        return null;
    }

    /**
     * Aggregates multiple validation error strings into one message.
     * Returns null if all are null (no errors).
     * Useful for displaying the first encountered error.
     */
    public static String firstError(String... errors) {
        for (String e : errors) {
            if (e != null && !e.isBlank()) return e;
        }
        return null;
    }
}
