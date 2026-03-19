import express from 'express';
const router = express.Router();
import * as analyticsController from '../controllers/analyticsController.js';

router.get('/analytics/:studentId', analyticsController.getStudentAnalytics);
router.get('/feedback/:studentId', analyticsController.getStressFeedback);

export default router;
