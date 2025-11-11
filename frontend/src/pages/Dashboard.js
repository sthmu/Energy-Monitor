import React, { useState, useEffect, useContext } from 'react';
import { Box, Grid, Paper, Typography, Button, ButtonGroup, Alert, CircularProgress } from '@mui/material';
import { 
  getLatestSensorData,
  getSensorHistory,
  getPhaseComparison,
  initSocket
} from '../services/energyService';
import { NotificationContext } from '../contexts/NotificationContext';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import EnergyMetrics from '../components/EnergyMetrics';

// Helper function to calculate average
const average = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

// Helper function to group data by time period
const groupDataByPeriod = (data, period) => {
  if (!data || data.length === 0) return [];
  
  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  if (period === 'day') {
    // Group by hour
    const hourlyData = {};
    sortedData.forEach(item => {
      const date = new Date(item.timestamp);
      const hourKey = `${date.getHours()}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          label: hourKey,
          phase1Current: [],
          phase2Current: [],
          phase3Current: [],
          phase1Voltage: [],
          phase2Voltage: [],
          phase3Voltage: []
        };
      }
      
      hourlyData[hourKey].phase1Current.push(item.phase1?.current || 0);
      hourlyData[hourKey].phase2Current.push(item.phase2?.current || 0);
      hourlyData[hourKey].phase3Current.push(item.phase3?.current || 0);
      hourlyData[hourKey].phase1Voltage.push(item.phase1?.voltage || 0);
      hourlyData[hourKey].phase2Voltage.push(item.phase2?.voltage || 0);
      hourlyData[hourKey].phase3Voltage.push(item.phase3?.voltage || 0);
    });
    
    // Calculate averages
    return Object.values(hourlyData).map(group => ({
      label: group.label,
      phase1Current: average(group.phase1Current),
      phase2Current: average(group.phase2Current),
      phase3Current: average(group.phase3Current),
      phase1Voltage: average(group.phase1Voltage),
      phase2Voltage: average(group.phase2Voltage),
      phase3Voltage: average(group.phase3Voltage)
    }));
    
  } else if (period === 'week') {
    // Group by day
    const dailyData = {};
    sortedData.forEach(item => {
      const date = new Date(item.timestamp);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          label: dayKey,
          phase1Current: [],
          phase2Current: [],
          phase3Current: [],
          phase1Voltage: [],
          phase2Voltage: [],
          phase3Voltage: []
        };
      }
      
      dailyData[dayKey].phase1Current.push(item.phase1?.current || 0);
      dailyData[dayKey].phase2Current.push(item.phase2?.current || 0);
      dailyData[dayKey].phase3Current.push(item.phase3?.current || 0);
      dailyData[dayKey].phase1Voltage.push(item.phase1?.voltage || 0);
      dailyData[dayKey].phase2Voltage.push(item.phase2?.voltage || 0);
      dailyData[dayKey].phase3Voltage.push(item.phase3?.voltage || 0);
    });
    
    return Object.values(dailyData).map(group => ({
      label: group.label,
      phase1Current: average(group.phase1Current),
      phase2Current: average(group.phase2Current),
      phase3Current: average(group.phase3Current),
      phase1Voltage: average(group.phase1Voltage),
      phase2Voltage: average(group.phase2Voltage),
      phase3Voltage: average(group.phase3Voltage)
    }));
    
  } else { // month
    // Group by week
    const weeklyData = {};
    sortedData.forEach(item => {
      const date = new Date(item.timestamp);
      const weekNum = Math.ceil(date.getDate() / 7);
      const weekKey = `Week ${weekNum}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          label: weekKey,
          phase1Current: [],
          phase2Current: [],
          phase3Current: [],
          phase1Voltage: [],
          phase2Voltage: [],
          phase3Voltage: []
        };
      }
      
      weeklyData[weekKey].phase1Current.push(item.phase1?.current || 0);
      weeklyData[weekKey].phase2Current.push(item.phase2?.current || 0);
      weeklyData[weekKey].phase3Current.push(item.phase3?.current || 0);
      weeklyData[weekKey].phase1Voltage.push(item.phase1?.voltage || 0);
      weeklyData[weekKey].phase2Voltage.push(item.phase2?.voltage || 0);
      weeklyData[weekKey].phase3Voltage.push(item.phase3?.voltage || 0);
    });
    
    return Object.values(weeklyData).map(group => ({
      label: group.label,
      phase1Current: average(group.phase1Current),
      phase2Current: average(group.phase2Current),
      phase3Current: average(group.phase3Current),
      phase1Voltage: average(group.phase1Voltage),
      phase2Voltage: average(group.phase2Voltage),
      phase3Voltage: average(group.phase3Voltage)
    }));
  }
};

const Dashboard = () => {
  const { showNotification } = useContext(NotificationContext);
  const [realtimeData, setRealtimeData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [phaseChartData, setPhaseChartData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [timeRange, setTimeRange] = useState('day'); // day, week, month
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const deviceId = 'DEVICE_001'; // Default device ID
  
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
        setError(null);
        
        console.log('📊 Dashboard: Fetching data for device:', deviceId);
        console.log('📊 Dashboard: Time range:', timeRange);
        
        // Calculate hours based on time range
        let hours;
        switch (timeRange) {
          case 'week':
            hours = 24 * 7; // 7 days
            break;
          case 'month':
            hours = 24 * 30; // 30 days
            break;
          default:
            hours = 24; // 1 day
        }
        
        // Get latest sensor data for real-time display
        console.log('📊 Dashboard: Fetching latest sensor data...');
        const latestData = await getLatestSensorData(deviceId);
        console.log('✅ Dashboard: Latest data received:', latestData);
        
        if (latestData.success && latestData.data) {
          setRealtimeData(latestData.data);
        }
        
        // Get historical data
        console.log(`📊 Dashboard: Fetching history for ${hours} hours...`);
        const historyResponse = await getSensorHistory(deviceId, hours);
        console.log('✅ Dashboard: History data received:', historyResponse);
        
        if (historyResponse.success && historyResponse.data) {
          const history = historyResponse.data;
          setHistoryData(history);
          
          // Prepare bar chart data for phase comparison
          if (history.length > 0) {
            // Group data by time periods and calculate averages
            const groupedData = groupDataByPeriod(history, timeRange);
            
            const chartData = {
              labels: groupedData.map(item => item.label),
              datasets: [
                {
                  label: 'Phase 1 Current (A)',
                  data: groupedData.map(item => item.phase1Current),
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                  borderColor: 'rgb(255, 99, 132)',
                  borderWidth: 1
                },
                {
                  label: 'Phase 2 Current (A)',
                  data: groupedData.map(item => item.phase2Current),
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                  borderColor: 'rgb(75, 192, 192)',
                  borderWidth: 1
                },
                {
                  label: 'Phase 3 Current (A)',
                  data: groupedData.map(item => item.phase3Current),
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                  borderColor: 'rgb(53, 162, 235)',
                  borderWidth: 1
                }
              ]
            };
            
            setPhaseChartData(chartData);
          }
        }
        
        // Get phase comparison statistics
        console.log('📊 Dashboard: Fetching phase statistics...');
        const statsResponse = await getPhaseComparison(deviceId);
        console.log('✅ Dashboard: Statistics received:', statsResponse);
        
        if (statsResponse.success && statsResponse.phases) {
          setStatistics(statsResponse.phases);
        }
        
        setLoading(false);
        console.log('✅ Dashboard: All data loaded successfully');
        
      } catch (err) {
        console.error('❌ Dashboard: Error fetching data:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
        setError(errorMessage);
        showNotification(
          err.code === 'ERR_NETWORK' 
            ? 'Cannot connect to server. Please check if the backend is running at http://172.200.84.132:5000' 
            : errorMessage,
          'error'
        );
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, deviceId, showNotification]);
  
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
        {/* Historical Power Consumption Line Chart */}
        <Grid item xs={12} md={6}>
          {historyData && historyData.length > 0 ? (
            <LineChart
              title={`Power Consumption - Last ${timeRange === 'day' ? '24 Hours' : timeRange === 'week' ? '7 Days' : '30 Days'}`}
              data={historyData.map(item => {
                const p1 = (item.phase1?.voltage || 0) * (item.phase1?.current || 0);
                const p2 = (item.phase2?.voltage || 0) * (item.phase2?.current || 0);
                const p3 = (item.phase3?.voltage || 0) * (item.phase3?.current || 0);
                return (p1 + p2 + p3) / 1000; // Convert to kW
              })}
              labels={historyData.map(item => new Date(item.timestamp))}
              xLabel="Time"
              yLabel="Power (kW)"
              timeUnit={timeRange === 'day' ? 'hour' : 'day'}
            />
          ) : (
            <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No historical data available</Typography>
            </Paper>
          )}
        </Grid>
        
        {/* Phase Current Comparison Bar Chart */}
        <Grid item xs={12} md={6}>
          {phaseChartData && phaseChartData.labels && phaseChartData.labels.length > 0 ? (
            <BarChart
              title={`Average Current by Phase - ${timeRange === 'day' ? 'Hourly' : timeRange === 'week' ? 'Daily' : 'Weekly'}`}
              labels={phaseChartData.labels}
              datasets={phaseChartData.datasets}
              xLabel="Time Period"
              yLabel="Current (A)"
            />
          ) : (
            <Paper sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No phase comparison data available</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Statistics Summary */}
      {statistics && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Phase Statistics Summary
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current readings from all three phases
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle1" color="primary">Phase 1</Typography>
              <Typography variant="body2">Voltage: {statistics.phase1?.voltage?.toFixed(2) || 'N/A'} V</Typography>
              <Typography variant="body2">Current: {statistics.phase1?.current?.toFixed(2) || 'N/A'} A</Typography>
              <Typography variant="body2">Power: {statistics.phase1?.power?.toFixed(2) || 'N/A'} W</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle1" color="primary">Phase 2</Typography>
              <Typography variant="body2">Voltage: {statistics.phase2?.voltage?.toFixed(2) || 'N/A'} V</Typography>
              <Typography variant="body2">Current: {statistics.phase2?.current?.toFixed(2) || 'N/A'} A</Typography>
              <Typography variant="body2">Power: {statistics.phase2?.power?.toFixed(2) || 'N/A'} W</Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle1" color="primary">Phase 3</Typography>
              <Typography variant="body2">Voltage: {statistics.phase3?.voltage?.toFixed(2) || 'N/A'} V</Typography>
              <Typography variant="body2">Current: {statistics.phase3?.current?.toFixed(2) || 'N/A'} A</Typography>
              <Typography variant="body2">Power: {statistics.phase3?.power?.toFixed(2) || 'N/A'} W</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;