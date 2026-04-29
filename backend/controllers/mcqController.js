const DailyMCQ = require('../models/DailyMCQ');
const MCQAttempt = require('../models/MCQAttempt');
const User = require('../models/User');

/**
 * Get today's active MCQs
 */
exports.getTodaysMCQs = async (req, res) => {
  try {
    const redisClient = req.app.get('getRedis')();
    const cacheKey = 'todays_mcqs';
    let mcqs;
    // 1. Try Redis Cache for the base mission data
    if (redisClient) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('🚀 Redis: Serving Cached Mission Base');
        mcqs = JSON.parse(cachedData);
      }
    }

    if (!mcqs) {
      // FIX: Use local-aware date for India (GMT+5:30) or the server's local time
      // instead of strictly UTC which causes 404s after midnight.
      const now = new Date();
      const localDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Shift to IST for calculation if needed, or just use toLocaleDateString
      const today = localDate.toISOString().split('T')[0];
      
      console.log(`📅 Searching for mission on: ${today}`);
      const mission = await DailyMCQ.findOne({ 
        date: today,
        status: { $in: ['ACTIVE', 'PUBLISHED'] }
      }).sort({ startTime: -1 });

      if (!mission) return res.status(404).json({ message: 'No questions scheduled' });
      mcqs = mission.toObject();

      // Save to cache for 5 minutes
      if (redisClient) {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(mcqs));
      }
    }

    const startTime = new Date(mcqs.startTime);
    const endTime = new Date(mcqs.endTime);
    const result = { ...mcqs };

    // Check if THIS user has already attempted this mission
    const userId = req.session.userId;
    let history = [];
    if (userId) {
      const attempt = await MCQAttempt.findOne({ user: userId, dailyMCQ: mcqs._id });
      result.isAttempted = !!attempt;

      // Fetch user history (last 5 attempts) and calculate rank for each
      const rawHistory = await MCQAttempt.find({ user: userId })
        .sort({ attemptedAt: -1 })
        .limit(5)
        .select('score subjectCode dailyMCQ attemptedAt');

      history = await Promise.all(rawHistory.map(async (item) => {
        // Find how many people scored HIGHER in the same mission to calculate rank
        const higherScorers = await MCQAttempt.countDocuments({
          dailyMCQ: item.dailyMCQ,
          score: { $gt: item.score }
        });
        return {
          ...item.toObject(),
          rank: higherScorers + 1
        };
      }));
    }

    // Always include these flags so the frontend knows how to handle the UI
    // Added 2-minute grace period (120000ms) to allow early entry
    const now = new Date();
    result.isTooEarly = now < new Date(startTime.getTime() - 120000); 
    result.isTooLate = now > endTime;
    result.opensAt = startTime;
    result.closedAt = endTime;
    result.history = history;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Create Manual MCQs for today
 * POST /api/admin/mcq/manual
 */
exports.createManualMCQs = async (req, res) => {
  try {
    const { subject, questions, startTime, endTime, testDuration, timePerQuestion, date } = req.body;
    const cleanDate = date || new Date().toISOString().split('T')[0];

    const validQuestions = (questions || [])
      .filter(q => q.question && q.question.trim() !== '')
      .map(q => ({
        question: q.question.trim(),
        options: q.options.map(o => (o || '').trim()),
        correct: q.correct || 'A',
        explanation: q.explanation || ''
      }))
      .filter(q => q.options.filter(o => o !== '').length === 4);

    console.log(`📝 [mcqController] Saving ${validQuestions.length} valid questions out of ${(questions || []).length} submitted.`);

    // Check if we are updating an existing set or creating a new one
    let mcqSet;
    if (req.body.id) {
      mcqSet = await DailyMCQ.findById(req.body.id);
    } else {
      // Find if one already exists for this date to avoid duplicates
      mcqSet = await DailyMCQ.findOne({ date: cleanDate });
    }
    
    if (mcqSet) {
      mcqSet.subject = subject;
      mcqSet.questions = validQuestions;
      mcqSet.startTime = startTime;
      mcqSet.endTime = endTime;
      mcqSet.testDuration = testDuration;
      mcqSet.timePerQuestion = timePerQuestion;
      mcqSet.status = 'ACTIVE';
    } else {
      mcqSet = new DailyMCQ({
        date: cleanDate,
        subject,
        questions: validQuestions,
        startTime,
        endTime,
        testDuration,
        timePerQuestion,
        status: 'ACTIVE'
      });
    }

    await mcqSet.save();

    // Clear Redis Cache so students see it immediately
    const redisClient = req.app.get('getRedis')();
    if (redisClient) {
      await redisClient.del('todays_mcqs');
    }

    res.json({ message: 'Manual MCQs posted successfully!', data: mcqSet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Get all pending AI generated MCQs
 * GET /api/admin/mcq/pending
 */
exports.getPendingMCQs = async (req, res) => {
  try {
    const pending = await DailyMCQ.find({ status: 'PENDING' }).sort({ date: -1 });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Approve/Activate an MCQ set
 * PATCH /api/admin/mcq/approve/:id
 */
exports.approveMCQSet = async (req, res) => {
  try {
    const { id } = req.params;
    const mcqSet = await DailyMCQ.findByIdAndUpdate(id, { status: 'ACTIVE' }, { new: true });
    res.json({ message: 'MCQ set activated!', data: mcqSet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Submit MCQ Answers
 * POST /api/mcq/submit
 */
exports.submitMCQs = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.session.userId;
    const today = new Date().toISOString().split('T')[0];

    // Find the specific MCQ set for this submission
    const mcqSetId = answers[0]?.mcqSetId;
    if (!mcqSetId) return res.status(400).json({ message: 'Missing MCQ Set ID' });

    const mcqSet = await DailyMCQ.findById(mcqSetId);
    if (!mcqSet || mcqSet.status !== 'ACTIVE') {
      return res.status(404).json({ message: 'Active mission not found' });
    }

    // 1. Timing Check (Now must be before endTime)
    const now = new Date();
    const endTime = new Date(mcqSet.endTime);
    if (now > endTime) {
      return res.status(403).json({ message: 'Submission window closed for this mission.' });
    }

    // 2. Prevent Double Submission for the SPECIFIC MISSION
    const existing = await MCQAttempt.findOne({ user: userId, dailyMCQ: mcqSetId });
    if (existing) {
      return res.status(400).json({ 
        message: 'Submission Rejected: You have already completed this specific mission.',
        alreadySubmitted: true
      });
    }

    // 3. Calculate Score
    let totalScore = 0;
    const processedAnswers = answers.map(userAns => {
      const question = mcqSet.questions.find(q => q.question === userAns.q);
      
      // Map the selected text to its letter (A, B, C, or D)
      let selectedLetter = 'NONE';
      if (userAns.ans !== 'NONE' && question) {
        const optIndex = question.options.indexOf(userAns.ans);
        if (optIndex !== -1) {
          selectedLetter = String.fromCharCode(65 + optIndex); // 0 -> A, 1 -> B, etc.
        }
      }

      const isCorrect = question && question.correct === selectedLetter;
      
      if (isCorrect) {
        totalScore += 4;
      } else if (selectedLetter !== 'NONE') {
        totalScore -= 1; // Negative marking for wrong answers
      }
      
      return {
        questionId: question?._id || 'unknown',
        selectedOption: selectedLetter,
        isCorrect
      };
    });

    const attempt = new MCQAttempt({
      user: userId,
      dailyMCQ: mcqSet._id,
      answers: processedAnswers,
      score: totalScore,
      attemptedAt: now
    });

    await attempt.save();

    // 4. Update User Overall & Subject Performance
    const correctCount = processedAnswers.filter(a => a.isCorrect).length;
    const totalCount = processedAnswers.length;
    const subCode = mcqSet.subject; // The subject code/name from the MCQ set

    await User.findByIdAndUpdate(userId, { 
      $inc: { weeklyPrepScore: totalScore } 
    });

    // Update Subject Performance
    const user = await User.findById(userId);
    let subPerf = user.subjectPerformance.find(p => p.subjectCode === subCode);
    
    if (subPerf) {
      subPerf.correctAnswers += correctCount;
      subPerf.totalAttempted += totalCount;
      subPerf.percentage = Math.round((subPerf.correctAnswers / subPerf.totalAttempted) * 100);
    } else {
      user.subjectPerformance.push({
        subjectCode: subCode,
        correctAnswers: correctCount,
        totalAttempted: totalCount,
        percentage: Math.round((correctCount / totalCount) * 100)
      });
    }
    await user.save();

    // 5. Return the attempt (populated for immediate UI update)
    const populatedAttempt = await MCQAttempt.findById(attempt._id).populate('dailyMCQ');

    res.json({ 
      message: 'Test submitted successfully!', 
      attempt: populatedAttempt 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Results (Delayed by 5 minutes)
 * GET /api/mcq/results
 */
exports.getResults = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const { missionId } = req.query;
    
    // Build query
    const query = { user: userId };
    if (missionId) query.dailyMCQ = missionId;

    // Find the attempt (latest if no missionId) and populate questions
    const attempt = await MCQAttempt.findOne(query)
      .sort({ attemptedAt: -1 })
      .populate('dailyMCQ');

    if (!attempt) {
      return res.status(404).json({ message: 'No results found.' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('Get Results Error:', error);
    res.status(500).json({ message: 'Server error fetching results.' });
  }
};

/**
 * Get all past, live, and upcoming MCQs for a student
 * GET /api/mcq/all
 */
exports.getAllStudentMCQs = async (req, res) => {
  try {
    const userId = req.session.userId;
    const now = new Date();

    // 1. Fetch all ACTIVE or PENDING missions
    const allMissions = await DailyMCQ.find({ status: { $in: ['ACTIVE', 'PENDING', 'PUBLISHED'] } }).sort({ startTime: -1 });

    // 2. Fetch all attempts by this user
    const userAttempts = await MCQAttempt.find({ user: userId });
    const attemptMap = {};
    userAttempts.forEach(a => {
      attemptMap[a.dailyMCQ.toString()] = {
        score: a.score,
        attemptedAt: a.attemptedAt,
        correctAnswers: a.answers.filter(ans => ans.isCorrect).length,
        totalQuestions: a.answers.length
      };
    });

    const response = {
      live: [],
      upcoming: [],
      past: []
    };

    allMissions.forEach(mission => {
      const missionData = {
        _id: mission._id,
        subject: mission.subject,
        startTime: mission.startTime,
        endTime: mission.endTime,
        questionCount: mission.questions.length,
        isAttempted: !!attemptMap[mission._id.toString()],
        scoreData: attemptMap[mission._id.toString()] || null
      };

      const start = new Date(mission.startTime);
      const end = new Date(mission.endTime);
      const twoMinsBeforeStart = new Date(start.getTime() - 120000);

      if (now > end) {
        response.past.push(missionData);
      } else if (now >= twoMinsBeforeStart && now <= end) {
        response.live.push(missionData);
      } else {
        response.upcoming.push(missionData);
      }
    });

    res.json(response);
  } catch (error) {
    console.error('GetAllStudentMCQs Error:', error);
    res.status(500).json({ message: 'Server error fetching all missions.' });
  }
};

/**
 * Get Leaderboard for a specific mission
 * GET /api/mcq/leaderboard/:missionId
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.session.userId;

    const mission = await DailyMCQ.findById(missionId).select('subject questions');
    if (!mission) return res.status(404).json({ message: 'Mission not found' });

    const allAttempts = await MCQAttempt.find({ dailyMCQ: missionId })
      .populate('user', 'name')
      .sort({ score: -1, attemptedAt: 1 });

    const totalQuestions = mission.questions.length;
    
    // Process attempts to match the UI needs
    const rankings = allAttempts.map((att, index) => {
      const correct = att.answers.filter(a => a.isCorrect).length;
      const wrong = att.answers.filter(a => !a.isCorrect && a.selectedOption !== 'NONE').length;
      const percentage = Math.round((correct / totalQuestions) * 100);

      return {
        userId: att.user?._id,
        name: att.user?.name || 'Anonymous',
        score: att.score,
        correct,
        wrong,
        percentage,
        rank: index + 1
      };
    });

    // Find current user's specific stats
    const userStats = rankings.find(r => r.userId?.toString() === userId?.toString());

    res.json({
      subject: mission.subject,
      totalParticipants: rankings.length,
      top3: rankings.slice(0, 3),
      allRankings: rankings,
      userStats: userStats || null
    });
  } catch (error) {
    console.error('GetLeaderboard Error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard.' });
  }
};
