import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';

class APIService {
  constructor() {
    this.socket = null;
  }

  // Initialize WebSocket connection
  connectWebSocket() {
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('new_detection', (data) => {
      console.log('New detection:', data);
    });

    this.socket.on('stats_update', (data) => {
      console.log('Stats update:', data);
    });

    return this.socket;
  }

  disconnectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  // Get model information
  async getModelInfo() {
    try {
      const response = await axios.get(`${API_BASE_URL}/model/info`);
      return response.data;
    } catch (error) {
      console.error('Model info error:', error);
      throw error;
    }
  }

  // Start monitoring
  async startMonitoring() {
    try {
      const response = await axios.post(`${API_BASE_URL}/monitoring/start`);
      return response.data;
    } catch (error) {
      console.error('Start monitoring error:', error);
      throw error;
    }
  }

  // Stop monitoring
  async stopMonitoring() {
    try {
      const response = await axios.post(`${API_BASE_URL}/monitoring/stop`);
      return response.data;
    } catch (error) {
      console.error('Stop monitoring error:', error);
      throw error;
    }
  }

  // Get monitoring status
  async getMonitoringStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/monitoring/status`);
      return response.data;
    } catch (error) {
      console.error('Get status error:', error);
      throw error;
    }
  }

  // Reset monitoring
  async resetMonitoring() {
    try {
      const response = await axios.post(`${API_BASE_URL}/monitoring/reset`);
      return response.data;
    } catch (error) {
      console.error('Reset error:', error);
      throw error;
    }
  }

  // Clear logs
  async clearLogs() {
    try {
      const response = await axios.post(`${API_BASE_URL}/monitoring/clear_logs`);
      return response.data;
    } catch (error) {
      console.error('Clear logs error:', error);
      throw error;
    }
  }

  // Single prediction
  async predict(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, data);
      return response.data;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  async getMode() {
    const response = await axios.get(`${API_BASE_URL}/monitoring/mode`);
    return response.data;
  }

  async setMode(mode) {
    const response = await axios.post(`${API_BASE_URL}/monitoring/mode`, { mode });
    return response.data;
  }

  async injectTraffic(features) {
    const response = await axios.post(`${API_BASE_URL}/monitoring/inject`, features);
    return response.data;
  }

  // Simulate traffic
  async simulateTraffic(numSamples = 10) {
    try {
      const response = await axios.post(`${API_BASE_URL}/simulate`, { num_samples: numSamples });
      return response.data;
    } catch (error) {
      console.error('Simulation error:', error);
      throw error;
    }
  }

  // Update alert threshold
  async updateThreshold(threshold) {
    try {
      const response = await axios.post(`${API_BASE_URL}/threshold`, { threshold });
      return response.data;
    } catch (error) {
      console.error('Update threshold error:', error);
      throw error;
    }
  }

  // Get threshold
  async getThreshold() {
    try {
      const response = await axios.get(`${API_BASE_URL}/threshold`);
      return response.data;
    } catch (error) {
      console.error('Get threshold error:', error);
      throw error;
    }
  }

  // Configure email
  async configureEmail(username, password, alertEmail) {
    try {
      const response = await axios.post(`${API_BASE_URL}/email/configure`, {
        username,
        password,
        alert_email: alertEmail
      });
      return response.data;
    } catch (error) {
      console.error('Email config error:', error);
      throw error;
    }
  }
}

export default new APIService();