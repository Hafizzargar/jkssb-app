const express = require('express');
const router = express.Router();
const configController = require('../controllers/admin/configController');

// Public route to check app version
router.get('/version', configController.getConfig);

module.exports = router;
