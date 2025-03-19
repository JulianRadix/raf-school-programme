-- Students table
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  `rank` VARCHAR(50),
  squadron VARCHAR(50),
  year INT,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  instructor VARCHAR(100),
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class schedule
CREATE TABLE class_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT,
  day_of_week INT, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME,
  end_time TIME,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Attendance records
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  class_id INT,
  date DATE,
  status ENUM('present', 'absent', 'authorized_leave', 'medical', 'unauthorized') NOT NULL,
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Assignments
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  class_id INT,
  description TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  assignment_id INT,
  grade VARCHAR(5),
  percentage DECIMAL(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role ENUM('admin', 'instructor', 'staff') NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (name, `rank`, squadron, year, email) VALUES
('Johnson, T.', 'Cadet', 'Alpha', 2, 'tjohnson@rafschool.example'),
('Williams, S.', 'Cadet', 'Bravo', 3, 'swilliams@rafschool.example'),
('Thompson, A.', 'Cadet', 'Charlie', 1, 'athompson@rafschool.example'),
('Davies, M.', 'Cadet', 'Alpha', 2, 'mdavies@rafschool.example'),
('Wilson, J.', 'Cadet', 'Bravo', 3, 'jwilson@rafschool.example');

INSERT INTO classes (title, description, instructor, room) VALUES
('Aviation Principles', 'Fundamentals of aviation and aerodynamics', 'Wg Cdr Johnson', 'Room 12A'),
('Flight Mechanics', 'Study of aircraft mechanics and systems', 'Flt Lt Davies', 'Lab 3'),
('RAF History', 'History of the Royal Air Force', 'Sqn Ldr Smith', 'Room 5B'),
('Leadership Skills', 'Leadership and management in the RAF', 'Gp Capt Williams', 'Hall 2');

INSERT INTO class_schedule (class_id, day_of_week, start_time, end_time) VALUES
(1, 1, '09:00:00', '10:30:00'), -- Aviation Principles on Monday
(2, 1, '11:00:00', '12:30:00'), -- Flight Mechanics on Monday
(3, 1, '14:00:00', '15:30:00'), -- RAF History on Monday
(4, 1, '16:00:00', '17:30:00'); -- Leadership Skills on Monday

INSERT INTO assignments (title, class_id, description, due_date) VALUES
('Flight Principles Essay', 1, 'Write a 2000-word essay on flight principles', DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY)),
('Aerodynamics Quiz', 2, 'Online quiz on aerodynamics fundamentals', DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY)),
('Battle of Britain Report', 3, 'Research report on the Battle of Britain', DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY)),
('Team Leadership Exercise', 4, 'Group exercise on team leadership', DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY));

-- Sample user
INSERT INTO users (username, password, name, role, email) VALUES
('smith', '$2b$10$X7VYVy1GnJYTqPHf1.ZBB.wfLYZfHX1Y5GYtGxPl9hpqMjAdLmvPC', 'Sqn Ldr Smith', 'instructor', 'smith@rafschool.example');
-- Note: Password is 'password123' hashed with bcrypt

