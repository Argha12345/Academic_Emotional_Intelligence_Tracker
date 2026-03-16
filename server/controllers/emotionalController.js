const EmotionalRecord = require('../models/EmotionalRecord');

exports.getEmotionalRecords = async (req, res) => {
    try {
        const records = await EmotionalRecord.find({ studentId: req.params.studentId }).sort({ recordDate: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createEmotionalRecord = async (req, res) => {
    const studentId = req.body.studentId;
    const selfAwareness = Number(req.body.selfAwareness);
    const selfRegulation = Number(req.body.selfRegulation);
    const motivation = Number(req.body.motivation);
    const empathy = Number(req.body.empathy);
    const socialSkills = Number(req.body.socialSkills);
    const notes = req.body.notes || '';
    const overallScore = (selfAwareness + selfRegulation + motivation + empathy + socialSkills) / 5;

    try {
        const record = new EmotionalRecord({
            studentId, selfAwareness, selfRegulation, motivation, empathy, socialSkills, overallScore, notes
        });
        await record.save();
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateEmotionalRecord = async (req, res) => {
    const selfAwareness = Number(req.body.selfAwareness);
    const selfRegulation = Number(req.body.selfRegulation);
    const motivation = Number(req.body.motivation);
    const empathy = Number(req.body.empathy);
    const socialSkills = Number(req.body.socialSkills);
    const notes = req.body.notes || '';
    const overallScore = (selfAwareness + selfRegulation + motivation + empathy + socialSkills) / 5;

    try {
        const record = await EmotionalRecord.findByIdAndUpdate(
            req.params.id,
            { selfAwareness, selfRegulation, motivation, empathy, socialSkills, overallScore, notes },
            { new: true }
        );
        if (!record) return res.status(404).json({ error: 'Record not found' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteEmotionalRecord = async (req, res) => {
    try {
        const record = await EmotionalRecord.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Emotional record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
