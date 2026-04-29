const express = require('express');
const router = express.Router();
const adminPatternController = require('../../controllers/admin/adminPatternController');

router.get('/', adminPatternController.getAllPatterns);
router.post('/', adminPatternController.createPattern);
router.put('/:id', adminPatternController.updatePattern);
router.delete('/:id', adminPatternController.deletePattern);

module.exports = router;
