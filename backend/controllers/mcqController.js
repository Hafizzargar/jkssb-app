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

    // 1. Check Redis Cache
    if (redisClient) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('🚀 Redis: Serving Cached MCQs');
        return res.json(JSON.parse(cachedData));
      }
    }

    const now = new Date();
    // Look for the most recent ACTIVE mission for today
    const mcqs = await DailyMCQ.findOne({ status: 'ACTIVE' }).sort({ startTime: -1 });

    if (!mcqs) return res.status(404).json({ message: 'No questions scheduled' });

    const startTime = new Date(mcqs.startTime);
    const endTime = new Date(mcqs.endTime);

    const result = { ...mcqs.toObject() };

    // Always include these flags so the frontend knows how to handle the UI
    result.isTooEarly = now < startTime;
    result.isTooLate = now > endTime;
    result.opensAt = startTime;
    result.closedAt = endTime;

    // Cache the result to prevent DB load
    if (redisClient) {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(result)); // 1 min cache
    }

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
    const { subject, questions } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if a set already exists for today
    let mcqSet = await DailyMCQ.findOne({ date: today });
    
    if (mcqSet) {
      mcqSet.subject = subject;
      mcqSet.questions = questions;
      mcqSet.status = 'ACTIVE'; // Manual ones are active immediately
    } else {
      mcqSet = new DailyMCQ({
        date: today,
        subject,
        questions,
        status: 'ACTIVE'
      });
    }

    await mcqSet.save();
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

    const mcqSet = await DailyMCQ.findOne({ _id: answers[0]?.mcqSetId || { $exists: true }, status: 'ACTIVE' });
    if (!mcqSet) return res.status(404).json({ message: 'Active MCQ set not found' });

    // 1. Timing Check (Now must be before endTime)
    const now = new Date();
    if (now > new Date(mcqSet.endTime)) {
      return res.status(403).json({ message: 'Submission window closed for this mission.' });
    }

    // 2. Prevent Double Submission
    const existing = await MCQAttempt.findOne({ user: userId, attemptedAt: { $gte: new Date(today) } });
    if (existing) return res.status(400).json({ message: 'Already submitted today' });

    // 3. Calculate Score
    let totalScore = 0;
    const processedAnswers = answers.map(userAns => {
      const question = mcqSet.questions.find(q => q.question === userAns.q);
      const isCorrect = question && question.correct === userAns.ans;
      if (isCorrect) totalScore += 4;
      else if (userAns.ans !== 'NONE') totalScore -= 1;
      
      return {
        questionId: question?._id || 'unknown',
        selectedOption: userAns.ans,
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

    res.json({ message: 'Test submitted successfully. Results in 5 minutes.' });
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
    const today = new Date().toISOString().split('T')[0];

    const attempt = await MCQAttempt.findOne({ 
      user: userId, 
      attemptedAt: { $gte: new Date(today) } 
    }).populate('dailyMCQ');

    if (!attempt) return res.status(404).json({ message: 'No attempt found for today' });

    // 5-minute delay check
    const waitTime = 5 * 60 * 1000;
    const elapsed = new Date() - attempt.attemptedAt;

    if (elapsed < waitTime) {
      const remaining = Math.ceil((waitTime - elapsed) / 1000 / 60);
      return res.status(403).json({ 
        message: `Results are locked. Please wait ${remaining} more minutes.`,
        readyIn: remaining
      });
    }

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
