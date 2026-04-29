const User = require('../../models/User');
const DailyMCQ = require('../../models/DailyMCQ');
const Prize = require('../../models/Prize');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    
    // Active vs Inactive (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ 
      isAdmin: false, 
      lastActive: { $gte: twentyFourHoursAgo } 
    });
    const inactiveUsers = totalUsers - activeUsers;

    // Pending Approvals
    const pendingApprovals = await User.countDocuments({ 
      status: 'PENDING', 
      isAdmin: false 
    });

    // Banned Users
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Time-based new users
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
    const newUsersWeekly = await User.countDocuments({ createdAt: { $gte: startOfWeek } });
    const newUsersMonthly = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    // Other counts
    const pendingMCQs = await DailyMCQ.countDocuments({ status: 'PENDING' });
    const unpaidPrizes = await Prize.countDocuments({ status: 'UNPAID' });

    // Top Performers
    const topPerformers = await User.find({ isAdmin: false })
      .sort({ weeklyPrepScore: -1 })
      .limit(5)
      .select('name username weeklyPrepScore lastActive');

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        pendingApprovals,
        bannedUsers,
        newUsers: {
          today: newUsersToday,
          weekly: newUsersWeekly,
          monthly: newUsersMonthly
        },
        pendingMCQs,
        unpaidPrizes
      },
      topPerformers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
