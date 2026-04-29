import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * 🌐 ADVANCED API CLIENT
 * This client automatically resolves the backend address based on your environment.
 */

// 🚀 PRODUCTION BACKEND URL (Change this once deployed on Render)
const PRODUCTION_URL = 'https://your-app-name.onrender.com/api';

const getBaseUrl = () => {
  // 1. Check for manually set override in env (if you have one)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2. Use Production URL if you are building a release version (APK)
  // You can also manually uncomment the line below to force production mode
  // return PRODUCTION_URL;

  // 3. Web is easy
  if (Platform.OS === 'web') return 'http://localhost:5000/api';

  // 3. Dynamic IP Discovery for Expo (Works for Real Device & Emulator)
  // Constants.expoConfig?.hostUri looks like "192.168.x.x:8081"
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;
  
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    console.log(`📡 EXPO DEVICE DETECTED: Connecting to ${ip}:5000`);
    return `http://${ip}:5000/api`;
  }

  // 4. Android Emulator Fallback
  if (Platform.OS === 'android') {
    console.log('📱 ANDROID EMULATOR: Using 10.0.2.2:5000');
    return 'http://10.0.2.2:5000/api';
  }

  // 5. iOS Simulator Fallback
  console.log('🍏 IOS SIMULATOR: Using localhost:5000');
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 120000, // 2 minutes (Needed for AI generation)
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Debug Logger: See exactly what's failing
api.interceptors.request.use(request => {
  console.log(`🚀 [API REQUEST] ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`);
  return request;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.message === 'Network Error') {
      console.error(`❌ [NETWORK ERROR] Cannot reach: ${BASE_URL}. Ensure your backend is running and your phone is on the same WiFi.`);
    } else {
      console.log(`❌ [API ERROR] ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    return Promise.reject(error);
  }
);

export default api;
