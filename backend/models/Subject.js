const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "General Knowledge"
  code: { type: String, required: true, unique: true }, // e.g. "GK"
  icon: { type: String, default: 'BookOpen' },
  isActive: { type: Boolean, default: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);
