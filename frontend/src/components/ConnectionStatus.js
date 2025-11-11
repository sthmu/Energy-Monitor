import React, { useState, useEffect, useContext } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { 
  Cloud as CloudIcon, 
  CloudOff as CloudOffIcon,
  Warning as WarningIcon 
} from '@mui/icons-material';
import { getSocket } from '../services/energyService';
import { NotificationContext } from '../contexts/NotificationContext';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('connecting'); // 'connected', 'disconnected', 'connecting', 'error'
  const [backendReachable, setBackendReachable] = useState(true);
  const { showNotification } = useContext(NotificationContext);

  useEffect(() => {
    const socket = getSocket();
    let backendCheckInterval;
    let hasShownDisconnectNotification = false;
    let hasShownConnectNotification = false;

    // Check backend HTTP availability
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/health', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setBackendReachable(true);
          if (!hasShownConnectNotification && !backendReachable) {
            showNotification('Backend connection restored', 'success');
            hasShownConnectNotification = true;
            hasShownDisconnectNotification = false;
          }
        } else {
          throw new Error('Backend returned error');
        }
      } catch (error) {
        setBackendReachable(false);
        if (!hasShownDisconnectNotification) {
          showNotification('Cannot connect to backend server. Please check if the server is running.', 'error');
          hasShownDisconnectNotification = true;
          hasShownConnectNotification = false;
        }
      }
    };

    // Initial check
    checkBackend();

    // Periodic checks every 10 seconds
    backendCheckInterval = setInterval(checkBackend, 10000);

    // Socket connection handlers
    socket.on('connect', () => {
      setStatus('connected');
      if (hasShownDisconnectNotification) {
        showNotification('Real-time connection established', 'success');
        hasShownDisconnectNotification = false;
      }
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
      if (!hasShownDisconnectNotification) {
        showNotification('Real-time connection lost', 'warning');
        hasShownDisconnectNotification = true;
      }
    });

    socket.on('connect_error', () => {
      setStatus('error');
    });

    socket.on('reconnecting', () => {
      setStatus('connecting');
    });

    return () => {
      clearInterval(backendCheckInterval);
    };
  }, [showNotification, backendReachable]);

  const getStatusConfig = () => {
    if (!backendReachable) {
      return {
        label: 'Backend Offline',
        color: 'error',
        icon: <CloudOffIcon />,
        tooltip: 'Cannot connect to backend server'
      };
    }

    switch (status) {
      case 'connected':
        return {
          label: 'Connected',
          color: 'success',
          icon: <CloudIcon />,
          tooltip: 'Real-time connection active'
        };
      case 'disconnected':
        return {
          label: 'Disconnected',
          color: 'warning',
          icon: <CloudOffIcon />,
          tooltip: 'Real-time connection lost'
        };
      case 'error':
        return {
          label: 'Connection Error',
          color: 'error',
          icon: <WarningIcon />,
          tooltip: 'Failed to establish connection'
        };
      case 'connecting':
      default:
        return {
          label: 'Connecting...',
          color: 'default',
          icon: <CloudIcon />,
          tooltip: 'Attempting to connect'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={config.tooltip}>
        <Chip
          icon={config.icon}
          label={config.label}
          color={config.color}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    </Box>
  );
};

export default ConnectionStatus;
