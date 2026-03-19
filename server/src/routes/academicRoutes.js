import express from 'express';
const router = express.Router();
import * as academicController from '../controllers/academicController.js';

router.get('/:studentId', academicController.getAcademicRecords);
router.post('/', academicController.createAcademicRecord);
router.put('/:id', academicController.updateAcademicRecord);
router.delete('/:id', academicController.deleteAcademicRecord);

export default router;
