const Blog = require('../../models/Blog');

// Create Blog
exports.createBlog = async (req, res) => {
  try {
    const blog = new Blog(req.body);
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Pending Blogs
exports.getPendingBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: false }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Published Blogs (Admin View)
exports.getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Publish Blog
exports.approveBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      { isPublished: true }, 
      { new: true }
    );
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update Blog
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Blog
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Purge all pending blogs
exports.purgePendingBlogs = async (req, res) => {
  try {
    await Blog.deleteMany({ isPublished: false });
    res.json({ message: 'All pending blogs deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const aiService = require('../../services/aiService');

// Mock AI Generation (Now using real Gemini!)
exports.generateBlog = async (req, res) => {
  try {
    const subject = req.body?.subject || 'JKSSB';
    const aiBlogs = await aiService.generateBlogs(subject);
    
    if (!aiBlogs || aiBlogs.length === 0) {
      return res.status(500).json({ message: 'AI generation failed' });
    }

    // Save all generated blogs as pending
    const savedBlogs = [];
    for (const blogData of aiBlogs) {
      const blog = new Blog({
        ...blogData,
        isAI: true,
        isPublished: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      await blog.save();
      savedBlogs.push(blog);
    }

    res.status(201).json({ message: `Successfully generated ${savedBlogs.length} news items`, blogs: savedBlogs });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.refineBlogTitle = async (req, res) => {
  try {
    const { title, content } = req.body;
    const refined = await aiService.refineTitle(title, content);
    res.json({ title: refined });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
