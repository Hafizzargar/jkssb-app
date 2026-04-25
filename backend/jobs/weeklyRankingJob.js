const cron = require('node-cron');
const User = require('../models/User');
const WeeklyRanking = require('../models/WeeklyRanking');
const Prize = require('../models/Prize');
const { sendPrizeWonEmail } = require('../services/emailService');
const { sendPushNotification } = require('../services/notificationService');

const getWeekLabel = () => {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const weekNum = Math.ceil(now.getDate() / 7);
  return `Week ${weekNum} - ${month} ${now.getFullYear()}`;
};

// Every Sunday at 11:00 PM
cron.schedule('0 23 * * 0', async () => {
  console.log('🏆 Calculating weekly winners...');

  try {
    // Get prize config from DB (admin can change anytime)
    const prizeConfig = await Prize.findOne({ type: 'WEEKLY' });
    const prizes = prizeConfig?.amounts || { rank1: 500, rank2: 300, rank3: 200 };

    // Get top 3 students
    const top3 = await User.find({ isBanned: false, weeklyPrepScore: { $gt: 0 } })
      .sort({ weeklyPrepScore: -1 })
      .limit(3)
      .select('name phone email weeklyPrepScore weeklyMCQScore weeklyMockScore upiId bankAccount bankIFSC preferredPayment fcmToken');

    const weekLabel = getWeekLabel();

    // Save snapshot
    const rankData = top3.map((user, index) => ({
      rank: index + 1,
      student: user._id,
      name: user.name,
      phone: user.phone,
      prepScore: user.weeklyPrepScore,
      mcqScore: user.weeklyMCQScore,
      mockScore: user.weeklyMockScore,
      prizeAmount: [prizes.rank1, prizes.rank2, prizes.rank3][index],
      paymentStatus: 'PENDING',
      upiId: user.upiId,
      bankAccount: user.bankAccount,
      bankIFSC: user.bankIFSC,
      preferredPayment: user.preferredPayment,
    }));

    await WeeklyRanking.create({ weekLabel, winners: rankData });

    // Notify winners
    const medals = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < top3.length; i++) {
      const user = top3[i];
      const amount = [prizes.rank1, prizes.rank2, prizes.rank3][i];

      // Push notification
      if (user.fcmToken) {
        await sendPushNotification(user.fcmToken,
          `${medals[i]} You Won ₹${amount}!`,
          `Congratulations! You ranked #${i + 1} this week on JKSSB PrepMaster!`
        );
      }

      // Email
      if (user.email) {
        await sendPrizeWonEmail(user.email, user.name, i + 1, amount, 'weekly');
      }
    }

    // Reset weekly scores for ALL students
    await User.updateMany({}, {
      $set: { weeklyMCQScore: 0, weeklyMockScore: 0, weeklyPrepScore: 0 }
    });

    console.log(`✅ Weekly winners saved. Scores reset. Week: ${weekLabel}`);
  } catch (error) {
    console.error('Error in weeklyRankingJob:', error);
  }
});
