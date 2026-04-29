const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../../controllers/admin/adminStatsController');

// Assuming auth middleware exists if needed, but for now direct route
router.get('/', getDashboardStats);

module.exports = router;
