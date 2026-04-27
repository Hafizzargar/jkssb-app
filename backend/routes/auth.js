const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/check', authController.checkAuth);
router.post('/logout', authController.logout);

// Admin Routes
router.get('/pending-users', adminOnly, authController.getPendingUsers);
router.post('/approve-user', adminOnly, authController.approveUser);
router.delete('/disable-user/:userId', adminOnly, authController.disableUser);

module.exports = router;
