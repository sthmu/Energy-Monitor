require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');

// Initialize Firebase
const db = admin.firestore();

async function addDummyData() {
  try {
    console.log('🔄 Adding dummy sensor data to Firebase...\n');

    const deviceId = 'DEVICE_001';
    const now = Date.now();

    // Generate 24 hours of dummy data (one reading per hour)
    const dummyData = [];
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000); // Go back i hours
      
      // Generate realistic power consumption data for 3 phases
      const phase1Voltage = 230 + (Math.random() * 10 - 5); // 225-235V
      const phase2Voltage = 230 + (Math.random() * 10 - 5);
      const phase3Voltage = 230 + (Math.random() * 10 - 5);
      
      const phase1Current = 15 + (Math.random() * 10); // 15-25A
      const phase2Current = 15 + (Math.random() * 10);
      const phase3Current = 15 + (Math.random() * 10);
      
      const phase1Power = phase1Voltage * phase1Current;
      const phase2Power = phase2Voltage * phase2Current;
      const phase3Power = phase3Voltage * phase3Current;
      
      const totalPower = phase1Power + phase2Power + phase3Power;
      
      dummyData.push({
        deviceId,
        timestamp,
        phase1: {
          voltage: parseFloat(phase1Voltage.toFixed(2)),
          current: parseFloat(phase1Current.toFixed(2)),
          power: parseFloat(phase1Power.toFixed(2)),
        },
        phase2: {
          voltage: parseFloat(phase2Voltage.toFixed(2)),
          current: parseFloat(phase2Current.toFixed(2)),
          power: parseFloat(phase2Power.toFixed(2)),
        },
        phase3: {
          voltage: parseFloat(phase3Voltage.toFixed(2)),
          current: parseFloat(phase3Current.toFixed(2)),
          power: parseFloat(phase3Power.toFixed(2)),
        },
        totalPower: parseFloat(totalPower.toFixed(2)),
        frequency: 50.0,
      });
    }

    // Add data to Firestore
    const batch = db.batch();
    
    dummyData.forEach((data) => {
      const docRef = db.collection('sensorData').doc();
      batch.set(docRef, data);
    });

    await batch.commit();

    console.log('✅ Successfully added', dummyData.length, 'dummy sensor readings!');
    console.log('\n📊 Sample data:');
    console.log('Device ID:', deviceId);
    console.log('Time range:', new Date(dummyData[0].timestamp).toISOString(), 'to', new Date(dummyData[dummyData.length - 1].timestamp).toISOString());
    console.log('Total Power Range:', Math.min(...dummyData.map(d => d.totalPower)).toFixed(2), 'W to', Math.max(...dummyData.map(d => d.totalPower)).toFixed(2), 'W');
    console.log('\n🌐 You can now view this data in your dashboard at: http://172.200.84.132');
    
  } catch (error) {
    console.error('❌ Error adding dummy data:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  addDummyData();
}

module.exports = { addDummyData };
