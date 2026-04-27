const express = require('express');
const router = express.Router();
const adminSubjectController = require('../../controllers/admin/adminSubjectController');
const { adminOnly } = require('../../middleware/adminMiddleware');

router.use(adminOnly);

router.get('/', adminSubjectController.getAllSubjects);
router.post('/', adminSubjectController.createSubject);
router.put('/:id', adminSubjectController.updateSubject);
router.patch('/toggle/:id', adminSubjectController.toggleSubject);
router.delete('/:id', adminSubjectController.deleteSubject);

module.exports = router;
