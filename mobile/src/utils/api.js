import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { toast } from '../components/Toast';

/**
 * 🌐 ADVANCED API CLIENT
 * This client automatically resolves the backend address based on your environment.
 */

// 🚀 PRODUCTION BACKEND URL (Change this once deployed on Render)
const PRODUCTION_URL = 'https://jkssb-app.onrender.com/api';

const getBaseUrl = () => {
  // 1. Check for manually set override in env (if you have one)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2. Use Production URL if you are building a release version (APK)
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
