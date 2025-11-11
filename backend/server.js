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
// POST endpoint for GSM/Arduino to send sensor data
app.post('/api/sensor/data', async (req, res) => {
  try {
    console.log('📡 Incoming sensor data:', JSON.stringify(req.body, null, 2));
    
    const io = req.app.get('io');
    const { 
      deviceId, 
      phase1, 
      phase2, 
      phase3, 
      totalPower, 
      frequency 
    } = req.body;
    
    // Validate required fields
    if (!deviceId) {
      console.log('❌ Missing deviceId');
      return res.status(400).json({ 
        success: false,
        message: 'deviceId is required',
        example: {
          deviceId: "DEVICE_001",
          phase1: { voltage: 230, current: 20, power: 4600 },
          phase2: { voltage: 230, current: 20, power: 4600 },
          phase3: { voltage: 230, current: 20, power: 4600 },
          totalPower: 13800,
          frequency: 50.0
        }
      });
    }

    // Validate phase data structure
    const validatePhase = (phase, phaseNum) => {
      if (!phase || typeof phase !== 'object') {
        throw new Error(`phase${phaseNum} must be an object with voltage, current, and power`);
      }
      if (phase.voltage === undefined || phase.current === undefined || phase.power === undefined) {
        throw new Error(`phase${phaseNum} must include voltage, current, and power`);
      }
      if (isNaN(phase.voltage) || isNaN(phase.current) || isNaN(phase.power)) {
        throw new Error(`phase${phaseNum} values must be valid numbers`);
      }
    };

    try {
      validatePhase(phase1, 1);
      validatePhase(phase2, 2);
      validatePhase(phase3, 3);
    } catch (validationError) {
      console.log('❌ Validation error:', validationError.message);
      return res.status(400).json({ 
        success: false,
        message: validationError.message,
        example: {
          deviceId: "DEVICE_001",
          phase1: { voltage: 230, current: 20, power: 4600 },
          phase2: { voltage: 230, current: 20, power: 4600 },
          phase3: { voltage: 230, current: 20, power: 4600 },
          totalPower: 13800,
          frequency: 50.0
        }
      });
    }

    const timestamp = new Date();
    
    // Calculate total power if not provided
    const calculatedTotalPower = totalPower || 
      (parseFloat(phase1.power) + parseFloat(phase2.power) + parseFloat(phase3.power));
    
    // Store data in Firestore
    const docRef = db.collection('sensorData').doc();
    await docRef.set({
      deviceId,
      timestamp,
      phase1: {
        voltage: parseFloat(phase1.voltage),
        current: parseFloat(phase1.current),
        power: parseFloat(phase1.power)
      },
      phase2: {
        voltage: parseFloat(phase2.voltage),
        current: parseFloat(phase2.current),
        power: parseFloat(phase2.power)
      },
      phase3: {
        voltage: parseFloat(phase3.voltage),
        current: parseFloat(phase3.current),
        power: parseFloat(phase3.power)
      },
      totalPower: calculatedTotalPower,
      frequency: frequency ? parseFloat(frequency) : 50.0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update device info
    await db.collection('devices').doc(deviceId).set({
      deviceId,
      lastSeenAt: timestamp,
      isActive: true,
      lastData: {
        totalPower: calculatedTotalPower,
        frequency: frequency || 50.0
      }
    }, { merge: true });

    // Emit real-time update via WebSocket
    io.emit('sensor-update', {
      deviceId,
      timestamp,
      phase1,
      phase2,
      phase3,
      totalPower: calculatedTotalPower,
      frequency: frequency || 50.0
    });

    console.log('✅ Data saved successfully:', deviceId, 'Total Power:', calculatedTotalPower, 'W');

    // Success response
    res.status(201).json({ 
      success: true,
      message: 'Data received and stored successfully',
      timestamp,
      deviceId,
      totalPower: calculatedTotalPower,
      documentId: docRef.id
    });

  } catch (error) {
    console.error('❌ Sensor data error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST endpoint for sending CURRENT data only
app.post('/api/sensor/current', async (req, res) => {
  try {
    console.log('⚡ Incoming current data:', JSON.stringify(req.body, null, 2));
    
    const io = req.app.get('io');
    const { deviceId, phase1, phase2, phase3 } = req.body;
    
    // Validate required fields
    if (!deviceId) {
      console.log('❌ Missing deviceId');
      return res.status(400).json({ 
        success: false,
        message: 'deviceId is required',
        example: {
          deviceId: "DEVICE_001",
          phase1: 20.5,
          phase2: 19.8,
          phase3: 21.2
        }
      });
    }

    // Validate current values
    if (phase1 === undefined || phase2 === undefined || phase3 === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'phase1, phase2, and phase3 current values are required',
        example: {
          deviceId: "DEVICE_001",
          phase1: 20.5,
          phase2: 19.8,
          phase3: 21.2
        }
      });
    }

    const timestamp = new Date();
    
    // Store current data
    const docRef = db.collection('currentReadings').doc();
    await docRef.set({
      deviceId,
      timestamp,
      phase1: parseFloat(phase1),
      phase2: parseFloat(phase2),
      phase3: parseFloat(phase3),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update device info
    await db.collection('devices').doc(deviceId).set({
      deviceId,
      lastSeenAt: timestamp,
      isActive: true,
      lastCurrents: {
        phase1: parseFloat(phase1),
        phase2: parseFloat(phase2),
        phase3: parseFloat(phase3)
      }
    }, { merge: true });

    // Emit real-time update
    io.emit('current-update', {
      deviceId,
      timestamp,
      phase1: parseFloat(phase1),
      phase2: parseFloat(phase2),
      phase3: parseFloat(phase3)
    });

    console.log('✅ Current data saved:', deviceId, 'Phase1:', phase1, 'A');

    res.status(201).json({ 
      success: true,
      message: 'Current data received and stored successfully',
      timestamp,
      deviceId,
      currents: {
        phase1: parseFloat(phase1),
        phase2: parseFloat(phase2),
        phase3: parseFloat(phase3)
      },
      documentId: docRef.id
    });

  } catch (error) {
    console.error('❌ Current data error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST endpoint for sending VOLTAGE data only
app.post('/api/sensor/voltage', async (req, res) => {
  try {
    console.log('⚡ Incoming voltage data:', JSON.stringify(req.body, null, 2));
    
    const io = req.app.get('io');
    const { deviceId, phase1, phase2, phase3, frequency } = req.body;
    
    // Validate required fields
    if (!deviceId) {
      console.log('❌ Missing deviceId');
      return res.status(400).json({ 
        success: false,
        message: 'deviceId is required',
        example: {
          deviceId: "DEVICE_001",
          phase1: 230.5,
          phase2: 229.8,
          phase3: 231.2,
          frequency: 50.0
        }
      });
    }

    // Validate voltage values
    if (phase1 === undefined || phase2 === undefined || phase3 === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'phase1, phase2, and phase3 voltage values are required',
        example: {
          deviceId: "DEVICE_001",
          phase1: 230.5,
          phase2: 229.8,
          phase3: 231.2,
          frequency: 50.0
        }
      });
    }

    const timestamp = new Date();
    
    // Store voltage data
    const docRef = db.collection('voltageReadings').doc();
    await docRef.set({
      deviceId,
      timestamp,
      phase1: parseFloat(phase1),
      phase2: parseFloat(phase2),
      phase3: parseFloat(phase3),
      frequency: frequency ? parseFloat(frequency) : 50.0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update device info
    await db.collection('devices').doc(deviceId).set({
      deviceId,
      lastSeenAt: timestamp,
      isActive: true,
      lastVoltages: {
        phase1: parseFloat(phase1),
        phase2: parseFloat(phase2),
        phase3: parseFloat(phase3)
      },
      frequency: frequency ? parseFloat(frequency) : 50.0
    }, { merge: true });

    // Emit real-time update
    io.emit('voltage-update', {
      deviceId,
      timestamp,
      phase1: parseFloat(phase1),
      phase2: parseFloat(phase2),
      phase3: parseFloat(phase3),
      frequency: frequency ? parseFloat(frequency) : 50.0
    });

    console.log('✅ Voltage data saved:', deviceId, 'Phase1:', phase1, 'V');

    res.status(201).json({ 
      success: true,
      message: 'Voltage data received and stored successfully',
      timestamp,
      deviceId,
      voltages: {
        phase1: parseFloat(phase1),
        phase2: parseFloat(phase2),
        phase3: parseFloat(phase3)
      },
      frequency: frequency ? parseFloat(frequency) : 50.0,
      documentId: docRef.id
    });

  } catch (error) {
    console.error('❌ Voltage data error:', error);
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