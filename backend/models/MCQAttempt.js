const mongoose = require('mongoose');

const mcqAttemptSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dailyMCQ:   { type: mongoose.Schema.Types.ObjectId, ref: 'DailyMCQ', required: true },
  answers:    [{
    questionId: String,
    selectedOption: String,
    isCorrect: Boolean,
  }],
  score:      Number, // Total points for this attempt (+4, -1)
  subjectCode: String, // Which subject this attempt was for
  attemptedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MCQAttempt', mcqAttemptSchema);
