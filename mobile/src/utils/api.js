import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { toast } from '../components/Toast';

/**
 * 🌐 ADVANCED API CLIENT
 * This client automatically resolves the backend address based on your environment.
 */

// 🚀 BACKEND CONFIGURATION
const PRODUCTION_URL = 'https://jkssb-app.onrender.com/api';

/**
 * 🏠 LOCAL DEVELOPMENT TIPS:
 * - Android Emulator: Use 'http://10.0.2.2:5000/api'
 * - iOS Simulator: Use 'http://localhost:5000/api'
 * - Physical Device: Use your PC's IP (e.g., 'http://192.168.1.XX:5000/api')
 */
const LOCAL_URL = 'http://10.41.155.92:5000/api'; // PC's Wi-Fi IP for Physical Device

const getBaseUrl = () => {
  // If we are in development mode, use the local server
  if (__DEV__) {
    console.log('🛠️ [API] Development mode: Using local server');
    return LOCAL_URL;
  }
  
  // Use Production URL if you are building a release version (APK)
  return PRODUCTION_URL;
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
    const message = error.response?.data?.message || error.message;
    
    if (error.message === 'Network Error') {
      toast(`Network Error: Cannot reach server.`, 'error');
      console.error(`❌ [NETWORK ERROR] Cannot reach: ${BASE_URL}.`);
    } else {
      toast(message, 'error');
      console.log(`❌ [API ERROR] ${error.response?.status} - ${message}`);
    }
    return Promise.reject(error);
  }
);

export default api;
