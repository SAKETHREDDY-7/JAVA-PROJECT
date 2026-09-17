-- ============================================================
-- Peer-to-Peer Skill Exchange System
-- DATABASE SCHEMA  (schema.sql)
-- Phase 2 · Member 4 responsibility
--
-- Run this file ONCE to set up the database:
--   mysql -u root -p < schema.sql
--
-- MySQL 8.x+ required.
-- ============================================================

-- ── 0. Create and select the database ──────────────────────
DROP DATABASE IF EXISTS p2p_skill_exchange;
CREATE DATABASE p2p_skill_exchange
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE p2p_skill_exchange;

-- ── 1. SKILL_CATEGORY ──────────────────────────────────────
-- Normalizes skill groupings (Programming, Data Science, etc.)
-- Prevents duplicating category names inside the skill table.
CREATE TABLE skill_category (
    category_id   INT          NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    description   VARCHAR(255)          DEFAULT NULL,

    CONSTRAINT pk_skill_category PRIMARY KEY (category_id),
    CONSTRAINT uq_category_name  UNIQUE (category_name)
);

-- ── 2. SKILL ───────────────────────────────────────────────
-- Central normalized catalogue of all skills.
-- Students never store raw skill text; they reference skill_id.
CREATE TABLE skill (
    skill_id    INT          NOT NULL AUTO_INCREMENT,
    skill_name  VARCHAR(100) NOT NULL,
    category_id INT          NOT NULL,

    CONSTRAINT pk_skill         PRIMARY KEY (skill_id),
    CONSTRAINT uq_skill_name    UNIQUE (skill_name),
    CONSTRAINT fk_skill_cat     FOREIGN KEY (category_id)
                                    REFERENCES skill_category(category_id)
                                    ON DELETE RESTRICT
                                    ON UPDATE CASCADE
);

-- ── 3. STUDENT ─────────────────────────────────────────────
-- Core user entity.  Passwords stored as SHA-256 hex strings.
CREATE TABLE student (
    student_id     INT          NOT NULL AUTO_INCREMENT,
    student_number VARCHAR(20)  NOT NULL,   -- e.g. "CS2024001"
    full_name      VARCHAR(150) NOT NULL,
    email          VARCHAR(200) NOT NULL,
    password_hash  VARCHAR(64)  NOT NULL,   -- SHA-256 → 64 hex chars
    department     VARCHAR(100)          DEFAULT NULL,
    year_of_study  TINYINT               DEFAULT NULL,  -- 1–4
    bio            TEXT                  DEFAULT NULL,
    profile_photo  VARCHAR(255)          DEFAULT NULL,  -- optional path
    created_at     DATETIME     NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL  DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_student          PRIMARY KEY (student_id),
    CONSTRAINT uq_student_email    UNIQUE (email),
    CONSTRAINT uq_student_number   UNIQUE (student_number),
    CONSTRAINT chk_year_of_study   CHECK (year_of_study BETWEEN 1 AND 6)
);

-- ── 4. STUDENT_OFFERED_SKILL ───────────────────────────────
-- Many-to-many: skills a student is willing to TEACH.
-- Composite PK prevents duplicate (student, skill) pairs.
CREATE TABLE student_offered_skill (
    student_id INT      NOT NULL,
    skill_id   INT      NOT NULL,
    added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_offered  PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_off_stu  FOREIGN KEY (student_id)
                               REFERENCES student(student_id)
                               ON DELETE CASCADE
                               ON UPDATE CASCADE,
    CONSTRAINT fk_off_ski  FOREIGN KEY (skill_id)
                               REFERENCES skill(skill_id)
                               ON DELETE CASCADE
                               ON UPDATE CASCADE
);

-- ── 5. STUDENT_WANTED_SKILL ────────────────────────────────
-- Many-to-many: skills a student WANTS TO LEARN.
CREATE TABLE student_wanted_skill (
    student_id INT      NOT NULL,
    skill_id   INT      NOT NULL,
    added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_wanted   PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_wan_stu  FOREIGN KEY (student_id)
                               REFERENCES student(student_id)
                               ON DELETE CASCADE
                               ON UPDATE CASCADE,
    CONSTRAINT fk_wan_ski  FOREIGN KEY (skill_id)
                               REFERENCES skill(skill_id)
                               ON DELETE CASCADE
                               ON UPDATE CASCADE
);

-- ── 6. SKILL_EXCHANGE_REQUEST ──────────────────────────────
-- A student (sender) proposes a skill exchange to another (receiver).
-- Status lifecycle:  PENDING → ACCEPTED | REJECTED
CREATE TABLE skill_exchange_request (
    request_id   INT          NOT NULL AUTO_INCREMENT,
    sender_id    INT          NOT NULL,
    receiver_id  INT          NOT NULL,
    message      TEXT                  DEFAULT NULL,  -- optional note
    status       ENUM(
                     'PENDING',
                     'ACCEPTED',
                     'REJECTED'
                 )            NOT NULL DEFAULT 'PENDING',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_request        PRIMARY KEY (request_id),
    CONSTRAINT fk_req_sender     FOREIGN KEY (sender_id)
                                     REFERENCES student(student_id)
                                     ON DELETE CASCADE
                                     ON UPDATE CASCADE,
    CONSTRAINT fk_req_receiver   FOREIGN KEY (receiver_id)
                                     REFERENCES student(student_id)
                                     ON DELETE CASCADE
                                     ON UPDATE CASCADE,
    -- A student cannot request themselves
    CONSTRAINT chk_no_self_req   CHECK (sender_id <> receiver_id)
);

-- Prevent duplicate PENDING requests between the same pair.
-- A new request is allowed only after the previous one is resolved.
CREATE UNIQUE INDEX uq_active_request
    ON skill_exchange_request (sender_id, receiver_id, status)
    -- MySQL does not support partial unique indexes with WHERE,
    -- so we handle the business rule in RequestService (Java layer)
    -- and add a composite unique on (sender_id, receiver_id) only
    -- when status = PENDING (enforced in application logic).
    ;

-- Note: the above index prevents ANY two rows with identical
-- (sender_id, receiver_id, status). This naturally prevents
-- two simultaneous PENDING requests from A→B.

-- ── 7. MATCH ───────────────────────────────────────────────
-- Created automatically when a request is ACCEPTED.
-- Represents a confirmed skill-exchange partnership.
CREATE TABLE `match` (
    match_id       INT          NOT NULL AUTO_INCREMENT,
    request_id     INT          NOT NULL,   -- originating request
    student_id_1   INT          NOT NULL,   -- was the sender
    student_id_2   INT          NOT NULL,   -- was the receiver
    match_score    DECIMAL(5,2)          DEFAULT NULL,  -- 0.00 – 100.00
    matched_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active      TINYINT(1)   NOT NULL DEFAULT 1,

    CONSTRAINT pk_match          PRIMARY KEY (match_id),
    CONSTRAINT uq_match_request  UNIQUE (request_id),   -- one match per request
    CONSTRAINT fk_match_req      FOREIGN KEY (request_id)
                                     REFERENCES skill_exchange_request(request_id)
                                     ON DELETE RESTRICT
                                     ON UPDATE CASCADE,
    CONSTRAINT fk_match_stu1     FOREIGN KEY (student_id_1)
                                     REFERENCES student(student_id)
                                     ON DELETE CASCADE
                                     ON UPDATE CASCADE,
    CONSTRAINT fk_match_stu2     FOREIGN KEY (student_id_2)
                                     REFERENCES student(student_id)
                                     ON DELETE CASCADE
                                     ON UPDATE CASCADE
);

-- ── 8. FEEDBACK ────────────────────────────────────────────
-- Post-exchange star rating (1–5) and optional comment.
-- Each student can leave exactly one feedback per match.
CREATE TABLE feedback (
    feedback_id   INT          NOT NULL AUTO_INCREMENT,
    match_id      INT          NOT NULL,
    reviewer_id   INT          NOT NULL,   -- student who writes the review
    reviewed_id   INT          NOT NULL,   -- student being reviewed
    rating        TINYINT      NOT NULL,   -- 1 to 5
    comment       TEXT                  DEFAULT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_feedback         PRIMARY KEY (feedback_id),
    CONSTRAINT uq_one_review       UNIQUE (match_id, reviewer_id),
    CONSTRAINT chk_rating_range    CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_no_self_review  CHECK (reviewer_id <> reviewed_id),
    CONSTRAINT fk_fb_match         FOREIGN KEY (match_id)
                                       REFERENCES `match`(match_id)
                                       ON DELETE CASCADE
                                       ON UPDATE CASCADE,
    CONSTRAINT fk_fb_reviewer      FOREIGN KEY (reviewer_id)
                                       REFERENCES student(student_id)
                                       ON DELETE CASCADE
                                       ON UPDATE CASCADE,
    CONSTRAINT fk_fb_reviewed      FOREIGN KEY (reviewed_id)
                                       REFERENCES student(student_id)
                                       ON DELETE CASCADE
                                       ON UPDATE CASCADE
);

-- ── 9. INDEXES (performance) ───────────────────────────────

-- Fast lookup of all skills for a student
CREATE INDEX idx_offered_student ON student_offered_skill(student_id);
CREATE INDEX idx_wanted_student  ON student_wanted_skill(student_id);

-- Fast lookup of requests by receiver (for "Incoming Requests" view)
CREATE INDEX idx_req_receiver ON skill_exchange_request(receiver_id);
CREATE INDEX idx_req_sender   ON skill_exchange_request(sender_id);
CREATE INDEX idx_req_status   ON skill_exchange_request(status);

-- Fast match lookups
CREATE INDEX idx_match_stu1   ON `match`(student_id_1);
CREATE INDEX idx_match_stu2   ON `match`(student_id_2);

-- Fast feedback lookup
CREATE INDEX idx_fb_reviewed  ON feedback(reviewed_id);

-- ── 10. SUMMARY VIEW (optional, useful for dashboard) ──────
CREATE OR REPLACE VIEW v_student_summary AS
SELECT
    s.student_id,
    s.full_name,
    s.email,
    s.department,
    s.year_of_study,
    COUNT(DISTINCT sos.skill_id)  AS offered_skill_count,
    COUNT(DISTINCT sws.skill_id)  AS wanted_skill_count,
    ROUND(AVG(f.rating), 1)       AS avg_rating,
    COUNT(DISTINCT f.feedback_id) AS feedback_count
FROM student s
LEFT JOIN student_offered_skill sos ON sos.student_id = s.student_id
LEFT JOIN student_wanted_skill  sws ON sws.student_id = s.student_id
LEFT JOIN `match`  m  ON (m.student_id_1 = s.student_id
                       OR m.student_id_2 = s.student_id)
LEFT JOIN feedback f  ON (f.match_id = m.match_id
                       AND f.reviewed_id = s.student_id)
GROUP BY s.student_id, s.full_name, s.email,
         s.department, s.year_of_study;

-- ── END OF SCHEMA ──────────────────────────────────────────
