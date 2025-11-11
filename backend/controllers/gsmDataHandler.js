const EnergyData = require('../models/EnergyData');

// Handle incoming data from GSM module
exports.handleGSMData = async (req, res) => {
  try {
    const io = req.app.get('io'); // Get socket.io instance
    
    // Parse and validate the incoming data
    // GSM data format will depend on your hardware setup
    const { deviceId, phase1, phase2, phase3, totalEnergy } = req.body;
    
    if (!deviceId || !totalEnergy) {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    
    // Create new energy data record
    const energyData = new EnergyData({
      deviceId,
      phase1: {
        voltage: phase1?.voltage || 0,
        current: phase1?.current || 0,
        power: phase1?.power || 0,
        energy: phase1?.energy || 0
      },
      phase2: {
        voltage: phase2?.voltage || 0,
        current: phase2?.current || 0,
        power: phase2?.power || 0,
        energy: phase2?.energy || 0
      },
      phase3: {
        voltage: phase3?.voltage || 0,
        current: phase3?.current || 0,
        power: phase3?.power || 0,
        energy: phase3?.energy || 0
      },
      totalEnergy
    });
    
    // Save to database
    await energyData.save();
    
    // Emit real-time data to connected clients
    io.emit('energy-update', {
      deviceId,
      timestamp: energyData.timestamp,
      phase1: energyData.phase1,
      phase2: energyData.phase2,
      phase3: energyData.phase3,
      totalEnergy: energyData.totalEnergy
    });
    
    res.status(201).json({ 
      message: 'Data received and processed successfully',
      id: energyData._id
    });
    
  } catch (error) {
    console.error('GSM data handling error:', error);
    res.status(500).json({ message: 'Server error while processing GSM data' });
  }
};

// Function to parse GSM data depending on your hardware format
// Modify according to your specific GSM data format
exports.parseGSMData = (rawData) => {
  try {
    // Example implementation - modify based on your GSM data format
    // This assumes data comes in a specific format like: 
    // "DEV001,V1:220,I1:5.2,V2:230,I2:4.8,V3:225,I3:5.0,TE:1.25"
    
    const parts = rawData.split(',');
    const deviceId = parts[0];
    const data = {
      deviceId,
      phase1: { voltage: 0, current: 0, power: 0, energy: 0 },
      phase2: { voltage: 0, current: 0, power: 0, energy: 0 },
      phase3: { voltage: 0, current: 0, power: 0, energy: 0 },
      totalEnergy: 0
    };
    
    // Parse each part
    parts.slice(1).forEach(part => {
      const [key, value] = part.split(':');
      
      switch(key) {
        case 'V1':
          data.phase1.voltage = parseFloat(value);
          break;
        case 'I1':
          data.phase1.current = parseFloat(value);
          // Calculate power P = V * I
          data.phase1.power = data.phase1.voltage * data.phase1.current;
          break;
        case 'V2':
          data.phase2.voltage = parseFloat(value);
          break;
        case 'I2':
          data.phase2.current = parseFloat(value);
          data.phase2.power = data.phase2.voltage * data.phase2.current;
          break;
        case 'V3':
          data.phase3.voltage = parseFloat(value);
          break;
        case 'I3':
          data.phase3.current = parseFloat(value);
          data.phase3.power = data.phase3.voltage * data.phase3.current;
          break;
        case 'TE':
          data.totalEnergy = parseFloat(value);
          break;
        // Add more cases if needed
      }
    });
    
    // Calculate energies if not directly provided
    // This is simplified; in a real scenario, you would integrate power over time
    const timeInHours = 1/60; // Assuming readings every minute (convert to hours)
    data.phase1.energy = data.phase1.power * timeInHours;
    data.phase2.energy = data.phase2.power * timeInHours;
    data.phase3.energy = data.phase3.power * timeInHours;
    
    // If total energy not provided, sum from phases
    if (data.totalEnergy === 0) {
      data.totalEnergy = data.phase1.energy + data.phase2.energy + data.phase3.energy;
    }
    
    return data;
    
  } catch (error) {
    console.error('Error parsing GSM data:', error);
    throw new Error('Invalid data format');
  }
};