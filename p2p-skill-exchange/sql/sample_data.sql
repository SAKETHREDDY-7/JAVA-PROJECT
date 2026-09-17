-- ============================================================
-- Student Portal System - Sample Data (sample_data.sql)
-- Initial seed data for Review 1:
-- 1. Skill Categories
-- 2. Technical Skills Catalogue
-- 3. Sample Student Profiles (Passwords hashed with SHA-256)
-- 4. Initial Known Skills Linked to Students
-- ============================================================

USE p2p_skill_exchange;

-- ── 1. SKILL CATEGORIES ─────────────────────────────────────
INSERT INTO skill_category (category_id, category_name, description) VALUES
(1, 'Programming Languages', 'Core programming and scripting languages'),
(2, 'Web Development',       'Frontend and backend web technologies'),
(3, 'Database & Storage',    'Relational and NoSQL database management'),
(4, 'Data Science & AI',     'Data analytics, machine learning, and AI'),
(5, 'DevOps & Cloud',        'Cloud platforms, containerization, and Git'),
(6, 'Mobile Development',    'Android and iOS mobile app development'),
(7, 'UI/UX & Design',        'User interface and experience design principles');

-- ── 2. TECHNICAL SKILLS CATALOGUE ───────────────────────────

-- Programming Languages (category_id = 1)
INSERT INTO skill (skill_id, skill_name, category_id) VALUES
(1,  'Java',             1),
(2,  'Python',           1),
(3,  'C Programming',    1),
(4,  'C++',              1),
(5,  'JavaScript',       1),
(6,  'TypeScript',       1);

-- Web Development (category_id = 2)
INSERT INTO skill (skill_id, skill_name, category_id) VALUES
(7,  'HTML & CSS',       2),
(8,  'React.js',         2),
(9,  'Node.js',          2),
(10, 'Spring Boot',      2),
(11, 'Django',           2);

-- Database & Storage (category_id = 3)
INSERT INTO skill (skill_id, skill_name, category_id) VALUES
(12, 'SQL & Databases',  3),
(13, 'MySQL',            3),
(14, 'PostgreSQL',       3),
(15, 'MongoDB',          3);

-- Data Science & AI (category_id = 4)
INSERT INTO skill (skill_id, skill_name, category_id) VALUES
(16, 'Machine Learning', 4),
(17, 'Data Analysis',    4),
(18, 'Deep Learning',    4);

-- DevOps & Cloud (category_id = 5)
INSERT INTO skill (skill_id, skill_name, category_id) VALUES
(19, 'Git & GitHub',     5),
(20, 'Docker',           5),
(21, 'AWS Cloud',        5),
(22, 'Linux',            5);

-- Mobile Development (category_id = 6)
INSERT INTO skill (skill_id, skill_name, category_id) VALUES
(23, 'Android Dev',      6),
(24, 'Flutter',          6);

-- UI/UX & Design (category_id = 7)
INSERT INTO skill (skill_id, skill_name, category_id) VALUES
(25, 'Figma',            7),
(26, 'UI/UX Design',     7);

-- ── 3. SAMPLE STUDENT PROFILES ──────────────────────────────
-- Password for demo accounts: "Password@123"
-- SHA-256("Password@123") = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

INSERT INTO student (student_id, student_number, full_name, email, password_hash, department, year_of_study, bio) VALUES
(1, '22CS0148', 'Saketh Reddy', 'saketh.reddy@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Science & Engineering', 3,
 'Passionate about full-stack web engineering, Java backend systems, and relational databases.'),

(2, '22CS0102', 'Priya Sharma', 'priya.sharma@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Information Technology', 3,
 'Data Science and Machine Learning enthusiast with hands-on Python experience.'),

(3, '23CS0055', 'Arjun Mehta', 'arjun.mehta@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Science', 2,
 'Frontend developer exploring modern JavaScript frameworks and responsive UI design.');

-- ── 4. LINK INITIAL SKILLS TO STUDENTS ──────────────────────
-- Each row: (student_id, skill_id)

-- Saketh Reddy: Java(1), SQL & Databases(12), Git & GitHub(19), MySQL(13)
INSERT INTO student_offered_skill (student_id, skill_id) VALUES
(1, 1),
(1, 12),
(1, 13),
(1, 19);

-- Priya Sharma: Python(2), Machine Learning(16), Data Analysis(17)
INSERT INTO student_offered_skill (student_id, skill_id) VALUES
(2, 2),
(2, 16),
(2, 17);

-- Arjun Mehta: HTML & CSS(7), React.js(8), JavaScript(5)
INSERT INTO student_offered_skill (student_id, skill_id) VALUES
(3, 7),
(3, 8),
(3, 5);

-- ── END OF CLEAN SAMPLE DATA ────────────────────────────────
