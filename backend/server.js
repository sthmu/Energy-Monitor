require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { db } = require('./config/firebase');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('📱 New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test Firestore connection
    await db.collection('_health').doc('test').set({ 
      timestamp: new Date(),
      status: 'healthy' 
    });
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date(),
      database: 'connected',
      service: 'Energy Monitoring API'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Arduino endpoint - receives current data
app.post('/api/sensor/data', async (req, res) => {
  try {
    const io = req.app.get('io');
    const { deviceId, data } = req.body;
    
    // Validate input
    if (!deviceId || data === undefined || data === null) {
      return res.status(400).json({ 
        success: false,
        message: 'deviceId and data are required' 
      });
    }

    // Parse current value
    const current = parseFloat(data);
    if (isNaN(current)) {
      return res.status(400).json({ 
        success: false,
        message: 'data must be a valid number' 
      });
    }

    const timestamp = new Date();
    
    // Store data for all 3 phases in Firestore
    const batch = db.batch();
    
    for (let phase = 1; phase <= 3; phase++) {
      const docRef = db.collection('sensorData').doc();
      batch.set(docRef, {
        deviceId,
        timestamp,
        phase,
        current,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();

    // Update device info
    await db.collection('devices').doc(deviceId).set({
      deviceId,
      lastSeenAt: timestamp,
      lastCurrent: current,
      isActive: true
    }, { merge: true });

    // Emit real-time update
    io.emit('sensor-update', {
      deviceId,
      timestamp,
      current,
      phases: [
        { phase: 1, current },
        { phase: 2, current },
        { phase: 3, current }
      ]
    });

    // Success response
    res.status(201).json({ 
      success: true,
      message: 'Data received successfully',
      timestamp,
      deviceId,
      current
    });

  } catch (error) {
    console.error('Sensor data error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get latest sensor data
app.get('/api/sensor/latest/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const snapshot = await db.collection('sensorData')
      .where('deviceId', '==', deviceId)
      .orderBy('timestamp', 'desc')
      .limit(3)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        success: false,
        message: 'No data found for device' 
      });
    }

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    res.status(200).json({ 
      success: true,
      deviceId,
      data
    });

  } catch (error) {
    console.error('Get latest data error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get historical data
app.get('/api/sensor/history/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24, phase } = req.query;

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours));

    let query = db.collection('sensorData')
      .where('deviceId', '==', deviceId)
      .where('timestamp', '>=', hoursAgo)
      .orderBy('timestamp', 'desc');

    if (phase) {
      query = query.where('phase', '==', parseInt(phase));
    }

    const snapshot = await query.limit(1000).get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    res.status(200).json({ 
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all phases current reading
app.get('/api/sensor/phases/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get latest reading for each phase
    const phases = [];
    
    for (let phase = 1; phase <= 3; phase++) {
      const snapshot = await db.collection('sensorData')
        .where('deviceId', '==', deviceId)
        .where('phase', '==', phase)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        phases.push({
          phase,
          current: doc.data().current,
          timestamp: doc.data().timestamp?.toDate()
        });
      }
    }

    res.status(200).json({ 
      success: true,
      deviceId,
      phases
    });

  } catch (error) {
    console.error('Get phases error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📊 Firebase Firestore connected');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };