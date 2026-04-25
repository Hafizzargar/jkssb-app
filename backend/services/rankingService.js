const User = require('../models/User');

// Called after every MCQ submission
const updateMCQScore = async (userId, pointsEarned) => {
  const user = await User.findById(userId);
  if (!user) return;
  
  user.weeklyMCQScore  += pointsEarned;
  user.monthlyMCQScore += pointsEarned;
  
  // PrepScore = MCQ Score (60%) + Mock Test Score (40%)
  user.weeklyPrepScore  = (user.weeklyMCQScore * 0.6)  + (user.weeklyMockScore * 0.4);
  user.monthlyPrepScore = (user.monthlyMCQScore * 0.6) + (user.monthlyMockScore * 0.4);
  
  await user.save();
};

// Called after every mock test submission
const updateMockScore = async (userId, mockScore) => {
  const user = await User.findById(userId);
  if (!user) return;

  // Only keep the BEST single mock test score of the week/month as per user requirement
  if (mockScore > user.weeklyMockScore)  user.weeklyMockScore  = mockScore;
  if (mockScore > user.monthlyMockScore) user.monthlyMockScore = mockScore;
  
  user.weeklyPrepScore  = (user.weeklyMCQScore * 0.6)  + (user.weeklyMockScore * 0.4);
  user.monthlyPrepScore = (user.monthlyMCQScore * 0.6) + (user.monthlyMockScore * 0.4);
  
  await user.save();
};

// Get top 50 for leaderboard
const getWeeklyLeaderboard = async () => {
  return await User.find({ isBanned: false })
    .sort({ weeklyPrepScore: -1 })
    .limit(50)
    .select('name phone weeklyPrepScore weeklyMCQScore weeklyMockScore streak');
};

const getMonthlyLeaderboard = async () => {
  return await User.find({ isBanned: false })
    .sort({ monthlyPrepScore: -1 })
    .limit(50)
    .select('name phone monthlyPrepScore monthlyMCQScore monthlyMockScore streak');
};

module.exports = { updateMCQScore, updateMockScore, getWeeklyLeaderboard, getMonthlyLeaderboard };
