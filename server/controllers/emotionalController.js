const db = require('../config/db');

exports.getEmotionalRecords = (req, res) => {
    db.all(
        'SELECT * FROM emotional_records WHERE studentId = ? ORDER BY recordDate DESC',
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

exports.createEmotionalRecord = (req, res) => {
    const studentId = req.body.studentId;
    const selfAwareness = Number(req.body.selfAwareness);
    const selfRegulation = Number(req.body.selfRegulation);
    const motivation = Number(req.body.motivation);
    const empathy = Number(req.body.empathy);
    const socialSkills = Number(req.body.socialSkills);
    const notes = req.body.notes || '';
    const overallScore = (selfAwareness + selfRegulation + motivation + empathy + socialSkills) / 5;
    const recordDate = new Date().toISOString();

    db.run(
        'INSERT INTO emotional_records (studentId, selfAwareness, selfRegulation, motivation, empathy, socialSkills, overallScore, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [studentId, selfAwareness, selfRegulation, motivation, empathy, socialSkills, overallScore, notes],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({
                    id: this.lastID,
                    studentId,
                    selfAwareness, selfRegulation, motivation, empathy, socialSkills,
                    overallScore,
                    notes,
                    recordDate
                });
            }
        }
    );
};

exports.updateEmotionalRecord = (req, res) => {
    const selfAwareness = Number(req.body.selfAwareness);
    const selfRegulation = Number(req.body.selfRegulation);
    const motivation = Number(req.body.motivation);
    const empathy = Number(req.body.empathy);
    const socialSkills = Number(req.body.socialSkills);
    const notes = req.body.notes || '';
    const overallScore = (selfAwareness + selfRegulation + motivation + empathy + socialSkills) / 5;

    db.run(
        'UPDATE emotional_records SET selfAwareness = ?, selfRegulation = ?, motivation = ?, empathy = ?, socialSkills = ?, overallScore = ?, notes = ? WHERE id = ?',
        [selfAwareness, selfRegulation, motivation, empathy, socialSkills, overallScore, notes, req.params.id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({
                    id: Number(req.params.id),
                    selfAwareness, selfRegulation, motivation, empathy, socialSkills,
                    overallScore,
                    notes
                });
            }
        }
    );
};

exports.deleteEmotionalRecord = (req, res) => {
    db.run('DELETE FROM emotional_records WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Emotional record deleted' });
        }
    });
};
