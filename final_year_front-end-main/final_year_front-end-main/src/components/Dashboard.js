import React, { useState, useEffect } from 'react';
import Home from './Home';

import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import TrafficChart from './TrafficChart';
import AttackDistribution from './AttackDistribution';
import AlertList from './AlertList';

const COLORS = ['#00ff87', '#ff3366', '#ffaa00', '#00aaff', '#aa00ff', '#ff6600'];

const Dashboard = ({
  modelInfo,
  monitoringActive,
  stats,
  logs,
  onStartMonitoring,
  onStopMonitoring,
  onClearLogs,
  onReset
}) => {
  const [simulating, setSimulating] = useState(false);
  const [mode, setMode] = useState('auto');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadMode = async () => {
      try {
        const api = (await import('../services/api')).default;
        const data = await api.getMode();
        setMode(data.mode);
      } catch {}
    };
    loadMode();
  }, []);

  const handleModeChange = async (event, newMode) => {
    if (!newMode) return;
    try {
      const api = (await import('../services/api')).default;
      await api.setMode(newMode);
      setMode(newMode);
      setSnackbar({ open: true, message: `Switched to ${newMode} mode`, severity: 'info' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to switch mode', severity: 'error' });
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      case 'LOW RISK': return 'info';
      case 'MONITOR': return 'secondary';
      default: return 'success';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'CRITICAL': return '🔴';
      case 'WARNING': return '🟡';
      case 'LOW RISK': return '🔵';
      case 'MONITOR': return '🟣';
      default: return '🟢';
    }
  };

  // Prepare data for pie chart
  const getPieData = () => {
    if (!stats?.attack_distribution) return [];
    return Object.entries(stats.attack_distribution)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  };

  // Prepare data for line chart
  const getLineData = () => {
    if (!logs || logs.length === 0) return [];
    return logs.slice(0, 20).reverse().map((log) => ({
      time: new Date(log.timestamp).toLocaleTimeString(),
      confidence: (log.confidence * 100).toFixed(1),
      severity: log.severity === 'CRITICAL' ? 3 : 
                log.severity === 'WARNING' ? 2 : 
                log.severity === 'LOW RISK' ? 1 : 0,
      isThreat: log.is_threat ? 1 : 0
    }));
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      // Import api dynamically to avoid circular dependency
      const api = (await import('../services/api')).default;
      const response = await api.simulateTraffic(10);
      setSnackbar({
        open: true,
        message: 'Traffic simulation completed successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to simulate traffic',
        severity: 'error'
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const pieData = getPieData();
  const lineData = getLineData();

  return (
    <Box>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: 40, color: '#00ff87' }} />
              <Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                  SecureNet AI Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time Network Intrusion Detection System
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                size="small"
                sx={{ bgcolor: '#2a2a2a', borderRadius: 1 }}
              >
                <ToggleButton value="auto" sx={{ color: mode === 'auto' ? '#00ff87' : '#888', px: 2 }}>
                  Auto
                </ToggleButton>
                <ToggleButton value="manual" sx={{ color: mode === 'manual' ? '#00ff87' : '#888', px: 2 }}>
                  Manual
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title={monitoringActive ? "Stop Monitoring" : "Start Monitoring"}>
                <Button
                  variant="contained"
                  color={monitoringActive ? "error" : "success"}
                  startIcon={monitoringActive ? <StopIcon /> : <PlayArrowIcon />}
                  onClick={monitoringActive ? onStopMonitoring : onStartMonitoring}
                  sx={{ fontWeight: 'bold' }}
                >
                  {monitoringActive ? "Stop Monitoring" : "Start Monitoring"}
                </Button>
              </Tooltip>
              <Tooltip title="Clear All Logs">
                <IconButton onClick={onClearLogs} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Dashboard">
                <IconButton onClick={() => window.location.reload()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Manual Mode Banner */}
      {mode === 'manual' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Manual Mode active</strong> — auto-generation is paused. Send flows via Postman:
            &nbsp;<strong>POST http://localhost:5000/api/monitoring/inject</strong>&nbsp;
            with your feature JSON. Results appear on the dashboard in real time.
          </Typography>
        </Alert>
      )}

      {/* Model Info Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Model Type
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {modelInfo?.model_type || 'CNN-LSTM'}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Seq Length: {modelInfo?.sequence_length || 5}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Model Accuracy
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00ff87' }}>
                {modelInfo?.accuracy || 97.41}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={modelInfo?.accuracy || 97.41} 
                sx={{ mt: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Attack Classes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {modelInfo?.num_classes || 6}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Categories detected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #e65c00 0%, #f9d423 100%)' }}>
            <CardContent>
              <Typography color="rgba(255,255,255,0.7)" gutterBottom>
                Input Features
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {modelInfo?.input_features || 78}
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                Network traffic features
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', background: '#1a1a1a' }}>
            <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
              {stats?.total_detections || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Detections
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', background: '#1a1a1a' }}>
            <Typography variant="h3" color="error" sx={{ fontWeight: 'bold' }}>
              {stats?.active_threats || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Threats
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', background: '#1a1a1a' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {Math.floor((stats?.monitoring_time || 0) / 60)}m {(stats?.monitoring_time || 0) % 60}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitoring Time
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', background: '#1a1a1a' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {monitoringActive ? '🟢 Active' : '⚪ Inactive'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System Status
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, background: '#1a1a1a' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Attack Distribution
            </Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  No attack data available yet
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, background: '#1a1a1a' }}>
            <Typography variant="h6" gutterBottom>
              Traffic Timeline
            </Typography>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" stroke="#888" />
                  <YAxis yAxisId="left" stroke="#888" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ff3366" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="confidence" stroke="#00ff87" name="Confidence %" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="severity" stroke="#ff3366" name="Severity Level" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  No traffic data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Alerts Table */}
      <Paper sx={{ p: 2, background: '#1a1a1a' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            Recent Alerts & Detections
          </Typography>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={handleSimulate}
            disabled={simulating}
          >
            {simulating ? 'Simulating...' : 'Simulate Traffic'}
          </Button>
        </Box>
        <AlertList logs={logs || []} />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
