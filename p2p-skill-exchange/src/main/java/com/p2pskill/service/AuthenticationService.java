package com.p2pskill.service;

import com.p2pskill.dao.StudentDAO;
import com.p2pskill.model.Student;
import com.p2pskill.util.InputValidator;
import com.p2pskill.util.PasswordHasher;
import com.p2pskill.util.SessionManager;

import java.util.Optional;

/**
 * Service class for student registration and login authentication.
 */
public class AuthenticationService {

    private final StudentDAO studentDAO;

    public AuthenticationService() {
        this.studentDAO = new StudentDAO();
    }

    public AuthenticationService(StudentDAO studentDAO) {
        this.studentDAO = studentDAO;
    }

    public Student register(String studentNumber, String fullName, String email,
                            String plainPassword, String department,
                            int yearOfStudy, String bio) {

        // Validate fields
        String error = InputValidator.firstError(
            InputValidator.validateStudentNumber(studentNumber),
            InputValidator.validateFullName(fullName),
            InputValidator.validateEmail(email),
            InputValidator.validatePassword(plainPassword),
            InputValidator.validateDepartment(department),
            InputValidator.validateYearOfStudy(yearOfStudy),
            InputValidator.validateBio(bio)
        );
        if (error != null) {
            throw new IllegalArgumentException(error);
        }

        // Check for duplicate account
        if (studentDAO.emailExists(email.trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with email '" + email + "' already exists.");
        }
        if (studentDAO.studentNumberExists(studentNumber.trim().toUpperCase())) {
            throw new IllegalArgumentException("Student number '" + studentNumber + "' is already registered.");
        }

        // Hash password and insert
        String passwordHash = PasswordHasher.hash(plainPassword);
        Student newStudent = new Student(
            studentNumber.trim().toUpperCase(),
            fullName.trim(),
            email.trim().toLowerCase(),
            passwordHash,
            department.trim(),
            yearOfStudy,
            bio != null ? bio.trim() : ""
        );

        studentDAO.insertStudent(newStudent);
        return newStudent;
    }

    public Student login(String email, String plainPassword) {
        if (email == null || email.isBlank() || plainPassword == null || plainPassword.isBlank()) {
            throw new IllegalArgumentException("Please enter both email and password.");
        }

        Optional<Student> studentOpt = studentDAO.findByEmail(email.trim().toLowerCase());
        if (studentOpt.isEmpty()) {
            throw new IllegalArgumentException("No account found with this email address.");
        }

        Student student = studentOpt.get();
        if (!PasswordHasher.verify(plainPassword, student.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect password. Please try again.");
        }

        SessionManager.getInstance().setCurrentUser(student);
        return student;
    }

    public void logout() {
        SessionManager.getInstance().clearSession();
    }
}
