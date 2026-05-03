import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Typography
} from '@mui/material';

const AlertList = ({ logs }) => {
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

  if (!logs || logs.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', background: '#1a1a1a' }}>
        <Typography variant="body2" color="text.secondary">
          No alerts detected yet. Start monitoring to see live alerts.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#0a0a0a' }}>
            <TableCell>Time</TableCell>
            <TableCell>Source IP</TableCell>
            <TableCell>Destination IP</TableCell>
            <TableCell>Attack Type</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Severity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log, index) => (
            <TableRow 
              key={index}
              sx={{ 
                '&:hover': { backgroundColor: '#2a2a2a' },
                backgroundColor: log.severity === 'CRITICAL' ? 'rgba(255, 51, 102, 0.1)' : 'inherit'
              }}
            >
              <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
              <TableCell>{log.source_ip}</TableCell>
              <TableCell>{log.dest_ip}</TableCell>
              <TableCell>
                <Chip 
                  label={log.attack_type} 
                  size="small"
                  color={log.attack_type === 'BENIGN' ? 'success' : 'error'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{(log.confidence * 100).toFixed(1)}%</TableCell>
              <TableCell>
                <Chip 
                  label={`${getSeverityIcon(log.severity)} ${log.severity}`}
                  size="small"
                  color={getSeverityColor(log.severity)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AlertList;