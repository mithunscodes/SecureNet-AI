import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography } from '@mui/material';

const COLORS = ['#00ff87', '#ff3366', '#ffaa00', '#00aaff', '#aa00ff', '#ff6600'];

const AttackDistribution = ({ distribution }) => {
  if (!distribution) return null;
  
  const data = Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Typography variant="body2" color="text.secondary">
          No attack data available yet
        </Typography>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AttackDistribution;