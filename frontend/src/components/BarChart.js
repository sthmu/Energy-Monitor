import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Box, Paper, Typography } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ title, data, labels, datasets, xLabel, yLabel }) => {
  // Prepare chart data
  const chartData = {
    labels,
    datasets: datasets || [
      {
        label: 'Energy Usage (kWh)',
        data: data || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title || 'Energy Usage Comparison',
      }
    },
    scales: {
      x: {
        title: {
          display: Boolean(xLabel),
          text: xLabel || '',
        }
      },
      y: {
        title: {
          display: Boolean(yLabel),
          text: yLabel || '',
        },
        beginAtZero: true
      }
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title || 'Energy Usage Comparison'}
      </Typography>
      <Box sx={{ height: 300 }}>
        <Bar data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

export default BarChart;