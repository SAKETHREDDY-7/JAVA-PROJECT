package com.p2pskill.service;

import com.p2pskill.dao.SkillDAO;
import com.p2pskill.dao.StudentDAO;
import com.p2pskill.model.Student;
import com.p2pskill.util.InputValidator;
import com.p2pskill.util.SessionManager;

import java.util.List;

/**
 * Service class for student profile management.
 */
public class StudentService {

    private final StudentDAO studentDAO;
    private final SkillDAO skillDAO;

    public StudentService() {
        this.studentDAO = new StudentDAO();
        this.skillDAO = new SkillDAO();
    }

    public StudentService(StudentDAO studentDAO, SkillDAO skillDAO) {
        this.studentDAO = studentDAO;
        this.skillDAO = skillDAO;
    }

    public Student getStudentWithSkills(int studentId) {
        Student student = studentDAO.findById(studentId)
            .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + studentId));

        student.setOfferedSkills(skillDAO.findOfferedSkills(studentId));
        student.setWantedSkills(skillDAO.findWantedSkills(studentId));
        return student;
    }

    public Student getCurrentStudentWithSkills() {
        int id = SessionManager.getInstance().getCurrentUserId();
        if (id < 0) {
            throw new IllegalStateException("No student is currently logged in.");
        }
        return getStudentWithSkills(id);
    }

    public void updateProfile(int studentId, String fullName, String department,
                              int yearOfStudy, String bio) {

        String error = InputValidator.firstError(
            InputValidator.validateFullName(fullName),
            InputValidator.validateDepartment(department),
            InputValidator.validateYearOfStudy(yearOfStudy),
            InputValidator.validateBio(bio)
        );
        if (error != null) throw new IllegalArgumentException(error);

        Student student = studentDAO.findById(studentId)
            .orElseThrow(() -> new IllegalArgumentException("Student not found."));

        student.setFullName(fullName.trim());
        student.setDepartment(department.trim());
        student.setYearOfStudy(yearOfStudy);
        student.setBio(bio != null ? bio.trim() : "");

        studentDAO.updateStudent(student);
        SessionManager.getInstance().refreshCurrentUser(student);
    }

    public List<Student> getAllPeers() {
        int myId = SessionManager.getInstance().getCurrentUserId();
        return studentDAO.findAllExcept(myId);
    }

    public int getTotalStudentCount() {
        return studentDAO.countAll();
    }

    public Student getPeerProfile(int peerId) {
        return getStudentWithSkills(peerId);
    }
}
