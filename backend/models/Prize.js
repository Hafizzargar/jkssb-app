const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  type:    { type: String, enum: ['WEEKLY', 'MONTHLY'], required: true, unique: true },
  amounts: {
    rank1: { type: Number, default: 500 },   // Admin changes this
    rank2: { type: Number, default: 300 },
    rank3: { type: Number, default: 200 },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Prize', prizeSchema);
