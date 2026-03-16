const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const MentorFeedback = require('../models/MentorFeedback');

const JWT_SECRET = 'academic_ei_tracker_secret_key_2026';
const DEFAULT_MENTOR_PASSWORD = 'mentor123';

// Mentor Login
exports.mentorLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const mentor = await Mentor.findOne({ email: email.toLowerCase() });
        if (!mentor) return res.status(401).json({ error: 'Mentor account not found. Please contact your administrator.' });

        const isMatch = await bcrypt.compare(password, mentor.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { id: mentor.id, email: mentor.email, name: mentor.name, role: 'mentor' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: mentor.id, name: mentor.name, email: mentor.email, role: 'mentor' }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Get all mentors (admin only)
exports.getAllMentors = async (req, res) => {
    try {
        const mentors = await Mentor.find().select('id name email department createdAt').sort({ createdAt: -1 });
        res.json(mentors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a mentor (admin only)
exports.createMentor = async (req, res) => {
    const { name, email, department } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        const hashed = await bcrypt.hash(DEFAULT_MENTOR_PASSWORD, 10);
        const mentor = new Mentor({
            name,
            email: email.toLowerCase(),
            password: hashed,
            department: department || ''
        });
        await mentor.save();
        res.json({
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
            department: mentor.department,
            createdAt: mentor.createdAt
        });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({ error: 'A mentor with this email already exists' });
        }
        res.status(500).json({ error: 'Server error creating mentor' });
    }
};

// Delete a mentor (admin only)
exports.deleteMentor = async (req, res) => {
    try {
        const mentor = await Mentor.findByIdAndDelete(req.params.id);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
        res.json({ message: 'Mentor deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reset mentor password (admin only)
exports.resetMentorPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const hashed = await bcrypt.hash(newPassword, 10);
        const mentor = await Mentor.findOneAndUpdate({ email: email.toLowerCase() }, { password: hashed });
        if (!mentor) return res.status(404).json({ error: 'Mentor account not found' });
        res.json({ message: 'Mentor password reset successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get students assigned to a mentor (by mentor name match)
exports.getAssignedStudents = async (req, res) => {
    const mentorName = req.params.mentorName;
    try {
        // Find using case-insensitive regex
        const students = await Student.find({ mentorName: { $regex: new RegExp('^' + mentorName + '$', 'i') } }).sort({ name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mentor changes own password
exports.changePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Email, current password, and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    try {
        const mentor = await Mentor.findOne({ email: email.toLowerCase() });
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

        const isMatch = await bcrypt.compare(currentPassword, mentor.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

        const hashed = await bcrypt.hash(newPassword, 10);
        mentor.password = hashed;
        await mentor.save();
        res.json({ message: 'Password changed successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ===== Mentor Feedback =====

// Get feedback for a student
exports.getFeedback = async (req, res) => {
    try {
        const feedbacks = await MentorFeedback.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add feedback for a student
exports.addFeedback = async (req, res) => {
    const { studentId, mentorName, feedback } = req.body;

    if (!studentId || !mentorName || !feedback) {
        return res.status(400).json({ error: 'studentId, mentorName, and feedback are required' });
    }

    try {
        const newFeedback = new MentorFeedback({
            studentId,
            mentorName,
            feedback: feedback.trim()
        });
        await newFeedback.save();
        res.json(newFeedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a feedback entry
exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await MentorFeedback.findByIdAndDelete(req.params.id);
        if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
        res.json({ message: 'Feedback deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
