const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/analytics/:studentId', analyticsController.getStudentAnalytics);
router.get('/feedback/:studentId', analyticsController.getStressFeedback);

module.exports = router;
