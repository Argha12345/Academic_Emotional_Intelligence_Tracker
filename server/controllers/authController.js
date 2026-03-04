const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = 'academic_ei_tracker_secret_key_2026';
const ALLOWED_DOMAIN = '@bitsathy.ac.in';
const DEFAULT_PASSWORD = 'bitsathy1';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Student Login (email + password, email must end with @bitsathy.ac.in)
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
        return res.status(400).json({ error: `Only ${ALLOWED_DOMAIN} email addresses are allowed` });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!user) {
            return res.status(401).json({ error: 'Account not found. Please contact your administrator.' });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.name, role: 'student' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                token,
                user: { id: user.id, name: user.name, email: user.email, role: 'student' }
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error during login' });
        }
    });
};

// Admin Login
exports.adminLogin = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign(
            { id: 0, email: 'admin@system', name: 'Admin', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.json({
            token,
            user: { id: 0, name: 'Admin', email: 'admin@system', role: 'admin' }
        });
    }

    return res.status(401).json({ error: 'Invalid admin credentials' });
};

// Verify Token
exports.verify = (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role === 'admin') {
            return res.json({ user: { id: 0, name: 'Admin', email: 'admin@system', role: 'admin' } });
        }

        db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
            if (err || !user) return res.status(401).json({ error: 'Invalid token' });
            res.json({ user: { ...user, role: 'student' } });
        });
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

    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        try {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ? WHERE email = ?', [hashed, email.toLowerCase()], function (err2) {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ message: 'Password changed successfully' });
            });
        } catch (e) {
            res.status(500).json({ error: 'Server error' });
        }
    });
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
        db.run('UPDATE users SET password = ? WHERE email = ?', [hashed, email.toLowerCase()], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Student account not found' });
            res.json({ message: 'Password reset successfully' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Internal: Create user account (called when admin adds a student)
exports.createStudentAccount = async (name, email) => {
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email.toLowerCase(), hashed, 'student'],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
};
