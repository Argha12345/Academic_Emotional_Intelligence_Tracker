import express from 'express';
const router = express.Router();
import * as emotionalController from '../controllers/emotionalController.js';

router.get('/:studentId', emotionalController.getEmotionalRecords);
router.post('/', emotionalController.createEmotionalRecord);
router.put('/:id', emotionalController.updateEmotionalRecord);
router.delete('/:id', emotionalController.deleteEmotionalRecord);

export default router;
