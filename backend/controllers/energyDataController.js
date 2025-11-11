const EnergyData = require('../models/EnergyData');

// Get energy data with filters
exports.getEnergyData = async (req, res) => {
  try {
    const { deviceId, startDate, endDate, limit = 100 } = req.query;
    
    const filters = {};
    
    if (deviceId) filters.deviceId = deviceId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const data = await EnergyData.find(filters, parseInt(limit));
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching energy data:', error);
    res.status(500).json({ message: 'Server error while fetching energy data' });
  }
};

// Get daily aggregated data
exports.getDailyEnergyData = async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query;
    
    const filters = {};
    if (deviceId) filters.deviceId = deviceId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const data = await EnergyData.aggregate(filters, 'day');
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching daily energy data:', error);
    res.status(500).json({ message: 'Server error while fetching daily energy data' });
  }
};

// Get weekly aggregated data
exports.getWeeklyEnergyData = async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query;
    
    const query = [];
    
    // Match stage with filters
    const matchStage = {};
    
    if (deviceId) {
      matchStage.deviceId = deviceId;
    }
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) {
        matchStage.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.timestamp.$lte = new Date(endDate);
      }
    }
    
    query.push({ $match: matchStage });
    
    // Group by week
    query.push({
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          week: { $week: "$timestamp" },
          deviceId: "$deviceId"
        },
        startDate: { $first: "$timestamp" },
        totalEnergy: { $sum: "$totalEnergy" },
        averagePhase1Voltage: { $avg: "$phase1.voltage" },
        averagePhase2Voltage: { $avg: "$phase2.voltage" },
        averagePhase3Voltage: { $avg: "$phase3.voltage" },
        averagePhase1Current: { $avg: "$phase1.current" },
        averagePhase2Current: { $avg: "$phase2.current" },
        averagePhase3Current: { $avg: "$phase3.current" },
        totalPhase1Energy: { $sum: "$phase1.energy" },
        totalPhase2Energy: { $sum: "$phase2.energy" },
        totalPhase3Energy: { $sum: "$phase3.energy" },
        count: { $sum: 1 }
      }
    });
    
    // Sort by week
    query.push({
      $sort: { 
        "_id.year": 1, 
        "_id.week": 1 
      }
    });
    
    // Project for final format
    query.push({
      $project: {
        _id: 0,
        year: "$_id.year",
        week: "$_id.week",
        startDate: 1,
        deviceId: "$_id.deviceId",
        totalEnergy: 1,
        averageVoltage: {
          phase1: "$averagePhase1Voltage",
          phase2: "$averagePhase2Voltage",
          phase3: "$averagePhase3Voltage"
        },
        averageCurrent: {
          phase1: "$averagePhase1Current",
          phase2: "$averagePhase2Current",
          phase3: "$averagePhase3Current"
        },
        energy: {
          phase1: "$totalPhase1Energy",
          phase2: "$totalPhase2Energy",
          phase3: "$totalPhase3Energy",
          total: "$totalEnergy"
        },
        readingsCount: "$count"
      }
    });
    
    const data = await EnergyData.aggregate(query);
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching weekly energy data:', error);
    res.status(500).json({ message: 'Server error while fetching weekly energy data' });
  }
};

// Get monthly aggregated data
exports.getMonthlyEnergyData = async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query;
    
    const query = [];
    
    // Match stage with filters
    const matchStage = {};
    
    if (deviceId) {
      matchStage.deviceId = deviceId;
    }
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) {
        matchStage.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.timestamp.$lte = new Date(endDate);
      }
    }
    
    query.push({ $match: matchStage });
    
    // Group by month
    query.push({
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          deviceId: "$deviceId"
        },
        firstDayOfMonth: { $first: "$timestamp" },
        totalEnergy: { $sum: "$totalEnergy" },
        averagePhase1Voltage: { $avg: "$phase1.voltage" },
        averagePhase2Voltage: { $avg: "$phase2.voltage" },
        averagePhase3Voltage: { $avg: "$phase3.voltage" },
        averagePhase1Current: { $avg: "$phase1.current" },
        averagePhase2Current: { $avg: "$phase2.current" },
        averagePhase3Current: { $avg: "$phase3.current" },
        totalPhase1Energy: { $sum: "$phase1.energy" },
        totalPhase2Energy: { $sum: "$phase2.energy" },
        totalPhase3Energy: { $sum: "$phase3.energy" },
        count: { $sum: 1 }
      }
    });
    
    // Sort by year and month
    query.push({
      $sort: { 
        "_id.year": 1, 
        "_id.month": 1 
      }
    });
    
    // Project for final format
    query.push({
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        firstDayOfMonth: 1,
        deviceId: "$_id.deviceId",
        totalEnergy: 1,
        averageVoltage: {
          phase1: "$averagePhase1Voltage",
          phase2: "$averagePhase2Voltage",
          phase3: "$averagePhase3Voltage"
        },
        averageCurrent: {
          phase1: "$averagePhase1Current",
          phase2: "$averagePhase2Current",
          phase3: "$averagePhase3Current"
        },
        energy: {
          phase1: "$totalPhase1Energy",
          phase2: "$totalPhase2Energy",
          phase3: "$totalPhase3Energy",
          total: "$totalEnergy"
        },
        readingsCount: "$count"
      }
    });
    
    const data = await EnergyData.aggregate(query);
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching monthly energy data:', error);
    res.status(500).json({ message: 'Server error while fetching monthly energy data' });
  }
};

// Get real-time data
exports.getRealtimeData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get the most recent entry for this device
    const latestData = await EnergyData.findOne({ deviceId })
      .sort({ timestamp: -1 })
      .limit(1);
    
    if (!latestData) {
      return res.status(404).json({ message: 'No data found for this device' });
    }
    
    res.status(200).json(latestData);
    
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    res.status(500).json({ message: 'Server error while fetching real-time data' });
  }
};

// Get statistics and summaries
exports.getStatistics = async (req, res) => {
  try {
    const { deviceId, period = 'day' } = req.query;
    
    // Set date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1); // Default to one day
    }
    
    // Build query
    const query = {};
    
    if (deviceId) {
      query.deviceId = deviceId;
    }
    
    query.timestamp = { $gte: startDate, $lte: endDate };
    
    // Aggregate statistics
    const stats = await EnergyData.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        totalEnergy: { $sum: "$totalEnergy" },
        avgPhase1Voltage: { $avg: "$phase1.voltage" },
        avgPhase2Voltage: { $avg: "$phase2.voltage" },
        avgPhase3Voltage: { $avg: "$phase3.voltage" },
        maxPhase1Current: { $max: "$phase1.current" },
        maxPhase2Current: { $max: "$phase2.current" },
        maxPhase3Current: { $max: "$phase3.current" },
        totalPhase1Energy: { $sum: "$phase1.energy" },
        totalPhase2Energy: { $sum: "$phase2.energy" },
        totalPhase3Energy: { $sum: "$phase3.energy" },
        minTimestamp: { $min: "$timestamp" },
        maxTimestamp: { $max: "$timestamp" },
        count: { $sum: 1 }
      }}
    ]);
    
    if (stats.length === 0) {
      return res.status(404).json({ message: 'No data found for the specified period' });
    }
    
    // Format the result
    const result = {
      period,
      startDate: stats[0].minTimestamp,
      endDate: stats[0].maxTimestamp,
      totalEnergyKWh: stats[0].totalEnergy,
      averageVoltage: {
        phase1: stats[0].avgPhase1Voltage,
        phase2: stats[0].avgPhase2Voltage,
        phase3: stats[0].avgPhase3Voltage
      },
      maxCurrent: {
        phase1: stats[0].maxPhase1Current,
        phase2: stats[0].maxPhase2Current,
        phase3: stats[0].maxPhase3Current
      },
      energyByPhase: {
        phase1: stats[0].totalPhase1Energy,
        phase2: stats[0].totalPhase2Energy,
        phase3: stats[0].totalPhase3Energy
      },
      readingsCount: stats[0].count
    };
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
};