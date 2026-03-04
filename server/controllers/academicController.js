const db = require('../config/db');

exports.getAcademicRecords = (req, res) => {
    db.all(
        'SELECT * FROM academic_records WHERE studentId = ? ORDER BY recordDate DESC',
        [req.params.studentId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(rows);
            }
        }
    );
};

exports.createAcademicRecord = (req, res) => {
    const { studentId, semester, gpa, assignmentScore, attendancePercentage } = req.body;
    db.run(
        'INSERT INTO academic_records (studentId, semester, gpa, assignmentScore, attendancePercentage) VALUES (?, ?, ?, ?, ?)',
        [studentId, semester, gpa, assignmentScore, attendancePercentage],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({
                    id: this.lastID,
                    studentId,
                    semester,
                    gpa,
                    assignmentScore: assignmentScore ?? null,
                    attendancePercentage: attendancePercentage ?? null,
                    recordDate: new Date().toISOString()
                });
            }
        }
    );
};

exports.updateAcademicRecord = (req, res) => {
    const semester = req.body.semester;
    const gpa = parseFloat(req.body.gpa);
    const assignmentScore = req.body.assignmentScore != null ? parseFloat(req.body.assignmentScore) : null;
    const attendancePercentage = req.body.attendancePercentage != null ? parseFloat(req.body.attendancePercentage) : null;
    db.run(
        'UPDATE academic_records SET semester = ?, gpa = ?, assignmentScore = ?, attendancePercentage = ? WHERE id = ?',
        [semester, gpa, assignmentScore, attendancePercentage, req.params.id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({
                    id: Number(req.params.id),
                    semester,
                    gpa,
                    assignmentScore,
                    attendancePercentage
                });
            }
        }
    );
};

exports.deleteAcademicRecord = (req, res) => {
    db.run('DELETE FROM academic_records WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Academic record deleted' });
        }
    });
};
