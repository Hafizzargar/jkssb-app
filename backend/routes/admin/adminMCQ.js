const express = require('express');
const router = express.Router();
const adminMCQController = require('../../controllers/admin/adminMCQController');
const { adminOnly } = require('../../middleware/adminMiddleware');

// All routes require admin authentication
router.use(adminOnly);

router.get('/pending', adminMCQController.getPendingMCQs);
router.get('/active', adminMCQController.getActiveMCQs);
router.post('/generate', adminMCQController.triggerGeneration);
router.post('/manual', adminMCQController.createManualMCQ);
router.patch('/approve/:id', adminMCQController.approveMCQ);
router.patch('/reject/:id', adminMCQController.rejectMCQ);
router.delete('/:id', adminMCQController.deleteMCQ);

module.exports = router;
