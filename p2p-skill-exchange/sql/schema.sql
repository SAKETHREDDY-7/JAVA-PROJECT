-- ============================================================
-- Student Portal System - Database Schema (schema.sql)
-- Clean relational database design for Review 1:
-- 1. Student Authentication & Profile
-- 2. Skills Catalogue & Categorization
-- 3. Student Known Skills (Offered Skills)
-- ============================================================

-- ── 0. Create Database (MySQL) ──────────────────────────────
DROP DATABASE IF EXISTS p2p_skill_exchange;
CREATE DATABASE p2p_skill_exchange
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE p2p_skill_exchange;

-- ── 1. SKILL CATEGORY TABLE ─────────────────────────────────
-- Categorizes skills (e.g. Programming, Web Development, Databases)
CREATE TABLE skill_category (
    category_id   INT          NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    description   VARCHAR(255)          DEFAULT NULL,

    CONSTRAINT pk_skill_category PRIMARY KEY (category_id),
    CONSTRAINT uq_category_name  UNIQUE (category_name)
);

-- ── 2. SKILL TABLE (Central Skills Catalogue) ───────────────
-- Standard list of skills that students can choose and link
CREATE TABLE skill (
    skill_id    INT          NOT NULL AUTO_INCREMENT,
    skill_name  VARCHAR(100) NOT NULL,
    category_id INT          NOT NULL,

    CONSTRAINT pk_skill      PRIMARY KEY (skill_id),
    CONSTRAINT uq_skill_name UNIQUE (skill_name),
    CONSTRAINT fk_skill_cat  FOREIGN KEY (category_id)
                                 REFERENCES skill_category(category_id)
                                 ON DELETE RESTRICT
                                 ON UPDATE CASCADE
);

-- ── 3. STUDENT TABLE (Authentication & Profile) ─────────────
-- Stores student accounts with secure SHA-256 hashed passwords
CREATE TABLE student (
    student_id     INT          NOT NULL AUTO_INCREMENT,
    student_number VARCHAR(20)  NOT NULL,   -- e.g. "22CS0148"
    full_name      VARCHAR(150) NOT NULL,
    email          VARCHAR(200) NOT NULL,
    password_hash  VARCHAR(64)  NOT NULL,   -- SHA-256 hex string (64 chars)
    department     VARCHAR(100)          DEFAULT NULL,
    year_of_study  TINYINT               DEFAULT 1,  -- 1 to 4
    bio            TEXT                  DEFAULT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_student        PRIMARY KEY (student_id),
    CONSTRAINT uq_student_email  UNIQUE (email),
    CONSTRAINT uq_student_number UNIQUE (student_number),
    CONSTRAINT chk_year_of_study CHECK (year_of_study BETWEEN 1 AND 6)
);

-- ── 4. STUDENT KNOWN SKILLS (student_offered_skill) ─────────
-- Links students with skills they know (selected from SQL catalogue)
CREATE TABLE student_offered_skill (
    student_id INT      NOT NULL,
    skill_id   INT      NOT NULL,
    added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_offered PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_off_stu FOREIGN KEY (student_id)
                              REFERENCES student(student_id)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE,
    CONSTRAINT fk_off_ski FOREIGN KEY (skill_id)
                              REFERENCES skill(skill_id)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE
);

-- ── 5. STUDENT WANTED SKILLS (Learning Goals) ───────────────
CREATE TABLE student_wanted_skill (
    student_id INT      NOT NULL,
    skill_id   INT      NOT NULL,
    added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_wanted PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_wan_stu FOREIGN KEY (student_id)
                              REFERENCES student(student_id)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE,
    CONSTRAINT fk_wan_ski FOREIGN KEY (skill_id)
                              REFERENCES skill(skill_id)
                              ON DELETE CASCADE
                              ON UPDATE CASCADE
);

-- ── 6. INDEXES FOR FAST QUERYING ────────────────────────────
CREATE INDEX idx_student_email   ON student(email);
CREATE INDEX idx_offered_student ON student_offered_skill(student_id);
CREATE INDEX idx_offered_skill   ON student_offered_skill(skill_id);

-- ── END OF CLEAN SCHEMA ─────────────────────────────────────
