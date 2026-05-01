-- 1. CLEAN START: Remove old tables if they exist
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS election CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS authorized_devices CASCADE;

-- 2. CORE TABLES
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    erp_id VARCHAR(50) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    year INT NOT NULL,
    has_voted BOOLEAN DEFAULT false
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL
);

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    photo_url TEXT
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    candidate_id INT REFERENCES candidates(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, post_id) -- Prevents double voting
);


CREATE TABLE election (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT false,
    start_time TIMESTAMP,
    end_time TIMESTAMP
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin'
);

CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher'
);

CREATE TABLE teacher_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id INT UNIQUE REFERENCES teachers(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  year INT NOT NULL
);

CREATE TABLE authorized_devices (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'pending',
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. INITIAL MASTER DATA
-- Default Admin
INSERT INTO admins (username, password) VALUES ('admin', 'admin123');

-- Initial Election State
INSERT INTO election (is_active) VALUES (false);

-- 4. FINAL CHECKS
SELECT 'SYSTEM READY' as status;
