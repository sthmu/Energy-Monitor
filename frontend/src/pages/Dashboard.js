import React, { useState, useEffect, useContext } from 'react';
import { Box, Grid, Paper, Typography, Button, ButtonGroup, Alert, CircularProgress } from '@mui/material';
import { 
  getDailyEnergyData, 
  getRealtimeData, 
  getStatistics,
  initSocket
} from '../services/energyService';
import { NotificationContext } from '../contexts/NotificationContext';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import EnergyMetrics from '../components/EnergyMetrics';

const Dashboard = () => {
  const { showNotification } = useContext(NotificationContext);
  const [realtimeData, setRealtimeData] = useState(null);
  const [dailyEnergyData, setDailyEnergyData] = useState([]);
  const [phaseComparison, setPhaseComparison] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [timeRange, setTimeRange] = useState('day'); // day, week, month
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize socket connection for real-time updates
  useEffect(() => {
    const socket = initSocket();
    
    socket.on('energy-update', (data) => {
      setRealtimeData(data);
    });
    
    return () => {
      socket.off('energy-update');
    };
  }, []);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get real-time data
        const realtime = await getRealtimeData('device1'); // Assuming a default device ID
        setRealtimeData(realtime);
        
        // Get daily energy data
        const endDate = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          default:
            startDate.setDate(startDate.getDate() - 1); // Default to one day
        }
        
        const dailyData = await getDailyEnergyData({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          deviceId: 'device1' // Same device ID
        });
        
        setDailyEnergyData(dailyData);
        
        // Create phase comparison data
        if (dailyData.length > 0) {
          const phaseData = {
            labels: dailyData.map(item => new Date(item.date)),
            datasets: [
              {
                label: 'Phase 1',
                data: dailyData.map(item => item.energy.phase1),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
              },
              {
                label: 'Phase 2',
                data: dailyData.map(item => item.energy.phase2),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
              },
              {
                label: 'Phase 3',
                data: dailyData.map(item => item.energy.phase3),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                borderColor: 'rgb(53, 162, 235)',
              }
            ]
          };
          
          setPhaseComparison(phaseData);
        }
        
        // Get statistics
        const stats = await getStatistics({ period: timeRange });
        setStatistics(stats);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
        setError(errorMessage);
        showNotification(
          err.code === 'ERR_NETWORK' 
            ? 'Cannot connect to server. Please check if the backend is running.' 
            : errorMessage,
          'error'
        );
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, showNotification]);
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8 
      }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Unable to Load Dashboard
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          sx={{ mt: 2 }} 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Energy Monitoring Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze your three-phase energy consumption
        </Typography>
      </Box>
      
      {/* Time range selector */}
      <Box sx={{ mb: 3 }}>
        <ButtonGroup variant="outlined">
          <Button 
            onClick={() => handleTimeRangeChange('day')} 
            variant={timeRange === 'day' ? 'contained' : 'outlined'}
          >
            Day
          </Button>
          <Button 
            onClick={() => handleTimeRangeChange('week')} 
            variant={timeRange === 'week' ? 'contained' : 'outlined'}
          >
            Week
          </Button>
          <Button 
            onClick={() => handleTimeRangeChange('month')} 
            variant={timeRange === 'month' ? 'contained' : 'outlined'}
          >
            Month
          </Button>
        </ButtonGroup>
      </Box>
      
      {/* Real-time metrics */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Real-time Energy Metrics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Last updated: {realtimeData ? new Date(realtimeData.timestamp).toLocaleString() : 'N/A'}
        </Typography>
        
        <EnergyMetrics data={realtimeData} />
      </Paper>
      
      {/* Charts */}
      <Grid container spacing={3}>
        {/* Daily Energy Consumption */}
        <Grid item xs={12} md={6}>
          <LineChart
            title="Energy Consumption Over Time"
            data={dailyEnergyData.map(item => item.totalEnergy)}
            labels={dailyEnergyData.map(item => new Date(item.date))}
            xLabel="Date"
            yLabel="Energy (kWh)"
            timeUnit={timeRange === 'day' ? 'hour' : timeRange === 'week' ? 'day' : 'month'}
          />
        </Grid>
        
        {/* Phase Comparison */}
        <Grid item xs={12} md={6}>
          <BarChart
            title="Energy Usage by Phase"
            labels={phaseComparison.labels}
            datasets={phaseComparison.datasets}
            xLabel="Date"
            yLabel="Energy (kWh)"
          />
        </Grid>
      </Grid>
      
      {/* Statistics Summary */}
      {statistics && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Energy Statistics Summary
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Period: {new Date(statistics.startDate).toLocaleDateString()} - {new Date(statistics.endDate).toLocaleDateString()}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Total Energy Consumption:</Typography>
              <Typography variant="h5">{statistics.totalEnergyKWh.toFixed(2)} kWh</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Average Voltage:</Typography>
              <Typography variant="body1">Phase 1: {statistics.averageVoltage.phase1.toFixed(2)} V</Typography>
              <Typography variant="body1">Phase 2: {statistics.averageVoltage.phase2.toFixed(2)} V</Typography>
              <Typography variant="body1">Phase 3: {statistics.averageVoltage.phase3.toFixed(2)} V</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Max Current:</Typography>
              <Typography variant="body1">Phase 1: {statistics.maxCurrent.phase1.toFixed(2)} A</Typography>
              <Typography variant="body1">Phase 2: {statistics.maxCurrent.phase2.toFixed(2)} A</Typography>
              <Typography variant="body1">Phase 3: {statistics.maxCurrent.phase3.toFixed(2)} A</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1">Energy by Phase:</Typography>
              <Typography variant="body1">Phase 1: {statistics.energyByPhase.phase1.toFixed(2)} kWh</Typography>
              <Typography variant="body1">Phase 2: {statistics.energyByPhase.phase2.toFixed(2)} kWh</Typography>
              <Typography variant="body1">Phase 3: {statistics.energyByPhase.phase3.toFixed(2)} kWh</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;