const express = require('express');
const router = express.Router();
const configController = require('../../controllers/admin/configController');
const { adminOnly } = require('../../middleware/adminMiddleware');

router.get('/', configController.getConfig);
router.put('/', adminOnly, configController.updateConfig);

module.exports = router;
