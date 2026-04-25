const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  name: { type: String },
  phone: { type: String },
  password: { type: String, required: true },
  isTermsAccepted: { type: Boolean, default: false },
  isRegistered: { type: Boolean, default: false }, // True once first-time registration is complete
  
  otp: { type: String },
  otpExpiry: { type: Date },
  
  // Scoring
  weeklyMCQScore: { type: Number, default: 0 },
  weeklyMockScore: { type: Number, default: 0 },
  weeklyPrepScore: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  
  // Subject-wise performance tracking
  subjectPerformance: [{
    subjectCode: String, // e.g., 'GK', 'MATH'
    correctAnswers: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  }],
  
  // Payment Info (for prizes)
  upiId: { type: String },
  bankAccount: { type: String },
  bankIFSC: { type: String },
  preferredPayment: { type: String, enum: ['UPI', 'BANK'], default: 'UPI' },
  
  isAdmin: { type: Boolean, default: false },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
