import express from 'express';
const router = express.Router();
import * as counsellingController from '../controllers/counsellingController.js';

// Check stress & get recommendation + available slots
router.get('/check/:studentId', counsellingController.checkStressAndRecommend);

// Book a session
router.post('/book', counsellingController.bookSession);

// Confirm a session
router.patch('/confirm/:id', counsellingController.confirmSession);

// Cancel a session
router.patch('/cancel/:id', counsellingController.cancelSession);

// Get all sessions for a student
router.get('/student/:studentId', counsellingController.getStudentSessions);

// Get all sessions (admin)
router.get('/all', counsellingController.getAllSessions);

export default router;
