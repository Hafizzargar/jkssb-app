const DailyMCQ = require('../../models/DailyMCQ');
const { generateMCQs } = require('../../services/aiService');

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
    await DailyMCQ.findByIdAndDelete(req.params.id);

    // Clear Redis Cache
    const redisClient = req.app.get('getRedis')();
    if (redisClient) {
      console.log('🧹 Clearing Redis Cache (todays_mcqs)');
      await redisClient.del('todays_mcqs');
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
    const { subject, difficulty, count, noSave } = req.body || {};
    const questions = await generateMCQs(subject || 'GK_JK', difficulty || 'MEDIUM', count || 20);
    
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
    const today = new Date().toISOString().split('T')[0];
    const active = await DailyMCQ.find({ 
      date: today 
    }).sort({ startTime: 1 });
    
    console.log(`📊 Admin: Found ${active.length} missions for today.`);
    res.json(active);
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
    const { id, subject, questions, testDuration, timePerQuestion, startTime, endTime } = req.body;
    // Use the date from the startTime provided, or fallback to today
    const selectedDate = startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Normalize questions to match schema
    const normalizedQuestions = questions.map(q => ({
      question: q.question,
      options: q.options,
      correct: q.correct || q.correctAnswer,
      explanation: q.explanation || ''
    }));

    console.log(`📝 Manual MCQ Submit: ${subject} for date ${selectedDate} (${normalizedQuestions.length} Qs)`);

    // Find by ID if provided, otherwise fallback to the selected date
    let mcqSet = null;
    if (id) {
      mcqSet = await DailyMCQ.findById(id);
    } else {
      mcqSet = await DailyMCQ.findOne({ date: selectedDate });
    }

    if (!req.admin || !req.admin._id) {
      console.error('❌ Admin session missing during MCQ save');
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
        approvedBy: req.admin._id,
        approvedAt: new Date()
      });
    }

    await mcqSet.save();
    console.log('✅ MCQ Mission saved successfully:', mcqSet._id);
    res.json({ message: 'Mission updated successfully!', data: mcqSet });
  } catch (error) {
    console.error('❌ Manual MCQ Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
