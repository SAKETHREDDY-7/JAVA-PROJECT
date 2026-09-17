package com.p2pskill.test;

import com.p2pskill.algorithm.MatchingAlgorithm;
import com.p2pskill.config.DatabaseConfig;
import com.p2pskill.dao.StudentDAO;
import com.p2pskill.model.PeerMatch;
import com.p2pskill.model.Skill;
import com.p2pskill.model.SkillCategory;
import com.p2pskill.model.Student;
import com.p2pskill.util.InputValidator;
import com.p2pskill.util.PasswordHasher;
import com.p2pskill.util.SessionManager;

import java.util.ArrayList;
import java.util.List;

/**
 * Automated Smoke and Integration Test Suite for College Java Mini Project.
 *
 * Verifies core requirements matching standard 2nd-year B.Tech syllabus:
 *  1. Database connectivity & configuration
 *  2. Password hashing & verification (SHA-256)
 *  3. Input validation logic
 *  4. SessionManager state management
 *  5. Data Structures & Algorithms: Set Intersection Skill Matching
 *  6. Data Structures & Algorithms: Peer Sorting (Collections.sort & Insertion Sort)
 *  7. Data Structures & Algorithms: Peer Ranking (PriorityQueue Max-Heap)
 *  8. OOP Models, Encapsulation, and JDBC Data Access
 */
public class SmokeIntegrationTest {

    private static int testsPassed = 0;
    private static int testsFailed = 0;

    public static void main(String[] args) {
        System.out.println("===============================================================");
        System.out.println("   PEER-TO-PEER SKILL EXCHANGE SYSTEM — INTEGRATION SUITE      ");
        System.out.println("===============================================================");

        testDatabaseConnectivity();
        testPasswordHashing();
        testInputValidation();
        testSessionManager();
        testMutualSkillAlgorithm();
        testPeerSortingAndRanking();
        testStudentDAOAndCatalogue();

        System.out.println("\n===============================================================");
        System.out.printf("   TEST SUMMARY: %d PASSED, %d FAILED\n", testsPassed, testsFailed);
        System.out.println("===============================================================");

        if (testsFailed > 0) {
            System.exit(1);
        }
    }

    private static void assertTrue(String testName, boolean condition, String details) {
        if (condition) {
            System.out.printf("  [PASS] %-45s - %s\n", testName, details);
            testsPassed++;
        } else {
            System.err.printf("  [FAIL] %-45s - %s\n", testName, details);
            testsFailed++;
        }
    }

    private static void testDatabaseConnectivity() {
        System.out.println("\n--- 1. Database & Config Test ---");
        try {
            boolean isConfigured = DatabaseConfig.DB_URL != null && !DatabaseConfig.DB_URL.isBlank();
            assertTrue("Database Config URL", isConfigured, "JDBC URL: " + DatabaseConfig.DB_URL);
            assertTrue("App Title Set", DatabaseConfig.APP_TITLE != null, "Title: " + DatabaseConfig.APP_TITLE);
        } catch (Exception e) {
            assertTrue("Database Connectivity", false, e.getMessage());
        }
    }

    private static void testPasswordHashing() {
        System.out.println("\n--- 2. Cryptographic Security Test (SHA-256) ---");
        String plain = "Password@123";
        String hash = PasswordHasher.hash(plain);

        assertTrue("Password Hashing Non-Null", hash != null && hash.length() == 64,
                "Hash generated 64-character hex: " + (hash != null ? hash.substring(0, 16) : "") + "...");

        assertTrue("Password Verification Match", PasswordHasher.verify(plain, hash),
                "Plain text matches stored hash correctly");

        assertTrue("Password Verification Mismatch", !PasswordHasher.verify("WrongPass", hash),
                "Incorrect password properly rejected");
    }

    private static void testInputValidation() {
        System.out.println("\n--- 3. Input Validation Test ---");
        assertTrue("Valid Email", InputValidator.validateEmail("saketh@college.edu") == null, "Valid email accepted");
        assertTrue("Invalid Email", InputValidator.validateEmail("invalid-email") != null, "Malformed email rejected");
        assertTrue("Password Length", InputValidator.validatePassword("12345") != null, "Short password rejected");
        assertTrue("Valid Rating", InputValidator.validateRating(4) == null, "Rating 4 accepted");
        assertTrue("Invalid Rating Low", InputValidator.validateRating(0) != null, "Rating 0 rejected");
        assertTrue("Invalid Rating High", InputValidator.validateRating(6) != null, "Rating 6 rejected");
    }

    private static void testSessionManager() {
        System.out.println("\n--- 4. Session State Management Test ---");
        Student testStudent = new Student();
        testStudent.setStudentId(99);
        testStudent.setFullName("Test User");

        SessionManager.getInstance().setCurrentUser(testStudent);
        assertTrue("Session Active", SessionManager.getInstance().isLoggedIn(), "Session is marked active");
        assertTrue("Session Student ID", SessionManager.getInstance().getCurrentUserId() == 99, "User ID matches");

        SessionManager.getInstance().clearSession();
        assertTrue("Session Cleared", !SessionManager.getInstance().isLoggedIn(), "Session cleared on logout");
    }

    private static void testMutualSkillAlgorithm() {
        System.out.println("\n--- 5. DSA Set Overlap Algorithm Test ---");
        List<Integer> aOffered = List.of(1, 2, 3); // e.g. Java, Python, C
        List<Integer> aWanted  = List.of(10, 19);  // e.g. React, SQL

        List<Integer> bOffered = List.of(10, 19);  // e.g. React, SQL
        List<Integer> bWanted  = List.of(1, 2);    // e.g. Java, Python

        int overlap = MatchingAlgorithm.countOverlap(aOffered, bWanted);
        assertTrue("Skill Count Overlap", overlap == 2, "Found 2 overlapping skills");

        double mutual = MatchingAlgorithm.calculateMatchScore(aOffered, aWanted, bOffered, bWanted);
        assertTrue("Mutual Compatibility", mutual == 100.0, "Perfect 100% mutual match computed: " + mutual + "%");

        List<Integer> cOffered = List.of(50);
        List<Integer> cWanted = List.of(60);
        double noMatch = MatchingAlgorithm.calculateMatchScore(aOffered, aWanted, cOffered, cWanted);
        assertTrue("Zero Compatibility", noMatch == 0.0, "Disjoint skills correctly yield 0% match");
    }

    private static void testPeerSortingAndRanking() {
        System.out.println("\n--- 6. DSA Peer Sorting & Ranking (Heap & Sort) Test ---");
        Student s1 = new Student("S1", "Alice", "alice@college.edu", "pass", "CSE", 2, "");
        Student s2 = new Student("S2", "Bob", "bob@college.edu", "pass", "ECE", 2, "");
        Student s3 = new Student("S3", "Charlie", "charlie@college.edu", "pass", "MECH", 2, "");

        List<PeerMatch> matches = new ArrayList<>();
        matches.add(new PeerMatch(s1, 45.0, List.of(), List.of()));
        matches.add(new PeerMatch(s2, 90.0, List.of(), List.of()));
        matches.add(new PeerMatch(s3, 70.0, List.of(), List.of()));

        // Test Sorting
        MatchingAlgorithm.sortMatches(matches);
        assertTrue("PeerSorter Descending Order",
                matches.get(0).getScore() == 90.0 && matches.get(1).getScore() == 70.0 && matches.get(2).getScore() == 45.0,
                "Sorted by match score descending: 90% -> 70% -> 45%");

        // Test Insertion Sort
        List<PeerMatch> unsorted = new ArrayList<>();
        unsorted.add(new PeerMatch(s1, 30.0, List.of(), List.of()));
        unsorted.add(new PeerMatch(s2, 85.0, List.of(), List.of()));
        unsorted.add(new PeerMatch(s3, 60.0, List.of(), List.of()));
        MatchingAlgorithm.insertionSort(unsorted);
        assertTrue("PeerSorter Insertion Sort",
                unsorted.get(0).getScore() == 85.0 && unsorted.get(2).getScore() == 30.0,
                "Insertion sort ordered correctly");

        // Test PriorityQueue Max-Heap
        PeerMatch best = MatchingAlgorithm.getBest(matches);
        assertTrue("PeerRanker Top Match", best != null && best.getScore() == 90.0,
                "Highest match extracted: " + (best != null ? best.getPeer().getFullName() : ""));

        List<PeerMatch> top2 = MatchingAlgorithm.getTopK(matches, 2);
        assertTrue("PeerRanker Top-2 (PriorityQueue)", top2.size() == 2 && top2.get(0).getScore() == 90.0,
                "Top-2 extracted via PriorityQueue");
    }

    private static void testStudentDAOAndCatalogue() {
        System.out.println("\n--- 7. Data Model, OOP & Database Test ---");
        SkillCategory cat = new SkillCategory(1, "Programming Languages", "Languages");
        Skill skill = new Skill(1, "Java", cat);

        assertTrue("Skill Model Integrity", "Java".equals(skill.getSkillName()), "Skill model initialized correctly");
        assertTrue("Composition Pattern", skill.getCategory() != null, "Skill has-a Category composition verified");

        Student s = new Student("CS2024001", "Saketh", "saketh@college.edu", "hash", "CSE", 3, "Bio");
        assertTrue("Student Model Integrity", "CS2024001".equals(s.getStudentNumber()), "Student entity verified");

        try {
            StudentDAO dao = new StudentDAO();
            int count = dao.countAll();
            assertTrue("Database Live Connection & Query", count >= 0, "Total registered students queried: " + count);
        } catch (Exception ex) {
            assertTrue("Database Live Connection & Query", false, ex.getMessage());
        }
    }
}
