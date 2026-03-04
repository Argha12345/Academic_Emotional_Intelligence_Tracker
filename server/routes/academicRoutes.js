const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');

router.get('/:studentId', academicController.getAcademicRecords);
router.post('/', academicController.createAcademicRecord);
router.put('/:id', academicController.updateAcademicRecord);
router.delete('/:id', academicController.deleteAcademicRecord);

module.exports = router;
