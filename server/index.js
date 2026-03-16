const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const academicRoutes = require('./routes/academicRoutes');
const emotionalRoutes = require('./routes/emotionalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const mlRoutes = require('./routes/mlRoutes');
const authController = require('./controllers/authController');
const connectDB = require('./config/db');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Auth routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/admin-login', authController.adminLogin);
app.get('/api/auth/verify', authController.verify);
app.post('/api/auth/change-password', authController.changePassword);
app.post('/api/auth/admin-change-password', authController.adminChangePassword);

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/emotional', emotionalRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
