const mongoose = require('mongoose');

const monthlyRankingSchema = new mongoose.Schema({
  monthLabel: { type: String, required: true }, // e.g. "April 2026"
  winners: [{
    rank: Number,
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phone: String,
    prepScore: Number,
    mcqScore: Number,
    mockScore: Number,
    prizeAmount: Number,
    paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    transactionId: String,
    paidAt: Date,
    upiId: String,
    bankAccount: String,
    bankIFSC: String,
    preferredPayment: String,
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MonthlyRanking', monthlyRankingSchema);
