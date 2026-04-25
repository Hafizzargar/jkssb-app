const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  content:    { type: String, required: true },
  category:   { type: String, enum: ['J&K', 'INDIA', 'WORLD', 'OFFICIAL'], default: 'J&K' },
  image:      String,
  author:     { type: String, default: 'PrepMaster AI' },
  isPublished: { type: Boolean, default: false },
  isAI:       { type: Boolean, default: false },
  expiresAt:  { type: Date }, // For TTL deletion
  createdAt:  { type: Date, default: Date.now },
});

// TTL Index: Deletes document when expiresAt is reached
blogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Blog', blogSchema);
