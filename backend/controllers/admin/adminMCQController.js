const DailyMCQ = require('../../models/DailyMCQ');
const MCQAttempt = require('../../models/MCQAttempt');
const { generateMCQs, generateNeetMock } = require('../../services/aiService');

/**
 * Approve an MCQ set
 * PATCH /api/admin/mcq/approve/:id
 */
exports.approveMCQ = async (req, res) => {
  try {
    const mcq = await DailyMCQ.findByIdAndUpdate(
      req.params.id,
      {
        status: 'ACTIVE',
        approvedBy: req.admin._id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!mcq) return res.status(404).json({ message: 'MCQ set not found' });

    console.log(`✅ MCQ Approved by admin: ${req.admin.username}`);
    res.json({ message: 'MCQ Approved and Published', data: mcq });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reject an MCQ set
 * PATCH /api/admin/mcq/reject/:id
 */
exports.rejectMCQ = async (req, res) => {
  try {
    const { reason } = req.body;
    const mcq = await DailyMCQ.findByIdAndUpdate(
      req.params.id,
      {
        status: 'REJECTED',
        rejectionReason: reason || 'Does not meet standards'
      },
      { new: true }
    );

    res.json({ message: 'MCQ Rejected', data: mcq });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Soft delete an MCQ set
 * PATCH /api/admin/mcq/delete/:id
 */
exports.deleteMCQ = async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ message: 'No ID provided' });
    await DailyMCQ.findByIdAndDelete(req.params.id);

    // Clear Redis Cache
    try {
      const redisClient = req.app.get('getRedis')();
      if (redisClient) {
        console.log('🧹 Clearing Redis Cache (todays_mcqs)');
        await redisClient.del('todays_mcqs');
      }
    } catch (redisErr) {
      console.log('⚠️ Redis skip:', redisErr.message);
    }

    console.log(`🗑️ SUCCESS: MCQ Deleted from Database: ${req.params.id}`);
    res.json({ message: 'MCQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Manually trigger AI generation
 * POST /api/admin/mcq/generate
 */
exports.triggerGeneration = async (req, res) => {
  try {
    const { subject, difficulty, count, noSave, mode, sections } = req.body || {};
    
    let questions = [];
    if (sections && Array.isArray(sections) && sections.length > 0) {
      // Use custom sections distribution if provided - ensure counts are numbers
      const cleanSections = sections.map(s => ({
        name: s.name,
        count: parseInt(s.count) || 0
      }));
      questions = await generateNeetMock(mode || 'CUSTOM', difficulty || 'MEDIUM', cleanSections);
    } else if (mode) {
      // Use pattern ID
      questions = await generateNeetMock(mode, difficulty || 'MEDIUM');
    } else {
      // Basic single subject generation
      questions = await generateMCQs(subject || 'NEET', difficulty || 'MEDIUM', count || 20);
    }
    
    if (noSave) {
      return res.json({ message: 'Questions generated', data: { questions } });
    }

    // Ensure we don't save empty missions
    if (!questions || questions.length === 0) {
      console.log('❌ ERROR: Gemini returned 0 valid questions. Aborting save.');
      return res.status(500).json({ message: 'AI failed to generate valid questions. Please try again.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const defaultStart = new Date(`${today}T12:00:00`);
    const defaultEnd = new Date(`${today}T12:05:00`);

    const newMCQ = new DailyMCQ({
      date: today,
      subject: subject || 'GK_JK',
      difficulty: difficulty || 'MEDIUM',
      questions,
      status: 'PENDING',
      testDuration: 5,
      timePerQuestion: 15,
      startTime: defaultStart,
      endTime: defaultEnd
    });

    await newMCQ.save();

    // Clear Redis Cache
    const redisClient = req.app.get('getRedis')();
    if (redisClient) await redisClient.del('todays_mcqs');

    res.status(201).json({ message: 'MCQs generated and pending approval', data: newMCQ });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all pending MCQs for review
 * GET /api/admin/mcq/pending
 */
exports.getPendingMCQs = async (req, res) => {
  try {
    const pending = await DailyMCQ.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all active/scheduled MCQs for review
 * GET /api/admin/mcq/active
 */
exports.getActiveMCQs = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const now = new Date();

    // Only return missions for today that have NOT yet ended
    const active = await DailyMCQ.find({ 
      date: today,
      endTime: { $gte: now }   // ← key fix: exclude expired missions
    }).sort({ startTime: 1 });
    
    console.log(`📊 Admin: Found ${active.length} active/upcoming missions for today.`);
    res.json(active);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all past MCQs (Finished missions)
 * GET /api/admin/mcq/past
 */
exports.getPastMCQs = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Missions where endTime has passed OR the date is before today
    const past = await DailyMCQ.find({ 
      $or: [
        { endTime: { $lt: now } },
        { status: { $in: ['ACTIVE', 'COMPLETED'] }, date: { $lt: today } }
      ]
    }).sort({ endTime: -1 });

    const enrichedPast = await Promise.all(past.map(async (m) => {
      const attemptsCount = await MCQAttempt.countDocuments({ dailyMCQ: m._id });
      
      const toppers = await MCQAttempt.find({ dailyMCQ: m._id })
        .sort({ score: -1, attemptedAt: 1 })
        .limit(3)
        .populate('user', 'name username');

      return {
        ...m.toObject(),
        attemptsCount,
        toppers: toppers.map(t => ({
          name: t.user?.name || 'Unknown User',
          username: t.user?.username || 'user',
          score: t.score
        }))
      };
    }));

    res.json(enrichedPast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Manually create MCQs (Priority)
 * POST /api/admin/mcq/manual
 */
exports.createManualMCQ = async (req, res) => {
  try {
    const { id, subject, questions, testDuration, timePerQuestion, startTime, endTime, date, isPrizeTest, entryFee, prizeDistribution } = req.body;
    const selectedDate = date || (startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    const normalizedQuestions = questions
      .filter(q => q.question && q.question.trim() !== '')  // Drop blank questions
      .map(q => ({
        question: q.question.trim(),
        options: q.options.map(o => (o || '').trim()),
        correct: q.correct || q.correctAnswer || 'A',
        explanation: q.explanation || ''
      }))
      .filter(q => q.options.filter(o => o !== '').length === 4); // Ensure 4 valid options

    if (normalizedQuestions.length < 2) {
      return res.status(400).json({ 
        message: `Only ${normalizedQuestions.length} complete question(s) found. Please fill in at least 2 questions with all 4 options.` 
      });
    }

    console.log(`📝 Saving ${normalizedQuestions.length} valid questions out of ${questions.length} submitted.`);

    let mcqSet = null;
    if (id) {
      mcqSet = await DailyMCQ.findById(id);
    }

    if (!req.admin || !req.admin._id) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    if (mcqSet) {
      mcqSet.subject = subject;
      mcqSet.questions = normalizedQuestions;
      mcqSet.testDuration = testDuration || 5;
      mcqSet.timePerQuestion = timePerQuestion || 15;
      mcqSet.startTime = startTime;
      mcqSet.endTime = endTime;
      mcqSet.date = selectedDate; 
      mcqSet.status = 'ACTIVE'; 
      mcqSet.isPrizeTest = isPrizeTest || false;
      mcqSet.entryFee = entryFee || 0;
      mcqSet.prizeDistribution = prizeDistribution || [];
      mcqSet.approvedBy = req.admin._id;
      mcqSet.approvedAt = new Date();
    } else {
      mcqSet = new DailyMCQ({
        date: selectedDate,
        subject,
        questions: normalizedQuestions,
        testDuration: testDuration || 5,
        timePerQuestion: timePerQuestion || 15,
        startTime,
        endTime,
        status: 'ACTIVE',
        isPrizeTest: isPrizeTest || false,
        entryFee: entryFee || 0,
        prizeDistribution: prizeDistribution || [],
        approvedBy: req.admin._id,
        approvedAt: new Date()
      });
    }

    await mcqSet.save();
    res.json({ message: 'Mission updated successfully!', data: mcqSet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
