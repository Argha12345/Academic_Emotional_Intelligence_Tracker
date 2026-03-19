import express from 'express';
const router = express.Router();
import * as mentorController from '../controllers/mentorController.js';

// Mentor auth
router.post('/login', mentorController.mentorLogin);
router.post('/change-password', mentorController.changePassword);

// Admin CRUD
router.get('/', mentorController.getAllMentors);
router.post('/', mentorController.createMentor);
router.delete('/:id', mentorController.deleteMentor);
router.post('/reset-password', mentorController.resetMentorPassword);

// Mentor - get assigned students
router.get('/students/:mentorName', mentorController.getAssignedStudents);

// Feedback
router.get('/feedback/:studentId', mentorController.getFeedback);
router.post('/feedback', mentorController.addFeedback);
router.delete('/feedback/:id', mentorController.deleteFeedback);

export default router;
