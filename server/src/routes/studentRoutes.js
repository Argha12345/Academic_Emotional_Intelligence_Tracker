import express from 'express';
const router = express.Router();
import * as studentController from '../controllers/studentController.js';

router.get('/', studentController.getAllStudents);
router.get('/email/:email', studentController.getStudentByEmail);
router.get('/:id', studentController.getStudentById);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.patch('/:id/mentor', studentController.updateMentorName);
router.delete('/:id', studentController.deleteStudent);

export default router;
