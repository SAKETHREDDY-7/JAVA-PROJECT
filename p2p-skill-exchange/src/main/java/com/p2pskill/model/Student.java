package com.p2pskill.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a registered student in the system.
 *
 * OOP Concepts:
 *  - Encapsulation: all fields private
 *  - Aggregation: contains Lists of Skill objects
 *  - Constructor overloading: multiple constructors for different use cases
 *
 * Note: offeredSkills and wantedSkills are NOT always populated.
 * They are loaded on demand by StudentService when needed
 * (e.g., for profile view, KNN feature building).
 * When loaded from a simple list query, they remain empty.
 *
 * Used throughout the application as the primary user entity.
 * Member 2 responsibility (model package).
 */
public class Student {

    private int           studentId;
    private String        studentNumber;  // e.g. "CS2024001"
    private String        fullName;
    private String        email;
    private String        passwordHash;   // SHA-256 hex, never stored plain
    private String        department;
    private int           yearOfStudy;    // 1–6
    private String        bio;
    private String        profilePhoto;   // optional file path
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Loaded on demand (not always populated from DB query)
    private List<Skill> offeredSkills = new ArrayList<>();
    private List<Skill> wantedSkills  = new ArrayList<>();

    // ── Constructors ────────────────────────────────────────

    /** Default constructor for JavaFX bindings and reflection. */
    public Student() {}

    /**
     * Full constructor — used when loading a complete student record from DB.
     */
    public Student(int studentId, String studentNumber, String fullName,
                   String email, String passwordHash, String department,
                   int yearOfStudy, String bio, String profilePhoto,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.studentId     = studentId;
        this.studentNumber = studentNumber;
        this.fullName      = fullName;
        this.email         = email;
        this.passwordHash  = passwordHash;
        this.department    = department;
        this.yearOfStudy   = yearOfStudy;
        this.bio           = bio;
        this.profilePhoto  = profilePhoto;
        this.createdAt     = createdAt;
        this.updatedAt     = updatedAt;
    }

    /**
     * Registration constructor — used when creating a new student.
     * ID, timestamps are set by the DB.
     */
    public Student(String studentNumber, String fullName, String email,
                   String passwordHash, String department, int yearOfStudy, String bio) {
        this.studentNumber = studentNumber;
        this.fullName      = fullName;
        this.email         = email;
        this.passwordHash  = passwordHash;
        this.department    = department;
        this.yearOfStudy   = yearOfStudy;
        this.bio           = bio;
    }

    /**
     * Lightweight constructor — used in peer list views
     * where only basic display info is needed.
     */
    public Student(int studentId, String fullName, String email,
                   String department, int yearOfStudy) {
        this.studentId   = studentId;
        this.fullName    = fullName;
        this.email       = email;
        this.department  = department;
        this.yearOfStudy = yearOfStudy;
    }

    // ── Getters and Setters ─────────────────────────────────

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public String getStudentNumber() { return studentNumber; }
    public void setStudentNumber(String studentNumber) { this.studentNumber = studentNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public int getYearOfStudy() { return yearOfStudy; }
    public void setYearOfStudy(int yearOfStudy) { this.yearOfStudy = yearOfStudy; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Skill> getOfferedSkills() { return offeredSkills; }
    public void setOfferedSkills(List<Skill> offeredSkills) {
        this.offeredSkills = offeredSkills != null ? offeredSkills : new ArrayList<>();
    }

    public List<Skill> getWantedSkills() { return wantedSkills; }
    public void setWantedSkills(List<Skill> wantedSkills) {
        this.wantedSkills = wantedSkills != null ? wantedSkills : new ArrayList<>();
    }

    // ── Convenience methods ─────────────────────────────────

    /** Returns "Year N" string for UI display. */
    public String getYearDisplay() {
        return yearOfStudy > 0 ? "Year " + yearOfStudy : "N/A";
    }

    /** Returns first name only — useful for "Welcome, Saketh!" labels. */
    public String getFirstName() {
        if (fullName == null || fullName.isBlank()) return "";
        return fullName.split("\\s+")[0];
    }

    // ── Object methods ──────────────────────────────────────

    @Override
    public String toString() {
        return fullName + " (" + studentNumber + ")";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Student)) return false;
        Student other = (Student) o;
        return studentId == other.studentId;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(studentId);
    }
}
