const express = require('express');
const router = express.Router();
const adminBlogController = require('../../controllers/admin/adminBlogController');
const { adminOnly } = require('../../middleware/adminMiddleware');

router.use(adminOnly);

router.get('/pending', adminBlogController.getPendingBlogs);
router.get('/published', adminBlogController.getPublishedBlogs);
router.post('/generate', adminBlogController.triggerGeneration);
router.post('/manual', adminBlogController.createManualBlog);
router.post('/refine-title', adminBlogController.refineTitle);
router.patch('/approve/:id', adminBlogController.approveBlog);
router.put('/:id', adminBlogController.updateBlog);
router.delete('/:id', adminBlogController.deleteBlog);

module.exports = router;
