import axios from 'axios';
import { toast } from '../components/Toast';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const hostUri = Constants.expoConfig?.hostUri;
const machineIP = hostUri ? hostUri.split(':')[0] : '10.0.2.2';

const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000/api' 
  : `http://${machineIP}:5000/api`;

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// GLOBAL ERROR INTERCEPTOR
client.interceptors.response.use(
  (response) => {
    // Show success toasts for specific methods if needed
    if (response.config.method === 'post' && response.data.message) {
      // Uncomment if you want automatic success toasts
      // toast(response.data.message, 'success');
    }
    return response;
  },
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);
    const message = error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    
    // Automatically show the toast for all errors
    toast(message, 'error');
    
    return Promise.reject(error);
  }
);

export default client;
