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
    const today = new Date().toLocaleDateString('en-CA');
    // Look for the most recent ACTIVE mission for today
    const mcqs = await DailyMCQ.findOne({ 
      date: today,
      status: 'ACTIVE' 
    }).sort({ startTime: -1 });

    if (!mcqs) return res.status(404).json({ message: 'No questions scheduled' });

    const startTime = new Date(mcqs.startTime);
    const endTime = new Date(mcqs.endTime);

    const result = { ...mcqs.toObject() };

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
    // Added 15-second grace period (15000ms) to match frontend auto-start UI
    result.isTooEarly = now < new Date(startTime.getTime() - 15000); 
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
    
    // Find the latest attempt for this user and populate the mission questions
    const attempt = await MCQAttempt.findOne({ user: userId })
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
