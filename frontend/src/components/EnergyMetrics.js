import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import {
  ElectricalServices as ElectricalServicesIcon,
  BoltOutlined as VoltageIcon,
  EvStation as CurrentIcon,
  Power as PowerIcon,
  Speed as GaugeIcon
} from '@mui/icons-material';

const MetricCard = ({ title, value, unit, icon, color }) => {
  const IconComponent = icon || ElectricalServicesIcon;
  
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconComponent sx={{ color: color || 'primary.main', mr: 1 }} />
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
        <Typography variant="h4" component="div" fontWeight="medium">
          {typeof value === 'number' ? value.toFixed(2) : value || '0'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>
          {unit || ''}
        </Typography>
      </Box>
    </Paper>
  );
};

const EnergyMetrics = ({ data }) => {
  if (!data) {
    return (
      <Typography variant="body1" color="text.secondary">
        No energy data available
      </Typography>
    );
  }
  
  return (
    <Grid container spacing={2}>
      {/* Total Energy */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Energy"
          value={data.totalEnergy}
          unit="kWh"
          icon={PowerIcon}
          color="#1976d2"
        />
      </Grid>
      
      {/* Phase 1 */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 1 Voltage"
          value={data.phase1?.voltage}
          unit="V"
          icon={VoltageIcon}
          color="#e53935"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 1 Current"
          value={data.phase1?.current}
          unit="A"
          icon={CurrentIcon}
          color="#e53935"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 1 Power"
          value={data.phase1?.power}
          unit="W"
          icon={GaugeIcon}
          color="#e53935"
        />
      </Grid>
      
      {/* Phase 2 */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 2 Voltage"
          value={data.phase2?.voltage}
          unit="V"
          icon={VoltageIcon}
          color="#43a047"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 2 Current"
          value={data.phase2?.current}
          unit="A"
          icon={CurrentIcon}
          color="#43a047"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 2 Power"
          value={data.phase2?.power}
          unit="W"
          icon={GaugeIcon}
          color="#43a047"
        />
      </Grid>
      
      {/* Phase 3 */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 3 Voltage"
          value={data.phase3?.voltage}
          unit="V"
          icon={VoltageIcon}
          color="#fb8c00"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 3 Current"
          value={data.phase3?.current}
          unit="A"
          icon={CurrentIcon}
          color="#fb8c00"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Phase 3 Power"
          value={data.phase3?.power}
          unit="W"
          icon={GaugeIcon}
          color="#fb8c00"
        />
      </Grid>
    </Grid>
  );
};

export default EnergyMetrics;