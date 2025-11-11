import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || '';
let socket;

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000; // 10 second timeout

// Add response interceptor for better error handling
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      error.message = 'Unable to connect to the server. Please check if the backend is running.';
    } else if (error.response) {
      // Server responded with error
      error.message = error.response.data?.message || `Server error: ${error.response.status}`;
    }
    return Promise.reject(error);
  }
);

// Initialize Socket.io connection
export const initSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }
  
  return socket;
};

// Get socket instance
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get energy data with filters
export const getEnergyData = async (filters = {}) => {
  try {
    const response = await axios.get('/api/energy-data', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching energy data:', error);
    throw error;
  }
};

// Get daily energy data
export const getDailyEnergyData = async (filters = {}) => {
  try {
    const response = await axios.get('/api/energy-data/daily', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily energy data:', error);
    throw error;
  }
};

// Get weekly energy data
export const getWeeklyEnergyData = async (filters = {}) => {
  try {
    const response = await axios.get('/api/energy-data/weekly', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly energy data:', error);
    throw error;
  }
};

// Get monthly energy data
export const getMonthlyEnergyData = async (filters = {}) => {
  try {
    const response = await axios.get('/api/energy-data/monthly', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly energy data:', error);
    throw error;
  }
};

// Get real-time data for a device
export const getRealtimeData = async (deviceId) => {
  try {
    const response = await axios.get(`/api/energy-data/real-time/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching real-time energy data:', error);
    throw error;
  }
};

// Get statistics
export const getStatistics = async (filters = {}) => {
  try {
    const response = await axios.get('/api/energy-data/statistics', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching energy statistics:', error);
    throw error;
  }
};