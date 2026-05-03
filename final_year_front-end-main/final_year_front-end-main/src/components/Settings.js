import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Slider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Box,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import SecurityIcon from '@mui/icons-material/Security';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PaletteIcon from '@mui/icons-material/Palette';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';

const Settings = () => {
  const { isDarkMode, toggleTheme } = useOutletContext();
  const [threshold, setThreshold] = useState(80);
  const [emailConfig, setEmailConfig] = useState({
    username: '',
    password: '',
    alert_email: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadThreshold();
  }, []);

  const loadThreshold = async () => {
    try {
      const data = await api.getThreshold();
      setThreshold(data.threshold);
    } catch (error) {
      console.error('Failed to load threshold:', error);
    }
  };

  const handleThresholdChange = async (event, newValue) => {
    setThreshold(newValue);
  };

  const saveThreshold = async () => {
    try {
      await api.updateThreshold(threshold);
      setSnackbar({
        open: true,
        message: `Alert threshold updated to ${threshold}%`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update threshold',
        severity: 'error'
      });
    }
  };

  const handleEmailChange = (field) => (event) => {
    setEmailConfig({
      ...emailConfig,
      [field]: event.target.value
    });
  };

  const saveEmailConfig = async () => {
    try {
      await api.configureEmail(
        emailConfig.username,
        emailConfig.password,
        emailConfig.alert_email
      );
      setSnackbar({
        open: true,
        message: 'Email configuration saved',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save email configuration',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Grid container spacing={3}>
      {/* Theme Settings Card */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PaletteIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">Appearance Settings</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Brightness7Icon sx={{ mr: 1, color: isDarkMode ? 'text.secondary' : 'warning.main' }} />
              <Typography variant="body1">Light Mode</Typography>
            </Box>
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              color="primary"
              inputProps={{ 'aria-label': 'theme toggle' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Brightness4Icon sx={{ mr: 1, color: isDarkMode ? 'primary.main' : 'text.secondary' }} />
              <Typography variant="body1">Dark Mode</Typography>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Choose between light and dark themes for better visibility in different lighting conditions.
              Your preference will be saved automatically.
            </Typography>
          </Alert>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Theme Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: 1,
                borderColor: 'divider'
              }} />
              <Box sx={{ 
                width: 50, 
                height: 50, 
                bgcolor: 'primary.main', 
                borderRadius: 1 
              }} />
              <Box sx={{ 
                width: 50, 
                height: 50, 
                bgcolor: 'secondary.main', 
                borderRadius: 1 
              }} />
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Alert Threshold Card */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">Alert Threshold</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <Typography gutterBottom>
            Set confidence threshold for alerts: <strong>{threshold}%</strong>
          </Typography>
          <Slider
            value={threshold}
            onChange={handleThresholdChange}
            valueLabelDisplay="auto"
            step={5}
            marks={[
              { value: 50, label: '50%' },
              { value: 70, label: '70%' },
              { value: 80, label: '80%' },
              { value: 90, label: '90%' }
            ]}
            min={50}
            max={95}
            sx={{
              '& .MuiSlider-markLabel': {
                color: 'text.secondary',
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveThreshold}
            sx={{ mt: 2 }}
          >
            Save Threshold
          </Button>
        </Paper>
      </Grid>

      {/* Email Alerts Card */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">Email Alerts</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <TextField
            fullWidth
            label="SMTP Username (Gmail)"
            value={emailConfig.username}
            onChange={handleEmailChange('username')}
            placeholder="your-email@gmail.com"
            sx={{ mb: 2 }}
            InputLabelProps={{
              style: { color: 'text.secondary' }
            }}
          />
          <TextField
            fullWidth
            label="SMTP Password (App Password)"
            type="password"
            value={emailConfig.password}
            onChange={handleEmailChange('password')}
            placeholder="16-character app password"
            sx={{ mb: 2 }}
            InputLabelProps={{
              style: { color: 'text.secondary' }
            }}
          />
          <TextField
            fullWidth
            label="Alert Recipient Email"
            value={emailConfig.alert_email}
            onChange={handleEmailChange('alert_email')}
            placeholder="alerts@example.com"
            sx={{ mb: 3 }}
            InputLabelProps={{
              style: { color: 'text.secondary' }
            }}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveEmailConfig}
          >
            Save Email Configuration
          </Button>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              For Gmail, use an App Password instead of your regular password.
              Generate one at: Google Account → Security → App Passwords
            </Typography>
          </Alert>
        </Paper>
      </Grid>

      {/* System Information Card */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography color="primary.main" gutterBottom variant="subtitle2">
                    Model Architecture
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    CNN-LSTM with 2 Conv1D layers, 2 LSTM layers, and Dense layers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography color="primary.main" gutterBottom variant="subtitle2">
                    Features
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    78 network traffic features including packet statistics, flow duration, flags, etc.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography color="primary.main" gutterBottom variant="subtitle2">
                    Attack Categories
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    BENIGN, DoS, PortScan, DDoS, BruteForce, WebAttack, Bot
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

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
    </Grid>
  );
};

export default Settings;