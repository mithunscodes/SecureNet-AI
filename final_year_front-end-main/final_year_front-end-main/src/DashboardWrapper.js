// DashboardWrapper.js (located in src/ folder)
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import api from './services/api';
import { toast } from 'react-toastify';

function DashboardWrapper() {
  const [modelInfo, setModelInfo] = useState(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    loadModelInfo();
    
    const ws = api.connectWebSocket();
    setSocket(ws);
    
    ws.on('new_detection', (data) => {
      if (data.attack_type !== 'BENIGN') {
        toast.warning(`Attack detected: ${data.attack_type} (${(data.confidence * 100).toFixed(1)}%)`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
      setLogs(prev => [data, ...prev].slice(0, 50));
    });
    
    ws.on('stats_update', (data) => {
      setStats(data);
    });
    
    const interval = setInterval(updateStatus, 3000);
    
    return () => {
      clearInterval(interval);
      api.disconnectWebSocket();
    };
  }, []);

  const loadModelInfo = async () => {
    try {
      const info = await api.getModelInfo();
      setModelInfo(info);
    } catch (error) {
      console.error('Failed to load model info:', error);
      toast.error('Failed to connect to backend server');
    }
  };

  const updateStatus = async () => {
    try {
      const status = await api.getMonitoringStatus();
      setMonitoringActive(status.active);
      setStats(status.stats);
      setLogs(status.current_logs || []);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const startMonitoring = async () => {
    try {
      await api.startMonitoring();
      toast.success('Monitoring started');
      updateStatus();
    } catch (error) {
      toast.error('Failed to start monitoring');
    }
  };

  const stopMonitoring = async () => {
    try {
      await api.stopMonitoring();
      toast.info('Monitoring stopped');
      updateStatus();
    } catch (error) {
      toast.error('Failed to stop monitoring');
    }
  };

  const clearLogs = async () => {
    try {
      await api.clearLogs();
      setLogs([]);
      toast.success('Logs cleared');
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

  const resetMonitoring = async () => {
    try {
      await api.resetMonitoring();
      toast.info('Monitoring reset');
      updateStatus();
    } catch (error) {
      toast.error('Failed to reset monitoring');
    }
  };

  return (
    <Dashboard
      modelInfo={modelInfo}
      monitoringActive={monitoringActive}
      stats={stats}
      logs={logs}
      onStartMonitoring={startMonitoring}
      onStopMonitoring={stopMonitoring}
      onClearLogs={clearLogs}
      onReset={resetMonitoring}
    />
  );
}

export default DashboardWrapper;