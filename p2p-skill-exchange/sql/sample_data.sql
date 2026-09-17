-- ============================================================
-- Peer-to-Peer Skill Exchange System
-- SAMPLE DATA  (sample_data.sql)
-- Phase 2 · Member 4 responsibility
--
-- Run AFTER schema.sql:
--   mysql -u root -p p2p_skill_exchange < sample_data.sql
--
-- 10 students, 30 skills, rich KNN-demonstrable assignments.
-- Passwords are SHA-256 of "Password@123" for all sample users.
-- SHA-256("Password@123") =
--   ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
-- ============================================================

USE p2p_skill_exchange;

-- ── 1. SKILL CATEGORIES ────────────────────────────────────

INSERT INTO skill_category (category_name, description) VALUES
('Programming Languages', 'Core programming and scripting languages'),
('Web Development',       'Frontend and backend web technologies'),
('Data Science & ML',     'Data analysis, machine learning, and AI'),
('Database',              'Database management and query languages'),
('Mobile Development',    'iOS and Android application development'),
('DevOps & Cloud',        'Cloud platforms, CI/CD, and infrastructure'),
('Design & UX',           'UI/UX design tools and principles'),
('Soft Skills',           'Communication, leadership, and teamwork');

-- ── 2. SKILLS ──────────────────────────────────────────────

-- Programming Languages (category_id = 1)
INSERT INTO skill (skill_name, category_id) VALUES
('Java',         1),   -- skill_id  1
('Python',       1),   -- skill_id  2
('C Programming',1),   -- skill_id  3
('C++',          1),   -- skill_id  4
('JavaScript',   1),   -- skill_id  5
('Kotlin',       1),   -- skill_id  6
('Swift',        1),   -- skill_id  7
('R Programming',1);   -- skill_id  8

-- Web Development (category_id = 2)
INSERT INTO skill (skill_name, category_id) VALUES
('HTML & CSS',        2),   -- skill_id  9
('React.js',          2),   -- skill_id 10
('Node.js',           2),   -- skill_id 11
('Spring Boot',       2),   -- skill_id 12
('Django',            2);   -- skill_id 13

-- Data Science & ML (category_id = 3)
INSERT INTO skill (skill_name, category_id) VALUES
('Machine Learning',  3),   -- skill_id 14
('Deep Learning',     3),   -- skill_id 15
('Data Analysis',     3),   -- skill_id 16
('NLP',               3),   -- skill_id 17
('Computer Vision',   3);   -- skill_id 18

-- Database (category_id = 4)
INSERT INTO skill (skill_name, category_id) VALUES
('SQL',               4),   -- skill_id 19
('MySQL',             4),   -- skill_id 20
('MongoDB',           4);   -- skill_id 21

-- Mobile Development (category_id = 5)
INSERT INTO skill (skill_name, category_id) VALUES
('Android Development', 5),  -- skill_id 22
('iOS Development',     5),  -- skill_id 23
('Flutter',             5);  -- skill_id 24

-- DevOps & Cloud (category_id = 6)
INSERT INTO skill (skill_name, category_id) VALUES
('Git & GitHub',    6),   -- skill_id 25
('Docker',          6),   -- skill_id 26
('AWS',             6),   -- skill_id 27
('Linux',           6);   -- skill_id 28

-- Design & UX (category_id = 7)
INSERT INTO skill (skill_name, category_id) VALUES
('Figma',           7),   -- skill_id 29
('UI/UX Design',    7);   -- skill_id 30

-- ── 3. STUDENTS ────────────────────────────────────────────
-- All passwords = SHA-256 of "Password@123"

INSERT INTO student
    (student_number, full_name, email, password_hash, department, year_of_study, bio)
VALUES
-- S1 — Saketh (Java + SQL expert, wants Python + ML)
('CS2024001', 'Saketh Reddy',
 'saketh.reddy@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Science', 3,
 'Passionate about backend development and databases. Looking to expand into Data Science.'),

-- S2 — Priya (Python + ML expert, wants Java + Web)
('CS2024002', 'Priya Sharma',
 'priya.sharma@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Information Technology', 3,
 'Data Science enthusiast who loves Python and Machine Learning. Want to learn Java.'),

-- S3 — Arjun (Web dev expert, wants Mobile + Python)
('CS2024003', 'Arjun Mehta',
 'arjun.mehta@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Science', 2,
 'Full-stack web developer. Excited about mobile apps and AI.'),

-- S4 — Divya (Android + Flutter expert, wants Web + ML)
('CS2024004', 'Divya Nair',
 'divya.nair@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Science', 3,
 'Mobile developer with Flutter expertise. Keen to learn web development and machine learning.'),

-- S5 — Rahul (DevOps + Cloud expert, wants Python + SQL)
('CS2024005', 'Rahul Verma',
 'rahul.verma@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Information Technology', 4,
 'DevOps and cloud enthusiast. Love automating things. Want to add data skills.'),

-- S6 — Anjali (Design + Frontend, wants Python + Android)
('CS2024006', 'Anjali Singh',
 'anjali.singh@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Applications', 2,
 'Creative designer who codes. Looking to learn Python and Android.'),

-- S7 — Kiran (C/C++ + DSA expert, wants Web + Cloud)
('CS2024007', 'Kiran Kumar',
 'kiran.kumar@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Science', 3,
 'Competitive programmer. Strong in C, C++ and algorithms. Want to explore web and cloud.'),

-- S8 — Sneha (R + Data Analysis expert, wants Deep Learning + SQL)
('CS2024008', 'Sneha Patel',
 'sneha.patel@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Data Science', 3,
 'Statistician at heart. Loves R and data analysis. Now moving towards deep learning.'),

-- S9 — Aditya (iOS + Swift expert, wants JavaScript + ML)
('CS2024009', 'Aditya Joshi',
 'aditya.joshi@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Computer Science', 4,
 'iOS developer who built three apps on the App Store. Interested in web and AI.'),

-- S10 — Meera (NLP + ML expert, wants Java + SQL + Android)
('CS2024010', 'Meera Krishnan',
 'meera.krishnan@college.edu',
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
 'Artificial Intelligence', 3,
 'NLP researcher. Working on chatbot projects. Wants to build a full-stack Android app.');

-- ── 4. STUDENT OFFERED SKILLS ──────────────────────────────
-- Each row: (student_id, skill_id)

INSERT INTO student_offered_skill (student_id, skill_id) VALUES
-- Saketh S1: Java(1), C(3), SQL(19), MySQL(20), Git(25)
(1, 1), (1, 3), (1, 19), (1, 20), (1, 25),

-- Priya S2: Python(2), Machine Learning(14), Data Analysis(16), R(8), SQL(19)
(2, 2), (2, 14), (2, 16), (2, 8), (2, 19),

-- Arjun S3: HTML&CSS(9), React.js(10), Node.js(11), JavaScript(5), Git(25)
(3, 9), (3, 10), (3, 11), (3, 5), (3, 25),

-- Divya S4: Android Dev(22), Flutter(24), Kotlin(6), Java(1)
(4, 22), (4, 24), (4, 6), (4, 1),

-- Rahul S5: Docker(26), AWS(27), Linux(28), Git(25), Python(2)
(5, 26), (5, 27), (5, 28), (5, 25), (5, 2),

-- Anjali S6: Figma(29), UI/UX(30), HTML&CSS(9), JavaScript(5)
(6, 29), (6, 30), (6, 9), (6, 5),

-- Kiran S7: C(3), C++(4), Java(1), Linux(28), Git(25)
(7, 3), (7, 4), (7, 1), (7, 28), (7, 25),

-- Sneha S8: R(8), Data Analysis(16), SQL(19), MySQL(20), Machine Learning(14)
(8, 8), (8, 16), (8, 19), (8, 20), (8, 14),

-- Aditya S9: Swift(7), iOS Dev(23), Kotlin(6), Java(1)
(9, 7), (9, 23), (9, 6), (9, 1),

-- Meera S10: NLP(17), Machine Learning(14), Python(2), Deep Learning(15)
(10, 17), (10, 14), (10, 2), (10, 15);

-- ── 5. STUDENT WANTED SKILLS ───────────────────────────────

INSERT INTO student_wanted_skill (student_id, skill_id) VALUES
-- Saketh S1: wants Python(2), ML(14), Django(13), Deep Learning(15)
(1, 2), (1, 14), (1, 13), (1, 15),

-- Priya S2: wants Java(1), Spring Boot(12), Android Dev(22), MySQL(20)
(2, 1), (2, 12), (2, 22), (2, 20),

-- Arjun S3: wants Python(2), Flutter(24), ML(14), AWS(27)
(3, 2), (3, 24), (3, 14), (3, 27),

-- Divya S4: wants React.js(10), Node.js(11), ML(14), Python(2)
(4, 10), (4, 11), (4, 14), (4, 2),

-- Rahul S5: wants Python(2), SQL(19), ML(14), Java(1)
(5, 2), (5, 19), (5, 14), (5, 1),

-- Anjali S6: wants Python(2), Android Dev(22), Flutter(24), React.js(10)
(6, 2), (6, 22), (6, 24), (6, 10),

-- Kiran S7: wants React.js(10), Node.js(11), AWS(27), Docker(26)
(7, 10), (7, 11), (7, 27), (7, 26),

-- Sneha S8: wants Deep Learning(15), NLP(17), Python(2), MongoDB(21)
(8, 15), (8, 17), (8, 2), (8, 21),

-- Aditya S9: wants JavaScript(5), React.js(10), ML(14), Python(2)
(9, 5), (9, 10), (9, 14), (9, 2),

-- Meera S10: wants Java(1), SQL(19), Android Dev(22), Spring Boot(12)
(10, 1), (10, 19), (10, 22), (10, 12);

-- ── 6. SKILL EXCHANGE REQUESTS ─────────────────────────────
-- Demonstrates all three statuses: PENDING, ACCEPTED, REJECTED

INSERT INTO skill_exchange_request
    (sender_id, receiver_id, message, status, created_at)
VALUES
-- S1 (Saketh) → S2 (Priya): strong mutual match, ACCEPTED
(1, 2,
 'Hi Priya! I can teach you Java and SQL, you can teach me Python and ML. Great exchange?',
 'ACCEPTED',
 NOW() - INTERVAL 15 DAY),

-- S3 (Arjun) → S4 (Divya): mutual Web ↔ Mobile, ACCEPTED
(3, 4,
 'Hey Divya! I know React + Node, you know Flutter + Android. Perfect match!',
 'ACCEPTED',
 NOW() - INTERVAL 10 DAY),

-- S7 (Kiran) → S3 (Arjun): Kiran wants Web, Arjun wants nothing from Kiran, REJECTED
(7, 3,
 'Hi Arjun, I want to learn React. I can help with C/C++ if needed.',
 'REJECTED',
 NOW() - INTERVAL 8 DAY),

-- S5 (Rahul) → S1 (Saketh): Rahul wants Java, Saketh wants nothing Rahul offers, PENDING
(5, 1,
 'Hey Saketh! I can help you with AWS and Docker. Can you teach me Java?',
 'PENDING',
 NOW() - INTERVAL 3 DAY),

-- S6 (Anjali) → S4 (Divya): Anjali wants Android, Divya wants React, PENDING
(6, 4,
 'Hi Divya, I would love to learn Flutter! I can teach you HTML/CSS and Figma.',
 'PENDING',
 NOW() - INTERVAL 2 DAY),

-- S8 (Sneha) → S10 (Meera): both ML/NLP/Python cluster, ACCEPTED
(8, 10,
 'Hi Meera! I can help with R and Data Analysis, you can guide me in NLP and Deep Learning.',
 'ACCEPTED',
 NOW() - INTERVAL 12 DAY),

-- S9 (Aditya) → S2 (Priya): Aditya wants Python/ML, Priya wants Android, PENDING
(9, 2,
 'Hello Priya! Great profile. I can teach iOS/Swift and you can teach me Python and ML?',
 'PENDING',
 NOW() - INTERVAL 1 DAY),

-- S2 (Priya) → S4 (Divya): Priya wants Android, Divya wants Python — PENDING
(2, 4,
 'Hi Divya! I want to learn Android. Can teach you Python and ML in return.',
 'PENDING',
 NOW() - INTERVAL 5 DAY);

-- ── 7. MATCHES ─────────────────────────────────────────────
-- Created from ACCEPTED requests above.
-- request_id 1 → (S1, S2), request_id 2 → (S3, S4), request_id 6 → (S8, S10)

INSERT INTO `match`
    (request_id, student_id_1, student_id_2, match_score, matched_at)
VALUES
(1, 1, 2,  92.00, NOW() - INTERVAL 14 DAY),
(2, 3, 4,  85.00, NOW() - INTERVAL 9 DAY),
(6, 8, 10, 78.00, NOW() - INTERVAL 11 DAY);

-- ── 8. FEEDBACK ────────────────────────────────────────────
-- Both participants of matches 1 and 2 have reviewed each other.
-- Match 3 (Sneha ↔ Meera) has only one-sided feedback so far.

INSERT INTO feedback
    (match_id, reviewer_id, reviewed_id, rating, comment, created_at)
VALUES
-- Match 1: Saketh ↔ Priya
(1, 1, 2, 5,
 'Priya explained Python and ML concepts brilliantly! Highly recommend.',
 NOW() - INTERVAL 7 DAY),
(1, 2, 1, 5,
 'Saketh is an amazing Java teacher. Very patient and thorough.',
 NOW() - INTERVAL 6 DAY),

-- Match 2: Arjun ↔ Divya
(2, 3, 4, 4,
 'Divya has excellent Flutter knowledge. Helped me build my first mobile app!',
 NOW() - INTERVAL 5 DAY),
(2, 4, 3, 5,
 'Arjun taught me React and Node.js really well. Great communicator.',
 NOW() - INTERVAL 4 DAY),

-- Match 3: Sneha → Meera (one-sided so far)
(3, 8, 10, 4,
 'Meera is a great guide for NLP. Looking forward to more sessions.',
 NOW() - INTERVAL 3 DAY);

-- ── 9. VERIFICATION QUERIES ────────────────────────────────
-- Run these to confirm data is correct after import.

/*
-- Count checks
SELECT 'skill_category' AS tbl, COUNT(*) AS cnt FROM skill_category
UNION ALL SELECT 'skill',            COUNT(*) FROM skill
UNION ALL SELECT 'student',          COUNT(*) FROM student
UNION ALL SELECT 'offered_skills',   COUNT(*) FROM student_offered_skill
UNION ALL SELECT 'wanted_skills',    COUNT(*) FROM student_wanted_skill
UNION ALL SELECT 'requests',         COUNT(*) FROM skill_exchange_request
UNION ALL SELECT 'matches',          COUNT(*) FROM `match`
UNION ALL SELECT 'feedback',         COUNT(*) FROM feedback;

-- Skill summary per student
SELECT * FROM v_student_summary ORDER BY student_id;

-- Strong mutual matches (for KNN demo): Saketh ↔ Priya
SELECT
    s1.full_name AS student,
    GROUP_CONCAT(DISTINCT sk1.skill_name ORDER BY sk1.skill_name) AS offers,
    GROUP_CONCAT(DISTINCT sk2.skill_name ORDER BY sk2.skill_name) AS wants
FROM student s1
JOIN student_offered_skill sos ON sos.student_id = s1.student_id
JOIN skill sk1 ON sk1.skill_id = sos.skill_id
JOIN student_wanted_skill sws ON sws.student_id = s1.student_id
JOIN skill sk2 ON sk2.skill_id = sws.skill_id
WHERE s1.student_id IN (1, 2)
GROUP BY s1.student_id, s1.full_name;
*/

-- ── END OF SAMPLE DATA ─────────────────────────────────────
