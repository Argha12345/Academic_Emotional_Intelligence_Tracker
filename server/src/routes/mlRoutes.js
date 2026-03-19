import express from 'express';
const router = express.Router();
import * as mlController from '../controllers/mlController.js';

// ML Academic Insights
router.get('/insights/:studentId', mlController.getAcademicInsights);

// Mentor Stress Alerts - returns high-risk students for a given mentor
router.get('/stress-alerts/:mentorName', mlController.getMentorStressAlerts);

export default router;
