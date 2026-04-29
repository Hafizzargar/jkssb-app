const cron = require('node-cron');
const DailyMCQ = require('../models/DailyMCQ');
const { broadcastNotification } = require('./notificationService');

/**
 * ⏰ SCHEDULER SERVICE
 * Handles automated tasks like mission alerts and score resets.
 */
const initScheduler = () => {
  // Check every minute for upcoming missions (10 minutes before)
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const tenMinsFromNow = new Date(now.getTime() + 10 * 60000);
      const elevenMinsFromNow = new Date(now.getTime() + 11 * 60000);

      // Find missions starting in exactly 10-11 minutes
      const upcomingMissions = await DailyMCQ.find({
        startTime: {
          $gte: tenMinsFromNow,
          $lt: elevenMinsFromNow
        },
        status: 'PUBLISHED',
        notified: { $ne: true } // Avoid double notifications
      });

      for (const mission of upcomingMissions) {
        console.log(`🔔 Sending alert for mission: ${mission.title}`);
        
        await broadcastNotification(
          `Mission Starting Soon! ⏰`,
          `"${mission.title}" starts in 10 minutes. Get ready! 🔥`,
          { missionId: mission._id, type: 'MISSION_ALERT' }
        );

        // Mark as notified
        mission.notified = true;
        await mission.save();
      }
    } catch (error) {
      console.error('❌ Scheduler Error (Mission Alert):', error);
    }
  });

  // Daily Score Reset / Maintenance can go here
  console.log('🚀 Scheduler Service Initialized');
};

module.exports = { initScheduler };
