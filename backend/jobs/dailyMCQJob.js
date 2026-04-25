const cron = require('node-cron');
const { generateMCQs } = require('../services/aiService');
const DailyMCQ = require('../models/DailyMCQ');

// PHASE 1: 5:00 AM - Generate Pending Draft
cron.schedule('0 5 * * *', async () => {
  console.log('⏰ CRON: Checking daily MCQ draft...');
  const todayDate = new Date().toISOString().split('T')[0];
  
  try {
    const existing = await DailyMCQ.findOne({ date: todayDate });
    if (existing) return console.log('✅ CRON: MCQ already exists for today.');

    const subjects = ['ENGLISH', 'GK_JK', 'REASONING', 'COMPUTERS', 'CURRENT_AFFAIRS'];
    const todaySubject = subjects[new Date().getDay() % subjects.length];
    const questions = await generateMCQs(todaySubject, 'MEDIUM');

    if (questions?.length > 0) {
      await new DailyMCQ({
        date: todayDate,
        subject: todaySubject,
        questions: questions,
        status: 'PENDING'
      }).save();
      console.log(`✅ CRON: Daily MCQ draft (PENDING) saved.`);
    }
  } catch (error) {
    console.error('❌ CRON: Phase 1 MCQ failed:', error);
  }
});

// PHASE 2: 11:45 AM - Emergency Activation Fallback
cron.schedule('45 11 * * *', async () => {
  console.log('⏰ CRON: Finalizing today\'s MCQs (Priority check)...');
  const todayDate = new Date().toISOString().split('T')[0];

  try {
    const activeSet = await DailyMCQ.findOne({ date: todayDate, status: 'ACTIVE' });
    if (activeSet) return console.log('✅ CRON: Manual/Active MCQs found. No action needed.');

    const pendingSet = await DailyMCQ.findOne({ date: todayDate, status: 'PENDING' });
    if (pendingSet) {
      pendingSet.status = 'ACTIVE';
      await pendingSet.save();
      console.log('✅ CRON: Activated PENDING AI set as fallback.');
    } else {
      // Emergency generation if even pending failed at 5 AM
      console.log('⚠️ CRON: No set found. Emergency generating...');
      const subjects = ['ENGLISH', 'GK_JK', 'REASONING', 'COMPUTERS', 'CURRENT_AFFAIRS'];
      const todaySubject = subjects[new Date().getDay() % subjects.length];
      const questions = await generateMCQs(todaySubject, 'MEDIUM');
      if (questions?.length > 0) {
        await new DailyMCQ({
          date: todayDate,
          subject: todaySubject,
          questions: questions,
          status: 'ACTIVE'
        }).save();
        console.log('✅ CRON: Emergency MCQs activated.');
      }
    }
  } catch (error) {
    console.error('❌ CRON: Phase 2 MCQ failed:', error);
  }
});
// PHASE 3: Hourly Cleanup - Delete completed missions
cron.schedule('0 * * * *', async () => {
  console.log('⏰ CRON: Cleaning up completed missions...');
  const now = new Date();
  try {
    const result = await DailyMCQ.deleteMany({
      status: 'ACTIVE',
      endTime: { $lt: now }
    });
    if (result.deletedCount > 0) {
      console.log(`🧹 CRON: Permanently deleted ${result.deletedCount} completed missions.`);
    }
  } catch (error) {
    console.error('❌ CRON: Cleanup failed:', error);
  }
});
