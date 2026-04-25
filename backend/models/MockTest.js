const mongoose = require('mongoose');

const mockTestSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  description: String,
  totalQuestions: { type: Number, default: 80 },
  duration:   { type: Number, default: 80 }, // in minutes
  questions:  [{
    question: String,
    options: [String],
    correct: String,
    explanation: String,
    subject: String,
  }],
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('MockTest', mockTestSchema);
