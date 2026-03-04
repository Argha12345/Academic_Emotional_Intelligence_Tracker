const db = require('../config/db');
const { createStudentAccount } = require('./authController');

exports.getAllStudents = (req, res) => {
    db.all('SELECT * FROM students ORDER BY createdAt DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
};

exports.getStudentById = (req, res) => {
    db.get('SELECT * FROM students WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(row);
        }
    });
};

exports.getStudentByEmail = (req, res) => {
    db.get('SELECT * FROM students WHERE email = ?', [req.params.email], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Student not found' });
        } else {
            res.json(row);
        }
    });
};

exports.createStudent = async (req, res) => {
    const { name, email, rollNumber, department, mentorName } = req.body;

    if (!name || !email || !rollNumber) {
        return res.status(400).json({ error: 'Name, email, and roll number are required' });
    }

    if (!email.toLowerCase().endsWith('@bitsathy.ac.in')) {
        return res.status(400).json({ error: 'Only @bitsathy.ac.in email addresses are allowed' });
    }

    db.run(
        'INSERT INTO students (name, email, rollNumber, department, mentorName) VALUES (?, ?, ?, ?, ?)',
        [name, email.toLowerCase(), rollNumber, department, mentorName || ''],
        async function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const newStudent = { id: this.lastID, name, email: email.toLowerCase(), rollNumber, department, mentorName: mentorName || '' };
            // Auto-create login account with default password 'bitsathy1'
            try {
                await createStudentAccount(name, email);
            } catch (accountErr) {
                console.warn('User account may already exist:', accountErr.message);
            }
            res.json(newStudent);
        }
    );
};


exports.updateStudent = (req, res) => {
    const { name, email, rollNumber, department, mentorName } = req.body;
    db.run(
        'UPDATE students SET name = ?, email = ?, rollNumber = ?, department = ?, mentorName = ? WHERE id = ?',
        [name, email, rollNumber, department, mentorName || '', req.params.id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: req.params.id, name, email, rollNumber, department, mentorName: mentorName || '' });
            }
        }
    );
};

// Admin only: update mentor name
exports.updateMentorName = (req, res) => {
    const { mentorName } = req.body;
    db.run(
        'UPDATE students SET mentorName = ? WHERE id = ?',
        [mentorName || '', req.params.id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: req.params.id, mentorName: mentorName || '' });
            }
        }
    );
};

exports.deleteStudent = (req, res) => {
    db.run('DELETE FROM students WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Student deleted' });
        }
    });
};
