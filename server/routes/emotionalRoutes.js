const express = require('express');
const router = express.Router();
const emotionalController = require('../controllers/emotionalController');

router.get('/:studentId', emotionalController.getEmotionalRecords);
router.post('/', emotionalController.createEmotionalRecord);
router.put('/:id', emotionalController.updateEmotionalRecord);
router.delete('/:id', emotionalController.deleteEmotionalRecord);

module.exports = router;
