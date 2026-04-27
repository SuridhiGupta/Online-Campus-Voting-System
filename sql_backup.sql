

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    erp_id VARCHAR(50) UNIQUE,
    name TEXT,
    department TEXT,
    year INT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT
);

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name TEXT,
    post_id INT REFERENCES posts(id),
    photo_url TEXT
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    candidate_id INT REFERENCES candidates(id),
    post_id INT REFERENCES posts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, post_id)
);

CREATE TABLE election (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT false
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin'
);

INSERT INTO admins (username, password)
VALUES ('admin', 'admin123');

CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher'
);

INSERT INTO teachers (username, password)
VALUES ('teacher', 'teacher123');

ALTER TABLE students
ADD COLUMN has_voted BOOLEAN DEFAULT false;

DELETE FROM posts;
DELETE FROM votes;
DELETE FROM students;
DELETE FROM candidates;

SELECT * FROM candidates;
SELECT * FROM students;
SELECT * FROM votes;
SELECT * FROM posts;
SELECT * FROM election;

TRUNCATE TABLE posts RESTART IDENTITY CASCADE;
TRUNCATE TABLE votes, candidates, posts RESTART IDENTITY CASCADE;

INSERT INTO election (is_active)
SELECT false
WHERE NOT EXISTS (
    SELECT 1 FROM election
);

ALTER TABLE students DROP COLUMN is_active;

DROP TABLE votes;

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    candidate_id INT REFERENCES candidates(id),
    post_id INT REFERENCES posts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, post_id)
);

SELECT * FROM votes ;

SELECT erp_id, name, has_voted
FROM students
WHERE erp_id = '23150007';


CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    erp_id VARCHAR(50) UNIQUE,
    name TEXT,
    department TEXT,
    year INT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT
);

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name TEXT,
    post_id INT REFERENCES posts(id),
    photo_url TEXT
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    candidate_id INT REFERENCES candidates(id),
    post_id INT REFERENCES posts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, post_id)
);

CREATE TABLE election (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT false
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin'
);

INSERT INTO admins (username, password)
VALUES ('admin', 'admin123');

CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher'
);

INSERT INTO teachers (username, password)
VALUES ('teacher', 'teacher123');

ALTER TABLE students
ADD COLUMN has_voted BOOLEAN DEFAULT false;

DELETE FROM posts;
DELETE FROM votes;
DELETE FROM students;
DELETE FROM candidates;

SELECT * FROM candidates;
SELECT * FROM students;
SELECT * FROM votes;
SELECT * FROM posts;
SELECT * FROM election;

TRUNCATE TABLE students RESTART IDENTITY CASCADE;
TRUNCATE TABLE votes, candidates, posts RESTART IDENTITY CASCADE;

INSERT INTO election (is_active)
SELECT false
WHERE NOT EXISTS (
    SELECT 1 FROM election
);

ALTER TABLE students DROP COLUMN is_active;

DROP TABLE votes;

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    candidate_id INT REFERENCES candidates(id),
    post_id INT REFERENCES posts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, post_id)
);

SELECT * FROM votes ;

SELECT erp_id, name, has_voted
FROM students
WHERE erp_id = '23150007';


CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    erp_id VARCHAR(50) UNIQUE,
    name TEXT,
    department TEXT,
    year INT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT
);

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name TEXT,
    post_id INT REFERENCES posts(id),
    photo_url TEXT
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    candidate_id INT REFERENCES candidates(id),
    post_id INT REFERENCES posts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, post_id)
);

CREATE TABLE election (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT false
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin'
);

INSERT INTO admins (username, password)
VALUES ('admin', 'admin123');

select * from admins;

CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher'
);

INSERT INTO teachers (username, password)
VALUES ('teacher', 'teacher123');

ALTER TABLE students
ADD COLUMN has_voted BOOLEAN DEFAULT false;

DELETE FROM posts;
DELETE FROM votes;
DELETE FROM students;
DELETE FROM candidates;

SELECT * FROM candidates;
SELECT * FROM students;
SELECT * FROM votes;
SELECT * FROM posts;
SELECT * FROM election;

TRUNCATE TABLE posts RESTART IDENTITY CASCADE;
TRUNCATE TABLE votes, candidates, posts RESTART IDENTITY CASCADE;

INSERT INTO election (is_active)
SELECT false
WHERE NOT EXISTS (
    SELECT 1 FROM election
);

ALTER TABLE students DROP COLUMN is_active;

DROP TABLE votes;

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    candidate_id INT REFERENCES candidates(id),
    post_id INT REFERENCES posts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, post_id)
);

SELECT * FROM votes ;

SELECT erp_id, name, has_voted
FROM students
WHERE erp_id = '23150007';

SELECT * FROM teachers;

ALTER TABLE teachers
ADD COLUMN department TEXT,
ADD COLUMN year INT;

UPDATE teachers
SET department = 'AIDS',
    year = 3
WHERE username = 'teacher';

SELECT id, name, photo_url
FROM candidates;

INSERT INTO posts (title)
VALUES ('President');

UPDATE students
SET erp_id = '23150194'
WHERE erp_id = '231500194';

select * from students ;

ALTER TABLE votes
DROP CONSTRAINT votes_student_id_fkey;

ALTER TABLE votes
DROP CONSTRAINT votes_student_id_fkey;

ALTER TABLE votes
ADD CONSTRAINT votes_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES students(id)
ON DELETE CASCADE;

CREATE TABLE teacher_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id INT UNIQUE,
  department TEXT NOT NULL,
  year INT NOT NULL
);

select * from teacher_assignments;
