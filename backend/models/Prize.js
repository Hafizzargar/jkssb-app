const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  type: { type: String, enum: ['WEEKLY', 'MONTHLY'], required: true, unique: true },
  modelType: { type: String, enum: ['FIXED', 'DYNAMIC'], default: 'FIXED' },
  entryFee: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 20 }, // Percentage
  amounts: {
    rank1: { type: Number, default: 500 },
    rank2: { type: Number, default: 300 },
    rank3: { type: Number, default: 200 },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Changed to User model as per current project structure
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Prize', prizeSchema);
