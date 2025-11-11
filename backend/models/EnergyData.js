const { db, admin } = require('../config/firebase');

// Energy data collection reference
const energyDataCollection = db.collection('energyData');

// EnergyData model functions
const EnergyData = {
  // Create a new energy data record
  async create(data) {
    const docRef = energyDataCollection.doc();
    const energyData = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };
    await docRef.set(energyData);
    return { id: docRef.id, ...energyData };
  },

  // Find energy data with filters
  async find(filters = {}, limit = 100) {
    let query = energyDataCollection;
    
    if (filters.deviceId) {
      query = query.where('deviceId', '==', filters.deviceId);
    }
    
    if (filters.startDate) {
      query = query.where('timestamp', '>=', new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      query = query.where('timestamp', '<=', new Date(filters.endDate));
    }
    
    query = query.orderBy('timestamp', 'desc').limit(limit);
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Find one energy data record
  async findOne(filters = {}) {
    let query = energyDataCollection;
    
    if (filters.deviceId) {
      query = query.where('deviceId', '==', filters.deviceId);
    }
    
    query = query.orderBy('timestamp', 'desc').limit(1);
    
    const snapshot = await query.get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  // Find by ID
  async findById(id) {
    const doc = await energyDataCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  // Aggregate data (for daily, weekly, monthly reports)
  async aggregate(filters = {}, groupBy = 'day') {
    // Note: Firestore doesn't have built-in aggregation like MongoDB
    // We'll fetch the data and aggregate in memory
    let query = energyDataCollection;
    
    if (filters.deviceId) {
      query = query.where('deviceId', '==', filters.deviceId);
    }
    
    if (filters.startDate) {
      query = query.where('timestamp', '>=', new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      query = query.where('timestamp', '<=', new Date(filters.endDate));
    }
    
    query = query.orderBy('timestamp', 'asc');
    
    const snapshot = await query.get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group data by period
    const grouped = {};
    
    data.forEach(item => {
      const date = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
      let key;
      
      if (groupBy === 'day') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
        key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          deviceId: item.deviceId,
          totalEnergy: 0,
          phase1: { voltage: [], current: [], energy: 0 },
          phase2: { voltage: [], current: [], energy: 0 },
          phase3: { voltage: [], current: [], energy: 0 },
          count: 0
        };
      }
      
      grouped[key].totalEnergy += item.totalEnergy || 0;
      grouped[key].phase1.voltage.push(item.phase1?.voltage || 0);
      grouped[key].phase1.current.push(item.phase1?.current || 0);
      grouped[key].phase1.energy += item.phase1?.energy || 0;
      grouped[key].phase2.voltage.push(item.phase2?.voltage || 0);
      grouped[key].phase2.current.push(item.phase2?.current || 0);
      grouped[key].phase2.energy += item.phase2?.energy || 0;
      grouped[key].phase3.voltage.push(item.phase3?.voltage || 0);
      grouped[key].phase3.current.push(item.phase3?.current || 0);
      grouped[key].phase3.energy += item.phase3?.energy || 0;
      grouped[key].count++;
    });
    
    // Calculate averages and format result
    return Object.values(grouped).map(group => ({
      date: group.date,
      deviceId: group.deviceId,
      totalEnergy: group.totalEnergy,
      averageVoltage: {
        phase1: group.phase1.voltage.reduce((a, b) => a + b, 0) / group.count,
        phase2: group.phase2.voltage.reduce((a, b) => a + b, 0) / group.count,
        phase3: group.phase3.voltage.reduce((a, b) => a + b, 0) / group.count,
      },
      averageCurrent: {
        phase1: group.phase1.current.reduce((a, b) => a + b, 0) / group.count,
        phase2: group.phase2.current.reduce((a, b) => a + b, 0) / group.count,
        phase3: group.phase3.current.reduce((a, b) => a + b, 0) / group.count,
      },
      energy: {
        phase1: group.phase1.energy,
        phase2: group.phase2.energy,
        phase3: group.phase3.energy,
        total: group.totalEnergy
      },
      readingsCount: group.count
    }));
  }
};

module.exports = EnergyData;