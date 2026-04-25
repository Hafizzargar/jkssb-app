const cron = require('node-cron');
const { generateBlogs } = require('../services/aiService');
const Blog = require('../models/Blog');

// Daily at 6:00 AM (After MCQs)
cron.schedule('0 6 * * *', async () => {
  console.log('⏰ CRON: Refreshing AI Blogs...');

  try {
    // 1. Delete all UNAPPROVED AI blogs to make room for fresh ones every hour
    await Blog.deleteMany({ isAI: true, isPublished: false });

    // 2. Generate fresh AI blogs
    console.log('♊ Gemini: Fetching fresh news for this hour...');
    const blogs = await generateBlogs();

    if (blogs && blogs.length > 0) {
      // Set expiry to 11:59 AM IST
      const now = new Date();
      const expiry = new Date();
      expiry.setHours(11, 59, 0, 0);
      if (now > expiry) expiry.setDate(expiry.getDate() + 1);

      const blogDocs = blogs.map(b => ({
        ...b,
        isPublished: false,
        isAI: true,
        author: 'PrepMaster AI',
        expiresAt: expiry
      }));

      await Blog.insertMany(blogDocs);
      console.log(`✅ CRON: Fresh Hourly AI Blogs saved as PENDING`);
    }
  } catch (error) {
    console.error('❌ CRON: Blog Refresh failed:', error);
  }
});
