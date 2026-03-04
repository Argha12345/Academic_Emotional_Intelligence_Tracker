const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/', studentController.getAllStudents);
router.get('/email/:email', studentController.getStudentByEmail);
router.get('/:id', studentController.getStudentById);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.patch('/:id/mentor', studentController.updateMentorName);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
