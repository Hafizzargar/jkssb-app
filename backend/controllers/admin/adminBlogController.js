const Blog = require('../../models/Blog');
const { generateBlogs } = require('../../services/aiService');

/**
 * Get pending blogs for review
 * GET /api/admin/blog/pending
 */
exports.getPendingBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: false }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve and Publish Blog
 * PATCH /api/admin/blog/approve/:id
 */
exports.approveBlog = async (req, res) => {
  try {
    // Refresh expiry to the next 11:59 AM upon approval
    const now = new Date();
    const expiry = new Date();
    expiry.setHours(11, 59, 0, 0);
    if (now > expiry) expiry.setDate(expiry.getDate() + 1);

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isPublished: true, expiresAt: expiry },
      { new: true }
    );

    // Clear Cache
    const redisClient = req.app.get('getRedis')();
    if (redisClient) await redisClient.del('published_blogs');

    res.json({ message: 'Blog published successfully', data: blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Blog
 * DELETE /api/admin/blog/:id
 */
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);

    // Clear Cache
    const redisClient = req.app.get('getRedis')();
    if (redisClient) await redisClient.del('published_blogs');

    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all Published Blogs
 * GET /api/admin/blog/published
 */
exports.getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Blog (Edit Title, Content, Image)
 * PUT /api/admin/blog/:id
 */
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, image, category } = req.body;
    const blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      { title, content, image, category }, 
      { new: true }
    );
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create Manual Blog (Deletes after 1 hour or 11:59 AM)
 * POST /api/admin/blog/manual
 */
exports.createManualBlog = async (req, res) => {
  try {
    const { title, content, category, image } = req.body;
    
    // Set expiry to 11:59 AM IST
    const now = new Date();
    const expiry = new Date();
    expiry.setHours(11, 59, 0, 0);
    if (now > expiry) expiry.setDate(expiry.getDate() + 1);

    const blog = new Blog({
      title,
      content,
      category,
      image,
      isPublished: true,
      isAI: false,
      expiresAt: expiry
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Trigger AI Blog Generation manually
 * POST /api/admin/blog/generate
 */
exports.triggerGeneration = async (req, res) => {
  try {
    const blogs = await generateBlogs();
    
    // Set expiry to 11:59 AM IST
    const now = new Date();
    const expiry = new Date();
    expiry.setHours(11, 59, 0, 0);
    if (now > expiry) expiry.setDate(expiry.getDate() + 1);

    const blogDocs = blogs.map(b => ({ 
      ...b, 
      isPublished: false, 
      isAI: true,
      expiresAt: expiry 
    }));

    const saved = await Blog.insertMany(blogDocs);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * Refine Blog Title using AI
 * POST /api/admin/blog/refine-title
 */
exports.refineTitle = async (req, res) => {
  try {
    const { title, content } = req.body;
    const { refineTitle } = require('../../services/aiService');
    const newTitle = await refineTitle(title, content);
    res.json({ title: newTitle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
