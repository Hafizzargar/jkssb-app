const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

/**
 * Get all published blogs
 * GET /api/blogs
 */
router.get('/', async (req, res) => {
  try {
    const redisClient = req.app.get('getRedis')();
    const cacheKey = 'published_blogs';

    // 1. Check Cache
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('🚀 Redis: Serving Cached Blogs');
        return res.json(JSON.parse(cached));
      }
    }

    const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
    
    // 2. Save to Cache (1 hour)
    if (redisClient) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(blogs));
    }

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
