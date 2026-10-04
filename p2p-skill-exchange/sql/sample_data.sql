-- ============================================================
-- Peer-to-Peer Skill Exchange System
-- SEED DATA  (sample_data.sql)
-- Phase 2 · Member 4 responsibility
--
-- Run AFTER schema.sql:
--   mysql -u root -p p2p_skill_exchange < sample_data.sql
--
-- Initializes default skill categories and skills taxonomy.
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

-- ── END OF SEED DATA ────────────────────────────────────────
