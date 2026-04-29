const express = require('express');
const router = express.Router();
const adminBlogController = require('../../controllers/admin/adminBlogController');

router.get('/pending', adminBlogController.getPendingBlogs);
router.get('/published', adminBlogController.getPublishedBlogs);
router.post('/manual', adminBlogController.createBlog);
router.post('/generate', adminBlogController.generateBlog);
router.post('/refine-title', adminBlogController.refineBlogTitle);
router.delete('/purge-pending', adminBlogController.purgePendingBlogs);
router.patch('/approve/:id', adminBlogController.approveBlog);
router.put('/:id', adminBlogController.updateBlog);
router.delete('/:id', adminBlogController.deleteBlog);

module.exports = router;
