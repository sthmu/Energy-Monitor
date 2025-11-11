import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || '';
let socket;

// Log configuration on startup
console.log('🔧 Energy Service Configuration:');
console.log('   API_URL:', API_URL || 'Not configured (using relative paths)');
console.log('   Environment:', process.env.NODE_ENV);
console.log('   REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000; // 10 second timeout

// Add request interceptor for detailed logging
axios.interceptors.request.use(
  config => {
    const fullUrl = `${config.baseURL || ''}${config.url}`;
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: fullUrl,
      params: config.params,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling and logging
axios.interceptors.response.use(
  response => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      responseData: error.response?.data
    });
    
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
  console.log('🔌 Initializing Socket.io connection...');
  console.log('   Socket API_URL:', API_URL);
  
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('   Socket ID:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server');
      console.log('   Reason:', reason);
    });
    
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', {
        message: error.message,
        type: error.type,
        description: error.description
      });
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
  console.log('🔌 Disconnecting Socket.io...');
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('✅ Socket disconnected');
  }
};

// Get latest sensor data for a device (replaces getRealtimeData)
export const getLatestSensorData = async (deviceId = 'DEVICE_001') => {
  console.log(`📊 Fetching latest sensor data for device: ${deviceId}`);
  try {
    const response = await axios.get(`/api/sensor/latest/${deviceId}`);
    console.log('✅ Latest sensor data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching latest sensor data:', error);
    throw error;
  }
};

// Get sensor history for a device (replaces getDailyEnergyData)
export const getSensorHistory = async (deviceId = 'DEVICE_001', hours = 24) => {
  console.log(`📊 Fetching sensor history for device: ${deviceId}, hours: ${hours}`);
  try {
    const response = await axios.get(`/api/sensor/history/${deviceId}`, {
      params: { hours }
    });
    console.log('✅ Sensor history received:', {
      recordCount: response.data?.data?.length || 0,
      data: response.data
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching sensor history:', error);
    throw error;
  }
};

// Get phase comparison data for a device
export const getPhaseComparison = async (deviceId = 'DEVICE_001') => {
  console.log(`📊 Fetching phase comparison for device: ${deviceId}`);
  try {
    const response = await axios.get(`/api/sensor/phases/${deviceId}`);
    console.log('✅ Phase comparison data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching phase comparison:', error);
    throw error;
  }
};

// DEPRECATED - Use getLatestSensorData instead
export const getRealtimeData = async (deviceId) => {
  console.warn('⚠️ getRealtimeData is deprecated, use getLatestSensorData instead');
  return getLatestSensorData(deviceId);
};

// DEPRECATED - Use getSensorHistory instead
export const getDailyEnergyData = async (filters = {}) => {
  console.warn('⚠️ getDailyEnergyData is deprecated, use getSensorHistory instead');
  const deviceId = filters.deviceId || 'DEVICE_001';
  return getSensorHistory(deviceId, 24);
};

// DEPRECATED - Not supported by current backend
export const getWeeklyEnergyData = async (filters = {}) => {
  console.warn('⚠️ getWeeklyEnergyData is not supported by backend, using getSensorHistory instead');
  const deviceId = filters.deviceId || 'DEVICE_001';
  return getSensorHistory(deviceId, 24 * 7); // 7 days
};

// DEPRECATED - Not supported by current backend
export const getMonthlyEnergyData = async (filters = {}) => {
  console.warn('⚠️ getMonthlyEnergyData is not supported by backend, using getSensorHistory instead');
  const deviceId = filters.deviceId || 'DEVICE_001';
  return getSensorHistory(deviceId, 24 * 30); // 30 days
};

// DEPRECATED - Use getPhaseComparison for phase statistics
export const getStatistics = async (filters = {}) => {
  console.warn('⚠️ getStatistics is deprecated, use getPhaseComparison instead');
  const deviceId = filters.deviceId || 'DEVICE_001';
  return getPhaseComparison(deviceId);
};