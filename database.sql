-- Database initialization script for GradeFlow

CREATE DATABASE IF NOT EXISTS gradeflow;
USE gradeflow;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Student', 'Faculty') NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    question_file VARCHAR(255) NOT NULL,
    deadline DATE NOT NULL,
    formats VARCHAR(100) DEFAULT 'pdf',
    faculty_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(50) DEFAULT NULL,
    feedback TEXT DEFAULT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Initial Data
INSERT IGNORE INTO users (name, email, password, role, department) VALUES 
('Alex Student', 'student@university.edu', '$2y$10$n8H3G5N43P7z7/8O8R3C.e5WnF7E8M8G8p8e8r8t8v8e8l8o8u8t8i8o8n', 'Student', 'Computer Science'),
('Prof. Johnson', 'faculty@university.edu', '$2y$10$n8H3G5N43P7z7/8O8R3C.e5WnF7E8M8G8p8e8r8t8v8e8l8o8u8t8i8o8n', 'Faculty', 'Computer Science');
-- Note: 'password' is the raw password for the seeded users.
