const express = require('express');
const router = express.Router();
const mcqController = require('../controllers/mcqController');

router.get('/daily', mcqController.getTodaysMCQs);
router.post('/submit', mcqController.submitMCQs);
router.get('/results', mcqController.getResults);
router.get('/all', mcqController.getAllStudentMCQs);
router.get('/leaderboard/:missionId', mcqController.getLeaderboard);

module.exports = router;
