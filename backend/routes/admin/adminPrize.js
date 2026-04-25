const express = require('express');
const router = express.Router();
const Prize = require('../../models/Prize');
const WeeklyRanking = require('../../models/WeeklyRanking');
const MonthlyRanking = require('../../models/MonthlyRanking');
const { adminOnly } = require('../../middleware/adminMiddleware');

// GET current prize amounts
router.get('/config', adminOnly, async (req, res) => {
  try {
    const weekly  = await Prize.findOne({ type: 'WEEKLY' });
    const monthly = await Prize.findOne({ type: 'MONTHLY' });
    res.json({ weekly, monthly });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE prize amounts
router.put('/config', adminOnly, async (req, res) => {
  try {
    const { type, rank1, rank2, rank3 } = req.body;
    const updatedPrize = await Prize.findOneAndUpdate(
      { type },
      { 
        amounts: { rank1, rank2, rank3 }, 
        updatedBy: req.admin._id, 
        updatedAt: new Date() 
      },
      { upsert: true, new: true }
    );
    res.json({ message: `${type} prize updated successfully`, data: updatedPrize });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET winners list (with payment status)
router.get('/winners/:type', adminOnly, async (req, res) => {
  try {
    const Model = req.params.type === 'weekly' ? WeeklyRanking : MonthlyRanking;
    const results = await Model.find().sort({ createdAt: -1 }).limit(10);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MARK prize as PAID
router.patch('/mark-paid/:rankingId/:rank', adminOnly, async (req, res) => {
  try {
    const { rankingId, rank } = req.params;
    const { type, transactionId } = req.body;
    const Model = type === 'weekly' ? WeeklyRanking : MonthlyRanking;

    const updated = await Model.findOneAndUpdate(
      { _id: rankingId, 'winners.rank': parseInt(rank) },
      {
        $set: {
          'winners.$.paymentStatus': 'PAID',
          'winners.$.transactionId': transactionId,
          'winners.$.paidAt': new Date(),
        }
      },
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ message: 'Winner not found' });
    
    res.json({ message: 'Marked as paid', data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
