const mongoose = require('mongoose');

const examPatternSchema = new mongoose.Schema({
  label: { type: String, required: true },
  total: { type: Number, required: true },
  duration: { type: Number, default: 180 }, // in minutes
  sections: [{
    name: { type: String, required: true },
    count: { type: Number, required: true }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamPattern', examPatternSchema);
