package com.p2pskill.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility class for password hashing using SHA-256.
 *
 * Why SHA-256?
 *  - Available in standard Java (no external library needed)
 *  - Deterministic: same input always produces same 64-char hex output
 *  - One-way: cannot reverse the hash to get the original password
 *  - Suitable for a college-level project
 *
 * Limitation note: A production system would use BCrypt or Argon2
 * (salted adaptive hashing). SHA-256 without salt is used here for
 * simplicity and zero external dependencies.
 *
 * Member 2 responsibility (util package).
 */
public final class PasswordHasher {

    private PasswordHasher() {}

    /**
     * Hashes a plain-text password using SHA-256.
     *
     * @param plainPassword the raw password string entered by the user
     * @return 64-character lowercase hexadecimal SHA-256 hash
     * @throws RuntimeException if SHA-256 algorithm is unexpectedly unavailable
     */
    public static String hash(String plainPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(
                plainPassword.getBytes(StandardCharsets.UTF_8)
            );
            return bytesToHex(hashBytes);

        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed by the Java specification — should never happen
            throw new RuntimeException("SHA-256 algorithm not available.", e);
        }
    }

    /**
     * Verifies a plain-text password against a stored hash.
     *
     * @param plainPassword the password entered at login
     * @param storedHash    the hash stored in the database
     * @return true if the password matches the hash
     */
    public static boolean verify(String plainPassword, String storedHash) {
        if (plainPassword == null || storedHash == null) return false;
        return hash(plainPassword).equalsIgnoreCase(storedHash);
    }

    /** Converts a byte array to a lowercase hexadecimal string. */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
