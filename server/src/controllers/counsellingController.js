import CounsellingSession from '../models/CounsellingSession.js';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import EmotionalRecord from '../models/EmotionalRecord.js';

// Generate available slots for the next 7 days (excluding Sundays)
function generateAvailableSlots() {
    const slots = [];
    const timeSlots = [
        '09:00 AM - 10:00 AM',
        '10:00 AM - 11:00 AM',
        '11:00 AM - 12:00 PM',
        '02:00 PM - 03:00 PM',
        '03:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM'
    ];

    const today = new Date();
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (date.getDay() === 0) continue; // Skip Sundays

        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        for (const slot of timeSlots) {
            slots.push({ date: dateStr, dayName, slot });
        }
    }
    return slots;
}

// Check stress score for a student and return counselling recommendation
export const checkStressAndRecommend = async (req, res) => {
    const { studentId } = req.params;

    try {
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Calculate stress score (same logic as analyticsController)
        const academicData = await AcademicRecord.aggregate([
            { $match: { studentId } },
            { $group: {
                _id: null,
                avgGpa: { $avg: "$gpa" },
                avgAssignment: { $avg: "$assignmentScore" },
                avgAttendance: { $avg: "$attendancePercentage" },
                recordCount: { $sum: 1 }
            }}
        ]);

        const latestEmotional = await EmotionalRecord.findOne({ studentId }).sort({ recordDate: -1 });

        const emotionalData = await EmotionalRecord.aggregate([
            { $match: { studentId } },
            { $group: {
                _id: null,
                avgOverall: { $avg: "$overallScore" },
                avgSelfAwareness: { $avg: "$selfAwareness" },
                avgSelfRegulation: { $avg: "$selfRegulation" },
                avgMotivation: { $avg: "$motivation" },
                avgEmpathy: { $avg: "$empathy" },
                avgSocialSkills: { $avg: "$socialSkills" },
                recordCount: { $sum: 1 }
            }}
        ]);

        const academic = academicData[0] || { recordCount: 0 };
        const emotionalAvg = emotionalData[0] || { recordCount: 0 };

        const avgGpa = academic?.avgGpa || null;
        const avgOverall = emotionalAvg?.avgOverall || null;
        const hasAcademicData = (academic?.recordCount || 0) > 0 && avgGpa !== null;
        const hasEmotionalData = (emotionalAvg?.recordCount || 0) > 0 && avgOverall !== null;

        let stressScore = 0;

        if (hasAcademicData) {
            if (avgGpa < 4.0) stressScore += 40;
            else if (avgGpa < 6.0) stressScore += 25;
            else if (avgGpa < 7.5) stressScore += 10;
            if (academic.avgAttendance !== null && academic.avgAttendance < 60) stressScore += 10;
        }

        if (hasEmotionalData) {
            if (avgOverall < 3.5) stressScore += 40;
            else if (avgOverall < 5.5) stressScore += 25;
            else if (avgOverall < 7.0) stressScore += 10;
            if (emotionalAvg.avgMotivation !== null && emotionalAvg.avgMotivation < 4) stressScore += 8;
            if (emotionalAvg.avgSelfRegulation !== null && emotionalAvg.avgSelfRegulation < 4) stressScore += 8;
            if (emotionalAvg.avgSocialSkills !== null && emotionalAvg.avgSocialSkills < 4) stressScore += 5;
        }

        if (latestEmotional && latestEmotional.notes) {
            const notes = latestEmotional.notes.toLowerCase();
            const stressKeywords = ['stress', 'anxious', 'anxiety', 'depressed', 'sad', 'lonely', 'overwhelmed', 'pressure', 'burnout', 'exhausted', 'tired', 'failing', 'hopeless', 'worried', 'frustrated', 'angry', 'scared', 'nervous', 'panic'];
            const positiveKeywords = ['happy', 'confident', 'motivated', 'excited', 'calm', 'peaceful', 'grateful', 'optimistic', 'focused', 'energetic', 'positive'];
            const foundStress = stressKeywords.filter(kw => notes.includes(kw));
            const foundPositive = positiveKeywords.filter(kw => notes.includes(kw));
            if (foundStress.length >= 3) stressScore += 20;
            else if (foundStress.length >= 1) stressScore += 10;
            if (foundPositive.length > 0) stressScore = Math.max(0, stressScore - 5);
        }

        if (hasAcademicData && hasEmotionalData && avgGpa < 5.0 && avgOverall < 5.0) {
            stressScore += 10;
        }

        stressScore = Math.min(100, stressScore);

        // Check if student already has a pending/confirmed session
        const existingSession = await CounsellingSession.findOne({
            studentId,
            status: { $in: ['pending', 'confirmed'] }
        });

        const needsCounselling = stressScore > 70;

        // Always generate available slots (anyone can book)
        const availableSlots = generateAvailableSlots();

        // Filter out already-booked slots
        const bookedSessions = await CounsellingSession.find({
            status: { $in: ['pending', 'confirmed'] }
        });
        const bookedKeys = new Set(bookedSessions.map(s => `${s.date}_${s.slot}`));
        const filteredSlots = availableSlots.filter(s => !bookedKeys.has(`${s.date}_${s.slot}`));

        res.json({
            stressScore,
            needsCounselling,
            existingSession: existingSession || null,
            availableSlots: filteredSlots,
            studentName: student.name,
            studentEmail: student.email
        });

    } catch (err) {
        console.error('Counselling check error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Book a counselling session
export const bookSession = async (req, res) => {
    const { studentId, studentName, studentEmail, stressScore, date, slot, notes } = req.body;

    if (!studentId || !date || !slot) {
        return res.status(400).json({ error: 'Student ID, date, and slot are required' });
    }

    try {
        // Check if slot already taken
        const existing = await CounsellingSession.findOne({
            date, slot, status: { $in: ['pending', 'confirmed'] }
        });
        if (existing) {
            return res.status(409).json({ error: 'This slot is already booked. Please choose another.' });
        }

        // Check if student already has pending/confirmed session
        const studentSession = await CounsellingSession.findOne({
            studentId, status: { $in: ['pending', 'confirmed'] }
        });
        if (studentSession) {
            return res.status(409).json({ error: 'You already have a pending or confirmed counselling session.', existingSession: studentSession });
        }

        const session = new CounsellingSession({
            studentId,
            studentName: studentName || '',
            studentEmail: studentEmail || '',
            stressScore: stressScore || 0,
            date,
            slot,
            notes: notes || '',
            autoBooked: true,
            status: 'pending'
        });

        await session.save();
        res.status(201).json(session);
    } catch (err) {
        console.error('Book session error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Confirm a session
export const confirmSession = async (req, res) => {
    const { id } = req.params;
    try {
        const session = await CounsellingSession.findByIdAndUpdate(id, { status: 'confirmed' }, { new: true });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Cancel a session
export const cancelSession = async (req, res) => {
    const { id } = req.params;
    try {
        const session = await CounsellingSession.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all sessions for a student
export const getStudentSessions = async (req, res) => {
    const { studentId } = req.params;
    try {
        const sessions = await CounsellingSession.find({ studentId }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all sessions (admin view)
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await CounsellingSession.find().sort({ createdAt: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
