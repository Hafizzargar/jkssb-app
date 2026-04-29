const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

/**
 * 📣 NOTIFICATION SERVICE
 * Handles sending push notifications via Expo/FCM
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken || !user.notificationsEnabled) {
      return { success: false, message: 'User not found or notifications disabled' };
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(`❌ Invalid Expo push token: ${user.pushToken}`);
      return { success: false, message: 'Invalid push token' };
    }

    const messages = [{
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    }];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending notification chunk:', error);
      }
    }

    return { success: true, tickets };
  } catch (error) {
    console.error('❌ Notification Service Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 📢 BROADCAST NOTIFICATION
 * Sends a notification to all users
 */
const broadcastNotification = async (title, body, data = {}) => {
  try {
    const users = await User.find({ 
      pushToken: { $exists: true, $ne: '' },
      notificationsEnabled: true 
    });

    if (users.length === 0) return { success: true, count: 0 };

    const messages = users.map(user => ({
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    return { success: true, count: users.length };
  } catch (error) {
    console.error('❌ Broadcast Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPushNotification,
  broadcastNotification
};
