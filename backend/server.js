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
    
    console.log('📊 Latest data request for device:', deviceId);

    const snapshot = await db.collection('sensorData')
      .where('deviceId', '==', deviceId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log('⚠️ No data found for device:', deviceId);
      return res.status(404).json({ 
        success: false,
        message: `No data found for device ${deviceId}. The device may not be connected or no data has been recorded yet.`,
        deviceId,
        connected: false,
        suggestion: 'To test with dummy data, run: node scripts/addDummyData.js'
      });
    }

    const doc = snapshot.docs[0];
    const data = {
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    };

    // Check if data is recent (within last 5 minutes = device is "connected")
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    const isRecent = data.timestamp >= fiveMinutesAgo;

    console.log('✅ Latest data found:', { 
      deviceId, 
      timestamp: data.timestamp,
      connected: isRecent 
    });

    res.status(200).json({ 
      success: true,
      deviceId,
      connected: isRecent,
      lastSeen: data.timestamp,
      data
    });

  } catch (error) {
    console.error('❌ Get latest data error:', error);
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
    const { 
      hours, 
      days, 
      weeks, 
      months,
      startDate,
      endDate,
      limit = 1000 
    } = req.query;

    console.log('📊 History request:', { deviceId, hours, days, weeks, months, startDate, endDate });

    // Calculate time range based on query parameters
    let timeStart = new Date();
    
    if (startDate) {
      // Custom date range
      timeStart = new Date(startDate);
    } else if (months) {
      timeStart.setMonth(timeStart.getMonth() - parseInt(months));
    } else if (weeks) {
      timeStart.setDate(timeStart.getDate() - (parseInt(weeks) * 7));
    } else if (days) {
      timeStart.setDate(timeStart.getDate() - parseInt(days));
    } else if (hours) {
      timeStart.setHours(timeStart.getHours() - parseInt(hours));
    } else {
      // Default to 24 hours
      timeStart.setHours(timeStart.getHours() - 24);
    }

    const timeEnd = endDate ? new Date(endDate) : new Date();

    console.log('📅 Time range:', { 
      start: timeStart.toISOString(), 
      end: timeEnd.toISOString() 
    });

    let query = db.collection('sensorData')
      .where('deviceId', '==', deviceId)
      .where('timestamp', '>=', timeStart)
      .where('timestamp', '<=', timeEnd)
      .orderBy('timestamp', 'desc');

    const snapshot = await query.limit(parseInt(limit)).get();

    if (snapshot.empty) {
      console.log('⚠️ No data found for device:', deviceId);
      return res.status(404).json({ 
        success: false,
        message: `No data found for device ${deviceId}. The device may not be connected or no data has been recorded yet.`,
        count: 0,
        data: [],
        suggestion: 'Run the dummy data script: node scripts/addDummyData.js'
      });
    }

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    console.log('✅ Found', data.length, 'records');

    res.status(200).json({ 
      success: true,
      count: data.length,
      timeRange: {
        start: timeStart,
        end: timeEnd
      },
      data
    });

  } catch (error) {
    console.error('❌ Get history error:', error);
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
    
    console.log('📊 Phase comparison request for device:', deviceId);
    
    // Get latest reading with all phases
    const snapshot = await db.collection('sensorData')
      .where('deviceId', '==', deviceId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log('⚠️ No phase data found for device:', deviceId);
      return res.status(404).json({ 
        success: false,
        message: `No phase data found for device ${deviceId}. The device may not be connected or no data has been recorded yet.`,
        deviceId,
        connected: false,
        phases: [],
        suggestion: 'To test with dummy data, run: node scripts/addDummyData.js'
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const phases = [
      {
        phase: 1,
        voltage: data.phase1?.voltage || 0,
        current: data.phase1?.current || 0,
        power: data.phase1?.power || 0
      },
      {
        phase: 2,
        voltage: data.phase2?.voltage || 0,
        current: data.phase2?.current || 0,
        power: data.phase2?.power || 0
      },
      {
        phase: 3,
        voltage: data.phase3?.voltage || 0,
        current: data.phase3?.current || 0,
        power: data.phase3?.power || 0
      }
    ];

    // Check if data is recent (within last 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    const timestamp = data.timestamp?.toDate();
    const isRecent = timestamp >= fiveMinutesAgo;

    console.log('✅ Phase data found:', { 
      deviceId, 
      phases: phases.length,
      connected: isRecent 
    });

    res.status(200).json({ 
      success: true,
      deviceId,
      connected: isRecent,
      lastSeen: timestamp,
      totalPower: data.totalPower || 0,
      frequency: data.frequency || 0,
      phases
    });

  } catch (error) {
    console.error('❌ Get phases error:', error);
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