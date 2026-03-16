const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Mentor = require('../models/Mentor');

const JWT_SECRET = 'academic_ei_tracker_secret_key_2026';
const ALLOWED_DOMAIN = '@bitsathy.ac.in';
const DEFAULT_PASSWORD = 'bitsathy1';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Student Login (email + password, email must end with @bitsathy.ac.in)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
        return res.status(400).json({ error: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Account not found. Please contact your administrator.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role || 'student' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role || 'student' }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Admin Login
exports.adminLogin = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign(
            { id: '0', email: 'admin@system', name: 'Admin', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.json({
            token,
            user: { id: '0', name: 'Admin', email: 'admin@system', role: 'admin' }
        });
    }

    return res.status(401).json({ error: 'Invalid admin credentials' });
};

// Verify Token
exports.verify = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role === 'admin') {
            return res.json({ user: { id: '0', name: 'Admin', email: 'admin@system', role: 'admin' } });
        }

        if (decoded.role === 'mentor') {
            const mentor = await Mentor.findById(decoded.id);
            if (!mentor) return res.status(401).json({ error: 'Invalid token' });
            return res.json({ user: { id: mentor.id, name: mentor.name, email: mentor.email, department: mentor.department, role: 'mentor' } });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'student' } });

    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Student: Change Own Password
exports.changePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Email, current password, and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin: Reset Any Student's Password
exports.adminChangePassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const hashed = await bcrypt.hash(newPassword, 10);
        const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { password: hashed });
        if (!user) return res.status(404).json({ error: 'Student account not found' });
        res.json({ message: 'Password reset successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Internal: Create user account (called when admin adds a student)
exports.createStudentAccount = async (name, email) => {
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return existing.id;
        
        const user = new User({
            name,
            email: email.toLowerCase(),
            password: hashed,
            role: 'student'
        });
        await user.save();
        return user.id;
    } catch (err) {
        throw err;
    }
};
