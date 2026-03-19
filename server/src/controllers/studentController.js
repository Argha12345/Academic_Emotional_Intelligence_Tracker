import Student from '../models/Student.js';
import { createStudentAccount } from './authController.js';

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getStudentByEmail = async (req, res) => {
    try {
        const student = await Student.findOne({ email: req.params.email });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createStudent = async (req, res) => {
    const { name, email, rollNumber, department, mentorName } = req.body;

    if (!name || !email || !rollNumber) {
        return res.status(400).json({ error: 'Name, email, and roll number are required' });
    }

    if (!email.toLowerCase().endsWith('@bitsathy.ac.in')) {
        return res.status(400).json({ error: 'Only @bitsathy.ac.in email addresses are allowed' });
    }

    try {
        const newStudent = new Student({
            name,
            email: email.toLowerCase(),
            rollNumber,
            department,
            mentorName: mentorName || ''
        });
        await newStudent.save();

        // Auto-create login account with default password 'bitsathy1'
        try {
            await createStudentAccount(name, email);
        } catch (accountErr) {
            console.warn('User account may already exist:', accountErr.message);
        }
        res.json(newStudent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateStudent = async (req, res) => {
    const { name, email, rollNumber, department, mentorName } = req.body;
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { name, email: email.toLowerCase(), rollNumber, department, mentorName: mentorName || '' },
            { new: true }
        );
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin only: update mentor name
export const updateMentorName = async (req, res) => {
    const { mentorName } = req.body;
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { mentorName: mentorName || '' },
            { new: true }
        );
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json({ id: student.id, mentorName: student.mentorName });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
