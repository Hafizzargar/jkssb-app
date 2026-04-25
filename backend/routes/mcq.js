const express = require('express');
const router = express.Router();
const mcqController = require('../controllers/mcqController');

router.get('/daily', mcqController.getTodaysMCQs);
router.post('/submit', mcqController.submitMCQs);
router.get('/results', mcqController.getResults);

module.exports = router;
