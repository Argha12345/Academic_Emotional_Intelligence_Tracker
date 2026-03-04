const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 5000;

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ================= DATABASE ================= */

const dbPath = path.join(__dirname, 'tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

/* ================= INITIALIZE TABLES ================= */

function initializeDatabase() {
  db.serialize(() => {

    // Students
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        rollNumber TEXT NOT NULL,
        department TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Academic Records
    db.run(`
      CREATE TABLE IF NOT EXISTS academic_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        subject TEXT NOT NULL,
        gpa REAL NOT NULL,
        assignmentScore REAL,
        attendancePercentage REAL,
        recordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )
    `);

    // Emotional Records
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

    // Support Messages
    db.run(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id)
      )
    `);
  });
}

/* ================= STUDENT ROUTES ================= */

app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/students', (req, res) => {
  const { name, email, rollNumber, department } = req.body;

  if (!name || !email || !rollNumber) {
    return res.status(400).json({ error: 'Name, Email and Roll Number are required' });
  }

  db.run(
    'INSERT INTO students (name, email, rollNumber, department) VALUES (?, ?, ?, ?)',
    [name, email, rollNumber, department],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, email, rollNumber, department });
    }
  );
});

/* ================= ACADEMIC ROUTES ================= */

app.get('/api/academic/:studentId', (req, res) => {
  db.all(
    'SELECT * FROM academic_records WHERE studentId = ? ORDER BY recordDate DESC',
    [req.params.studentId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/academic', (req, res) => {
  const { studentId, subject, gpa, assignmentScore, attendancePercentage } = req.body;

  if (!studentId || !subject) {
    return res.status(400).json({ error: 'Student ID and subject are required' });
  }

  if (typeof gpa !== 'number' || gpa < 0 || gpa > 10) {
    return res.status(400).json({ error: 'CGPA must be between 0 and 10' });
  }

  db.run(
    `INSERT INTO academic_records 
     (studentId, subject, gpa, assignmentScore, attendancePercentage)
     VALUES (?, ?, ?, ?, ?)`,
    [studentId, subject, gpa, assignmentScore || null, attendancePercentage || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        studentId,
        subject,
        gpa,
        assignmentScore,
        attendancePercentage
      });
    }
  );
});

app.delete('/api/academic/:id', (req, res) => {
  db.run('DELETE FROM academic_records WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Academic record deleted' });
  });
});

/* ================= EMOTIONAL ROUTES ================= */

app.get('/api/emotional/:studentId', (req, res) => {
  db.all(
    'SELECT * FROM emotional_records WHERE studentId = ? ORDER BY recordDate DESC',
    [req.params.studentId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/emotional', (req, res) => {
  const {
    studentId,
    selfAwareness,
    selfRegulation,
    motivation,
    empathy,
    socialSkills,
    notes
  } = req.body;

  const scores = [selfAwareness, selfRegulation, motivation, empathy, socialSkills];

  if (!studentId || scores.some(s => typeof s !== 'number')) {
    return res.status(400).json({ error: 'All EI scores and studentId are required' });
  }

  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  db.run(
    `INSERT INTO emotional_records
     (studentId, selfAwareness, selfRegulation, motivation, empathy, socialSkills, overallScore, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [studentId, ...scores, overallScore, notes || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, overallScore });
    }
  );
});

/* ================= SUPPORT ROUTES ================= */

app.post('/api/support', (req, res) => {
  const { studentId, subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  db.run(
    'INSERT INTO support_messages (studentId, subject, message) VALUES (?, ?, ?)',
    [studentId || null, subject, message],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, studentId: studentId || null, subject, message });
    }
  );
});

app.get('/api/support/:studentId', (req, res) => {
  db.all(
    'SELECT * FROM support_messages WHERE studentId = ? ORDER BY createdAt DESC',
    [req.params.studentId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ================= SERVER ================= */

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
