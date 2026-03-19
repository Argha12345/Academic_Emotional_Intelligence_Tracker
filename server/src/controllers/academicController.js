import AcademicRecord from '../models/AcademicRecord.js';

export const getAcademicRecords = async (req, res) => {
    try {
        const records = await AcademicRecord.find({ studentId: req.params.studentId }).sort({ recordDate: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createAcademicRecord = async (req, res) => {
    const { studentId, semester, gpa, assignmentScore, attendancePercentage } = req.body;
    try {
        const record = new AcademicRecord({
            studentId,
            semester,
            gpa,
            assignmentScore: assignmentScore ?? null,
            attendancePercentage: attendancePercentage ?? null
        });
        await record.save();
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateAcademicRecord = async (req, res) => {
    const semester = req.body.semester;
    const gpa = parseFloat(req.body.gpa);
    const assignmentScore = req.body.assignmentScore != null ? parseFloat(req.body.assignmentScore) : null;
    const attendancePercentage = req.body.attendancePercentage != null ? parseFloat(req.body.attendancePercentage) : null;
    
    try {
        const record = await AcademicRecord.findByIdAndUpdate(
            req.params.id,
            { semester, gpa, assignmentScore, attendancePercentage },
            { new: true }
        );
        if (!record) return res.status(404).json({ error: 'Record not found' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteAcademicRecord = async (req, res) => {
    try {
        const record = await AcademicRecord.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Academic record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
