const express = require('express');
const router = express.Router();
const energyDataController = require('../controllers/energyDataController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Get energy data with various filters
router.get('/', energyDataController.getEnergyData);
router.get('/daily', energyDataController.getDailyEnergyData);
router.get('/weekly', energyDataController.getWeeklyEnergyData);
router.get('/monthly', energyDataController.getMonthlyEnergyData);

// Get real-time data
router.get('/real-time/:deviceId', energyDataController.getRealtimeData);

// Get statistics and summaries
router.get('/statistics', energyDataController.getStatistics);

module.exports = router;