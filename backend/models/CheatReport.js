const mongoose = require('mongoose');

const cheatReportSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mockTest:   { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
  mockAttempt: { type: mongoose.Schema.Types.ObjectId, ref: 'MockAttempt', required: true },
  reason:     { type: String, required: true }, // e.g. "Face mismatch", "Multiple faces"
  evidence:   [String], // Cloudinary URLs
  status:     { type: String, enum: ['PENDING', 'RESOLVED', 'DISMISSED'], default: 'PENDING' },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('CheatReport', cheatReportSchema);
