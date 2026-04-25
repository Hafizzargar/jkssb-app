import axios from 'axios';
import { Platform } from 'react-native';

// In development, use localhost for web, and your machine IP for mobile emulators
const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000' 
  : 'http://10.0.2.2:5000'; // Android emulator address for localhost

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

export default api;
