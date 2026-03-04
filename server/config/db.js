const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../tracker.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students table (added mentorName column)
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        rollNumber TEXT NOT NULL,
        department TEXT,
        mentorName TEXT DEFAULT '',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add mentorName column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE students ADD COLUMN mentorName TEXT DEFAULT ''`, (err) => {
      // Ignore error if column already exists
    });

    // Academic records table (changed subject to semester)
    db.run(`
      CREATE TABLE IF NOT EXISTS academic_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        semester TEXT NOT NULL,
        gpa REAL NOT NULL,
        assignmentScore REAL,
        attendancePercentage REAL,
        recordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )
    `);

    // Add semester column if migrating from subject
    db.run(`ALTER TABLE academic_records ADD COLUMN semester TEXT DEFAULT ''`, (err) => {
      // Ignore error if column already exists
      // Copy subject data to semester if subject column exists
      if (!err) {
        db.run(`UPDATE academic_records SET semester = subject WHERE semester = '' AND subject IS NOT NULL`, () => { });
      }
    });

    // Emotional intelligence records table
    db.run(`
      CREATE TABLE IF NOT EXISTS emotional_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        selfAwareness INTEGER,
        selfRegulation INTEGER,
        motivation INTEGER,
        empathy INTEGER,
        socialSkills INTEGER,
        overallScore REAL,
        notes TEXT,
        recordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )
    `);
  });
}

module.exports = db;
