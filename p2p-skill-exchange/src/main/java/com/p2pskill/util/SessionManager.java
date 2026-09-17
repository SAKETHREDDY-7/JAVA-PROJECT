package com.p2pskill.util;

import com.p2pskill.model.Student;

/**
 * Singleton that holds the currently logged-in student for the
 * duration of the application session.
 *
 * Why Singleton?
 *  All controllers need access to the logged-in student's ID and profile.
 *  Rather than passing a Student object through every screen transition,
 *  SessionManager provides a single, globally accessible reference.
 *
 * Design Pattern: Singleton
 *
 * Thread Safety: This is a single-user JavaFX desktop app.
 *  The JavaFX Application Thread is the only thread that touches UI and
 *  session data, so synchronization is not required here.
 *
 * Usage:
 *   // After login:
 *   SessionManager.getInstance().setCurrentUser(student);
 *
 *   // In any controller:
 *   Student me = SessionManager.getInstance().getCurrentUser();
 *   int myId   = SessionManager.getInstance().getCurrentUserId();
 *
 *   // On logout:
 *   SessionManager.getInstance().clearSession();
 *
 * Member 2 responsibility (util package).
 */
public class SessionManager {

    private static SessionManager instance;

    // The currently authenticated student
    private Student currentUser;

    private SessionManager() {}

    /** Returns the singleton instance. */
    public static SessionManager getInstance() {
        if (instance == null) {
            instance = new SessionManager();
        }
        return instance;
    }

    // ── Session control ─────────────────────────────────────────────────────

    /**
     * Sets the current logged-in user.
     * Called by AuthenticationService after successful login.
     *
     * @param student the authenticated student
     */
    public void setCurrentUser(Student student) {
        this.currentUser = student;
    }

    /**
     * Returns the currently logged-in student.
     *
     * @return the Student object, or null if no one is logged in
     */
    public Student getCurrentUser() {
        return currentUser;
    }

    /**
     * Returns the student ID of the logged-in student.
     * Convenience method — avoids null-checks in controllers.
     *
     * @return student ID, or -1 if no session is active
     */
    public int getCurrentUserId() {
        return currentUser != null ? currentUser.getStudentId() : -1;
    }

    /**
     * Returns whether a user is currently logged in.
     *
     * @return true if a session is active
     */
    public boolean isLoggedIn() {
        return currentUser != null;
    }

    /**
     * Clears the current session.
     * Called when the user clicks Logout.
     * After this, getCurrentUser() returns null.
     */
    public void clearSession() {
        this.currentUser = null;
    }

    /**
     * Updates the cached current user with fresh data from the database.
     * Called by StudentService.updateProfile() so the dashboard reflects
     * the latest name immediately without requiring re-login.
     *
     * @param updatedStudent the updated student object
     */
    public void refreshCurrentUser(Student updatedStudent) {
        if (currentUser != null
                && updatedStudent != null
                && currentUser.getStudentId() == updatedStudent.getStudentId()) {
            this.currentUser = updatedStudent;
        }
    }
}
