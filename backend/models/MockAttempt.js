const mongoose = require('mongoose');

const mockAttemptSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mockTest:   { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
  answers:    [{
    questionId: String,
    selectedOption: String,
    isCorrect: Boolean,
  }],
  score:      Number, // Score out of 80 (official JKSSB pattern)
  timeTaken:  Number, // in minutes
  screenshots: [String], // Cloudinary URLs for anti-cheat
  cheatDetected: { type: Boolean, default: false },
  attemptedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MockAttempt', mockAttemptSchema);
