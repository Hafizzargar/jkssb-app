const mongoose = require('mongoose');

const dailyMCQSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  subject: { type: String, required: true },
  topic: String,
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
  questions: [{
    question: { type: String, required: true },
    options: { 
      type: [String], 
      validate: [val => val.length === 4, 'Must have exactly 4 options'] 
    },
    correct: { type: String, required: true },
    explanation: String
  }],
  status: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'REJECTED', 'DELETED'], 
    default: 'PENDING' 
  },
  testDuration: { type: Number, default: 5 }, // Total minutes
  timePerQuestion: { type: Number, default: 15 }, // Seconds per question
  startTime: { type: Date, required: true }, // When test opens
  endTime: { type: Date, required: true }, // When test closes
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  approvedAt: Date,
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
});

// Ensure no two active MCQs for the same date/subject combination (business rule)
// dailyMCQSchema.index({ date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('DailyMCQ', dailyMCQSchema);
