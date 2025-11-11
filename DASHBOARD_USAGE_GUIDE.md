# 📊 Dashboard Usage Guide - Energy Monitoring System

## 🔍 Understanding the 404 Error

### What was happening:
Your frontend was trying to call **non-existent endpoints** like:
- ❌ `/api/energy-data/real-time/device1` (doesn't exist)
- ❌ `/api/energy-data/daily` (doesn't exist)
- ❌ `/api/energy-data/statistics` (doesn't exist)

### What your backend actually has:
- ✅ `/api/sensor/latest/:deviceId` - Get latest reading
- ✅ `/api/sensor/history/:deviceId` - Get historical data (with filters!)
- ✅ `/api/sensor/phases/:deviceId` - Get 3-phase comparison

---

## 🛠️ What I Fixed

### 1. **Frontend (`energyService.js`)**
- ✅ Added detailed console logging (you'll see EVERYTHING in browser console)
- ✅ Fixed API endpoints to match your backend
- ✅ Made old functions redirect to new ones (backward compatible)
- ✅ Every API call now logs: request URL, params, response, errors

### 2. **Backend (`server.js`)**
- ✅ Added flexible time filters: `hours`, `days`, `weeks`, `months`
- ✅ Added device connection detection (checks if data is recent)
- ✅ Improved error messages when device not found
- ✅ Returns helpful suggestions when database is empty
- ✅ Console logging for all requests

---

## 📅 New Time Filter Options

### Using the History Endpoint

**Base URL**: `GET /api/sensor/history/:deviceId`

**Query Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `hours` | Last X hours | `?hours=24` (last 24 hours) |
| `days` | Last X days | `?days=7` (last 7 days) |
| `weeks` | Last X weeks | `?weeks=4` (last 4 weeks) |
| `months` | Last X months | `?months=3` (last 3 months) |
| `startDate` | Custom start date | `?startDate=2024-01-01T00:00:00Z` |
| `endDate` | Custom end date | `?endDate=2024-12-31T23:59:59Z` |
| `limit` | Max records | `?limit=500` (default 1000) |

### Examples:

**Last 24 hours (default):**
```bash
curl http://172.200.84.132:5000/api/sensor/history/DEVICE_001
```

**Last 7 days:**
```bash
curl "http://172.200.84.132:5000/api/sensor/history/DEVICE_001?days=7"
```

**Last 30 days:**
```bash
curl "http://172.200.84.132:5000/api/sensor/history/DEVICE_001?days=30"
```

**Last 3 months:**
```bash
curl "http://172.200.84.132:5000/api/sensor/history/DEVICE_001?months=3"
```

**Custom date range:**
```bash
curl "http://172.200.84.132:5000/api/sensor/history/DEVICE_001?startDate=2024-11-01&endDate=2024-11-12"
```

**Last week with limited results:**
```bash
curl "http://172.200.84.132:5000/api/sensor/history/DEVICE_001?weeks=1&limit=100"
```

---

## 🔌 Device Connection Status

### How it works:
The backend now checks if the latest data is **within the last 5 minutes**:
- ✅ **Connected**: Data is fresh (< 5 minutes old)
- ❌ **Disconnected**: No data or data is old (> 5 minutes)

### Response includes:
```json
{
  "success": true,
  "deviceId": "DEVICE_001",
  "connected": true,  // ← Device status
  "lastSeen": "2024-11-12T10:30:00.000Z",
  "data": { ... }
}
```

### When device is NOT connected (404 response):
```json
{
  "success": false,
  "message": "No data found for device DEVICE_001. The device may not be connected or no data has been recorded yet.",
  "deviceId": "DEVICE_001",
  "connected": false,
  "suggestion": "To test with dummy data, run: node scripts/addDummyData.js"
}
```

---

## 🧪 Testing Without Hardware

### Step 1: Run Dummy Data Script on VM

```bash
# SSH to your VM
ssh jagath@172.200.84.132

# Navigate to backend
cd ~/energy-monitoring/Energy-Monitor/backend

# Pull latest changes (includes fixed script!)
git pull origin production

# Run the dummy data script
node scripts/addDummyData.js
```

**Expected Output:**
```
✅ Firebase initialized successfully
📊 Project ID: energy-monitoring-system-s
🔄 Adding dummy sensor data to Firebase...

✅ Successfully added 25 dummy sensor readings!

📊 Sample data:
Device ID: DEVICE_001
Time range: 2024-11-11T10:00:00.000Z to 2024-11-12T10:00:00.000Z
Total Power Range: 13500 W to 15000 W

🌐 You can now view this data in your dashboard at: http://172.200.84.132
```

### Step 2: Update Deployment

```bash
# Still on VM

# Restart backend to apply changes
pm2 restart energy-backend

# Check logs
pm2 logs energy-backend

# Pull frontend changes
cd ~/energy-monitoring/Energy-Monitor/frontend
git pull origin production

# Rebuild frontend with increased memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Fix permissions
sudo chmod -R 755 build/

# Restart Nginx
sudo systemctl restart nginx
```

### Step 3: View Dashboard

Open browser: `http://172.200.84.132`

**Open Developer Console (F12)** to see detailed logs:
```
🔧 Energy Service Configuration:
   API_URL: http://172.200.84.132:5000
   Environment: production

📤 API Request:
   method: GET
   url: http://172.200.84.132:5000/api/sensor/latest/DEVICE_001

✅ API Response:
   url: /api/sensor/latest/DEVICE_001
   status: 200
   data: { success: true, connected: false, ... }
```

---

## 📊 Understanding Your Data

### Data Structure in Firebase

**Collection**: `sensorData`

**Document Format**:
```json
{
  "deviceId": "DEVICE_001",
  "timestamp": "2024-11-12T10:00:00.000Z",
  "phase1": {
    "voltage": 230.5,
    "current": 20.3,
    "power": 4678.15
  },
  "phase2": {
    "voltage": 229.8,
    "current": 19.7,
    "power": 4527.06
  },
  "phase3": {
    "voltage": 231.2,
    "current": 21.1,
    "power": 4878.32
  },
  "totalPower": 14083.53,
  "frequency": 50.0
}
```

### What the Dummy Data Creates:
- ✅ **25 readings** (one per hour for 24 hours + current)
- ✅ **Realistic values**:
  - Voltage: 225-235V per phase
  - Current: 15-25A per phase
  - Power: Calculated (voltage × current)
  - Total: Sum of all 3 phases
  - Frequency: 50.0 Hz

---

## 🎯 How to Use Chart Filters

### In Your React Dashboard Component:

The `getSensorHistory()` function now supports all filter options:

```javascript
import { getSensorHistory } from '../services/energyService';

// Get last 24 hours (default)
const data = await getSensorHistory('DEVICE_001');

// Get last 7 days
const weekData = await getSensorHistory('DEVICE_001', null, { days: 7 });

// Get last 30 days
const monthData = await getSensorHistory('DEVICE_001', null, { days: 30 });

// Get last 3 months
const quarterData = await getSensorHistory('DEVICE_001', null, { months: 3 });

// Custom date range
const customData = await getSensorHistory('DEVICE_001', null, {
  startDate: '2024-11-01',
  endDate: '2024-11-12'
});
```

### Example: Add Filter Buttons to Dashboard

```javascript
const [timeFilter, setTimeFilter] = useState('day');
const [chartData, setChartData] = useState([]);

const fetchDataByFilter = async (filter) => {
  let queryParams = {};
  
  switch(filter) {
    case 'day':
      queryParams = { hours: 24 };
      break;
    case 'week':
      queryParams = { days: 7 };
      break;
    case 'month':
      queryParams = { days: 30 };
      break;
    case 'year':
      queryParams = { months: 12 };
      break;
  }
  
  const data = await getSensorHistory('DEVICE_001', null, queryParams);
  setChartData(data.data);
  setTimeFilter(filter);
};

// In your JSX:
<ButtonGroup>
  <Button onClick={() => fetchDataByFilter('day')}>Day</Button>
  <Button onClick={() => fetchDataByFilter('week')}>Week</Button>
  <Button onClick={() => fetchDataByFilter('month')}>Month</Button>
  <Button onClick={() => fetchDataByFilter('year')}>Year</Button>
</ButtonGroup>
```

---

## 🚀 Next Steps

### 1. **Populate Database**
```bash
# On VM
cd ~/energy-monitoring/Energy-Monitor/backend
node scripts/addDummyData.js
```

### 2. **Update Deployment**
```bash
# Pull latest code
cd ~/energy-monitoring/Energy-Monitor
git pull origin production

# Restart backend
cd backend
pm2 restart energy-backend

# Rebuild frontend
cd ../frontend
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
sudo chmod -R 755 build/
sudo systemctl restart nginx
```

### 3. **Test Dashboard**
- Open: `http://172.200.84.132`
- Open browser console (F12)
- Watch the detailed logs
- You should see charts with 24 hours of data!

### 4. **Verify in Firebase Console**
- Go to: https://console.firebase.google.com
- Project: `energy-monitoring-system-s`
- Navigate to: Firestore Database → `sensorData`
- You should see 25 documents

---

## 🐛 Troubleshooting

### Still seeing 404 errors?

**Check browser console:**
```
📤 API Request: GET http://172.200.84.132:5000/api/sensor/history/DEVICE_001
❌ API Error: status 404
```

**Solution**: Database is empty, run dummy data script

### Dashboard shows "Unable to Load Dashboard"?

**Check PM2 logs on VM:**
```bash
pm2 logs energy-backend --lines 50
```

**Look for:**
```
⚠️ No data found for device: DEVICE_001
```

**Solution**: Run dummy data script

### Backend not responding?

**Check if backend is running:**
```bash
pm2 status
# Should show: energy-backend | online

# If not running:
pm2 start server.js --name energy-backend
```

### Frontend not showing new changes?

**Rebuild frontend:**
```bash
cd ~/energy-monitoring/Energy-Monitor/frontend
git pull origin production
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
sudo chmod -R 755 build/
sudo systemctl restart nginx

# Clear browser cache: Ctrl+Shift+R
```

---

## 📝 API Reference Summary

### 1. Get Latest Reading
```
GET /api/sensor/latest/:deviceId
Response: { success, deviceId, connected, lastSeen, data }
```

### 2. Get History (with filters!)
```
GET /api/sensor/history/:deviceId?hours=24&days=7&weeks=4&months=3
Response: { success, count, timeRange, data[] }
```

### 3. Get Phase Comparison
```
GET /api/sensor/phases/:deviceId
Response: { success, deviceId, connected, phases[], totalPower, frequency }
```

### 4. Health Check
```
GET /api/health
Response: { status: "healthy", database: "connected" }
```

---

## 💡 Pro Tips

1. **Always check browser console** - You'll see exactly what's happening
2. **Check PM2 logs on VM** - Backend logs all requests
3. **Use the dummy data script** - Perfect for testing without hardware
4. **Device is "connected"** if data < 5 minutes old
5. **Default device ID** is `DEVICE_001` (used by dummy script)
6. **Change Arduino code** to use `DEVICE_001` when you connect hardware

---

## ✅ What You Now Have

### Frontend Features:
- ✅ Detailed console logging for debugging
- ✅ Correct API endpoints matching backend
- ✅ Better error messages
- ✅ Backward compatible with old code

### Backend Features:
- ✅ Flexible time filters (hours, days, weeks, months, custom)
- ✅ Device connection detection
- ✅ Helpful error messages
- ✅ Returns suggestions when no data found
- ✅ Console logging for all requests

### Data Features:
- ✅ 3-phase power monitoring
- ✅ Voltage, current, power per phase
- ✅ Total power calculation
- ✅ Frequency measurement
- ✅ Historical data with timestamps

---

**Your dashboard is now ready for both testing (dummy data) and production (real Arduino data)! 🎉**
