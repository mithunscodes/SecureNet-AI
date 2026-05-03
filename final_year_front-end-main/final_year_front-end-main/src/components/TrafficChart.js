import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrafficChart = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>No traffic data available</p>
      </div>
    );
  }

  const data = logs.slice(0, 20).reverse().map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString(),
    confidence: (log.confidence * 100).toFixed(1),
    severity: log.severity === 'CRITICAL' ? 3 : 
              log.severity === 'WARNING' ? 2 : 
              log.severity === 'LOW RISK' ? 1 : 0
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="time" stroke="#888" />
        <YAxis yAxisId="left" stroke="#888" />
        <YAxis yAxisId="right" orientation="right" stroke="#ff3366" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
        />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="confidence" stroke="#00ff87" name="Confidence %" />
        <Line yAxisId="right" type="monotone" dataKey="severity" stroke="#ff3366" name="Severity Level" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrafficChart;