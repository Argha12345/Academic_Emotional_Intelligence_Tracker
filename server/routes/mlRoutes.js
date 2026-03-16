const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');

// ML Academic Insights
router.get('/insights/:studentId', mlController.getAcademicInsights);

// Mentor Stress Alerts — returns high-risk students for a given mentor
router.get('/stress-alerts/:mentorName', mlController.getMentorStressAlerts);

module.exports = router;
