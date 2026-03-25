import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url for es modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import studentRoutes from './routes/studentRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import emotionalRoutes from './routes/emotionalRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import counsellingRoutes from './routes/counsellingRoutes.js';
import * as authController from './controllers/authController.js';
import connectDB from './config/db.js';

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
app.post('/auth/login', authController.login);

app.post('/api/auth/admin-login', authController.adminLogin);
app.post('/auth/admin-login', authController.adminLogin);

app.get('/api/auth/verify', authController.verify);
app.get('/auth/verify', authController.verify);

app.post('/api/auth/change-password', authController.changePassword);
app.post('/auth/change-password', authController.changePassword);

app.post('/api/auth/admin-change-password', authController.adminChangePassword);
app.post('/auth/admin-change-password', authController.adminChangePassword);

app.get('/api/auth/profile', authController.getProfile);
app.get('/auth/profile', authController.getProfile);

app.post('/api/auth/admin-change-own-password', authController.adminChangeOwnPassword);
app.post('/auth/admin-change-own-password', authController.adminChangeOwnPassword);

// API routes
app.use('/api/students', studentRoutes);
app.use('/students', studentRoutes);

app.use('/api/academic', academicRoutes);
app.use('/academic', academicRoutes);

app.use('/api/emotional', emotionalRoutes);
app.use('/emotional', emotionalRoutes);

app.use('/api', analyticsRoutes);
app.use('/', analyticsRoutes);

app.use('/api/mentors', mentorRoutes);
app.use('/mentors', mentorRoutes);

app.use('/api/ml', mlRoutes);
app.use('/ml', mlRoutes);

app.use('/api/counselling', counsellingRoutes);
app.use('/counselling', counsellingRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Serve frontend in production (adjust path to your dist folder)
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
