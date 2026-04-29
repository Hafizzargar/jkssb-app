import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../utils/api';

// Config how notifications appear when app is OPEN
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const useNotifications = (userId) => {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('📱 Push Token Secured:', token);
        api.post('/auth/push-token', { pushToken: token })
          .catch(err => console.error('❌ Failed to save push token:', err));
      }
    });

    // Handle notifications when app is OPEN
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification Received (Foreground):', notification);
    });

    // Handle when user TAPS a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification Tapped:', response);
      const data = response.notification.request.content.data;
      // Handle navigation here if needed (e.g., go to mission)
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userId]);
};

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return;
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push token for push notification!');
      return;
    }
    
    // Get the token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
      console.error('❌ Project ID not found in app.json. Push notifications require an EAS project ID.');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.error('❌ Error getting Expo Push Token:', e);
    }
  } else {
    console.log('ℹ️ Must use physical device for Push Notifications');
  }

  return token;
}
