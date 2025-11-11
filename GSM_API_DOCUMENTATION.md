# 📡 GSM Module API Documentation
## 3-Phase Energy Monitoring System

---

## 🌐 Server Information

| Parameter | Value |
|-----------|-------|
| **Server IP** | `172.200.84.132` |
| **Port** | `5000` |
| **Protocol** | `HTTP` |
| **Base URL** | `http://172.200.84.132:5000` |

---

## � Quick API Reference

| Endpoint | Purpose | When to Use | Data Size |
|----------|---------|-------------|-----------|
| **POST** `/api/sensor/data` | Send complete 3-phase data | Production - Full system working | ~250 bytes |
| **POST** `/api/sensor/current` | Send current only | Testing ACS712 sensors | ~80 bytes |
| **POST** `/api/sensor/voltage` | Send voltage only | Testing voltage dividers | ~90 bytes |
| **GET** `/api/health` | Check server status | Verify connection before sending | ~50 bytes |
| **GET** `/api/sensor/latest/:deviceId` | Get latest reading | Dashboard / Debugging | Variable |
| **GET** `/api/sensor/history/:deviceId` | Get historical data | Analysis / Charts | Variable |

💡 **Tip**: Use separate endpoints during testing to save mobile data costs!

---

## �📤 POST: Send Sensor Data

### Endpoint
```
POST http://172.200.84.132:5000/api/sensor/data
```

### Description
This endpoint receives 3-phase power monitoring data from your Arduino/GSM module and stores it in the Firebase database. The data will be displayed in real-time on the web dashboard.

### Headers
```http
Content-Type: application/json
```

### Request Body Format

```json
{
  "deviceId": "DEVICE_001",
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

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | String | ✅ Yes | Unique identifier for your device (e.g., "DEVICE_001") |
| `phase1` | Object | ✅ Yes | Phase 1 measurements |
| `phase1.voltage` | Number | ✅ Yes | Phase 1 voltage in Volts (V) |
| `phase1.current` | Number | ✅ Yes | Phase 1 current in Amperes (A) |
| `phase1.power` | Number | ✅ Yes | Phase 1 power in Watts (W) = voltage × current |
| `phase2` | Object | ✅ Yes | Phase 2 measurements |
| `phase2.voltage` | Number | ✅ Yes | Phase 2 voltage in Volts (V) |
| `phase2.current` | Number | ✅ Yes | Phase 2 current in Amperes (A) |
| `phase2.power` | Number | ✅ Yes | Phase 2 power in Watts (W) |
| `phase3` | Object | ✅ Yes | Phase 3 measurements |
| `phase3.voltage` | Number | ✅ Yes | Phase 3 voltage in Volts (V) |
| `phase3.current` | Number | ✅ Yes | Phase 3 current in Amperes (A) |
| `phase3.power` | Number | ✅ Yes | Phase 3 power in Watts (W) |
| `totalPower` | Number | ⚠️ Optional | Total power (sum of all phases). If not provided, calculated automatically |
| `frequency` | Number | ⚠️ Optional | AC frequency in Hz (default: 50.0) |

---

## ✅ Success Response

### Status Code: `201 Created`

```json
{
  "success": true,
  "message": "Data received and stored successfully",
  "timestamp": "2024-11-12T10:30:45.123Z",
  "deviceId": "DEVICE_001",
  "totalPower": 14083.53,
  "documentId": "abc123xyz789"
}
```

---

## ❌ Error Responses

### 400 Bad Request - Missing deviceId

```json
{
  "success": false,
  "message": "deviceId is required",
  "example": {
    "deviceId": "DEVICE_001",
    "phase1": { "voltage": 230, "current": 20, "power": 4600 },
    "phase2": { "voltage": 230, "current": 20, "power": 4600 },
    "phase3": { "voltage": 230, "current": 20, "power": 4600 },
    "totalPower": 13800,
    "frequency": 50.0
  }
}
```

### 400 Bad Request - Invalid Phase Data

```json
{
  "success": false,
  "message": "phase1 must include voltage, current, and power",
  "example": {
    "deviceId": "DEVICE_001",
    "phase1": { "voltage": 230, "current": 20, "power": 4600 },
    "phase2": { "voltage": 230, "current": 20, "power": 4600 },
    "phase3": { "voltage": 230, "current": 20, "power": 4600 },
    "totalPower": 13800,
    "frequency": 50.0
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Server error",
  "error": "Error description here"
}
```

---

## 🧪 Testing the API

### Using cURL (Command Line)

**Windows PowerShell:**
```powershell
curl -X POST "http://172.200.84.132:5000/api/sensor/data" `
  -H "Content-Type: application/json" `
  -d '{\"deviceId\":\"DEVICE_001\",\"phase1\":{\"voltage\":230,\"current\":20,\"power\":4600},\"phase2\":{\"voltage\":230,\"current\":20,\"power\":4600},\"phase3\":{\"voltage\":230,\"current\":20,\"power\":4600},\"totalPower\":13800,\"frequency\":50.0}'
```

**Linux/Mac Terminal:**
```bash
curl -X POST "http://172.200.84.132:5000/api/sensor/data" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "DEVICE_001",
    "phase1": {"voltage": 230, "current": 20, "power": 4600},
    "phase2": {"voltage": 230, "current": 20, "power": 4600},
    "phase3": {"voltage": 230, "current": 20, "power": 4600},
    "totalPower": 13800,
    "frequency": 50.0
  }'
```

### Using Postman

1. **Method**: POST
2. **URL**: `http://172.200.84.132:5000/api/sensor/data`
3. **Headers**: 
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body** (raw JSON):
```json
{
  "deviceId": "DEVICE_001",
  "phase1": {
    "voltage": 230,
    "current": 20,
    "power": 4600
  },
  "phase2": {
    "voltage": 230,
    "current": 20,
    "power": 4600
  },
  "phase3": {
    "voltage": 230,
    "current": 20,
    "power": 4600
  },
  "totalPower": 13800,
  "frequency": 50.0
}
```

---

## 🔌 Arduino/GSM Code Examples

### Option 1: Send Complete Data (Recommended for Production)

**Use `/api/sensor/data` endpoint** - Sends voltage, current, and power for all 3 phases.

```cpp
#include <SoftwareSerial.h>

SoftwareSerial gsm(7, 8); // RX, TX
const char* server = "172.200.84.132";
const int port = 5000;
const char* deviceId = "DEVICE_001";

void setup() {
  Serial.begin(9600);
  gsm.begin(9600);
  delay(2000);
  
  // Initialize GSM
  gsm.println("AT");
  delay(1000);
  gsm.println("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"");
  delay(2000);
  gsm.println("AT+SAPBR=3,1,\"APN\",\"your_apn_here\""); // Change this!
  delay(2000);
  gsm.println("AT+SAPBR=1,1");
  delay(3000);
  
  Serial.println("GSM Ready!");
}

void loop() {
  // Read all sensors
  float v1 = readVoltage(A0);
  float i1 = readCurrent(A1);
  float p1 = v1 * i1;
  
  float v2 = readVoltage(A2);
  float i2 = readCurrent(A3);
  float p2 = v2 * i2;
  
  float v3 = readVoltage(A4);
  float i3 = readCurrent(A5);
  float p3 = v3 * i3;
  
  float totalPower = p1 + p2 + p3;
  
  // Send complete data
  sendCompleteData(v1, i1, p1, v2, i2, p2, v3, i3, p3, totalPower);
  
  delay(5000); // Wait 5 seconds
}

void sendCompleteData(float v1, float i1, float p1, 
                      float v2, float i2, float p2,
                      float v3, float i3, float p3,
                      float totalPower) {
  
  String payload = "{";
  payload += "\"deviceId\":\"" + String(deviceId) + "\",";
  payload += "\"phase1\":{\"voltage\":" + String(v1, 2) + ",\"current\":" + String(i1, 2) + ",\"power\":" + String(p1, 2) + "},";
  payload += "\"phase2\":{\"voltage\":" + String(v2, 2) + ",\"current\":" + String(i2, 2) + ",\"power\":" + String(p2, 2) + "},";
  payload += "\"phase3\":{\"voltage\":" + String(v3, 2) + ",\"current\":" + String(i3, 2) + ",\"power\":" + String(p3, 2) + "},";
  payload += "\"totalPower\":" + String(totalPower, 2) + ",";
  payload += "\"frequency\":50.0}";
  
  sendHTTPPost("/api/sensor/data", payload);
}

float readVoltage(int pin) {
  int raw = analogRead(pin);
  // Adjust based on your voltage divider (e.g., 230V scaled to 5V)
  float voltage = (raw * 5.0 / 1023.0) * (230.0 / 5.0);
  return voltage;
}

float readCurrent(int pin) {
  int raw = analogRead(pin);
  // ACS712-30A: 66mV/A, centered at 2.5V
  float voltage = (raw * 5.0 / 1023.0);
  float current = (voltage - 2.5) / 0.066;
  return abs(current);
}

void sendHTTPPost(String endpoint, String payload) {
  gsm.println("AT+HTTPINIT");
  delay(1000);
  gsm.println("AT+HTTPPARA=\"CID\",1");
  delay(1000);
  
  gsm.print("AT+HTTPPARA=\"URL\",\"http://");
  gsm.print(server);
  gsm.print(":");
  gsm.print(port);
  gsm.print(endpoint);
  gsm.println("\"");
  delay(1000);
  
  gsm.println("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  delay(1000);
  
  gsm.print("AT+HTTPDATA=");
  gsm.print(payload.length());
  gsm.println(",10000");
  delay(2000);
  
  gsm.println(payload);
  delay(2000);
  
  gsm.println("AT+HTTPACTION=1"); // POST
  delay(5000);
  
  gsm.println("AT+HTTPREAD");
  delay(2000);
  
  while(gsm.available()) {
    Serial.write(gsm.read());
  }
  
  gsm.println("AT+HTTPTERM");
  delay(1000);
  
  Serial.println("\nData sent!");
}
```

---

### Option 2: Send Current Only (Testing ACS712 Sensors)

**Use `/api/sensor/current` endpoint** - Perfect for testing current sensors independently.

```cpp
void loop() {
  // Read only current sensors
  float i1 = readCurrent(A1);
  float i2 = readCurrent(A3);
  float i3 = readCurrent(A5);
  
  // Send only current data
  sendCurrentData(i1, i2, i3);
  
  delay(5000);
}

void sendCurrentData(float i1, float i2, float i3) {
  String payload = "{";
  payload += "\"deviceId\":\"DEVICE_001\",";
  payload += "\"phase1\":" + String(i1, 2) + ",";
  payload += "\"phase2\":" + String(i2, 2) + ",";
  payload += "\"phase3\":" + String(i3, 2);
  payload += "}";
  
  sendHTTPPost("/api/sensor/current", payload);
}
```

---

### Option 3: Send Voltage Only (Testing Voltage Dividers)

**Use `/api/sensor/voltage` endpoint** - Perfect for testing voltage measurement circuits.

```cpp
void loop() {
  // Read only voltage sensors
  float v1 = readVoltage(A0);
  float v2 = readVoltage(A2);
  float v3 = readVoltage(A4);
  
  // Send only voltage data
  sendVoltageData(v1, v2, v3);
  
  delay(5000);
}

void sendVoltageData(float v1, float v2, float v3) {
  String payload = "{";
  payload += "\"deviceId\":\"DEVICE_001\",";
  payload += "\"phase1\":" + String(v1, 2) + ",";
  payload += "\"phase2\":" + String(v2, 2) + ",";
  payload += "\"phase3\":" + String(v3, 2) + ",";
  payload += "\"frequency\":50.0";
  payload += "}";
  
  sendHTTPPost("/api/sensor/voltage", payload);
}
```

---

### Option 4: Smart Sending (Save Data Costs)

**Send only what changed** - Save mobile data by sending voltage and current separately.

```cpp
unsigned long lastVoltageTime = 0;
unsigned long lastCurrentTime = 0;

void loop() {
  unsigned long currentMillis = millis();
  
  // Send voltage every 30 seconds
  if (currentMillis - lastVoltageTime >= 30000) {
    float v1 = readVoltage(A0);
    float v2 = readVoltage(A2);
    float v3 = readVoltage(A4);
    sendVoltageData(v1, v2, v3);
    lastVoltageTime = currentMillis;
  }
  
  // Send current every 5 seconds (changes more frequently)
  if (currentMillis - lastCurrentTime >= 5000) {
    float i1 = readCurrent(A1);
    float i2 = readCurrent(A3);
    float i3 = readCurrent(A5);
    sendCurrentData(i1, i2, i3);
    lastCurrentTime = currentMillis;
  }
}
```

---

## 📊 What Happens After Sending Data?

1. ✅ **Data is validated** - Server checks all required fields
2. 💾 **Data is stored** - Saved to Firebase Firestore database
3. 📡 **Real-time update** - Sent to dashboard via WebSocket
4. 📈 **Dashboard displays** - Charts update immediately
5. 🔍 **Device status updated** - Marked as "connected"

---

## ⚡ Additional Endpoints

### 1️⃣ POST: Send CURRENT Data Only

**Use this endpoint** when you want to send only current measurements (useful for testing ACS712 sensors independently).

#### Endpoint
```
POST http://172.200.84.132:5000/api/sensor/current
```

#### Request Body
```json
{
  "deviceId": "DEVICE_001",
  "phase1": 20.5,
  "phase2": 19.8,
  "phase3": 21.2
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | String | ✅ Yes | Device identifier |
| `phase1` | Number | ✅ Yes | Phase 1 current in Amperes (A) |
| `phase2` | Number | ✅ Yes | Phase 2 current in Amperes (A) |
| `phase3` | Number | ✅ Yes | Phase 3 current in Amperes (A) |

#### Success Response (201)
```json
{
  "success": true,
  "message": "Current data received and stored successfully",
  "timestamp": "2024-11-12T10:30:45.123Z",
  "deviceId": "DEVICE_001",
  "currents": {
    "phase1": 20.5,
    "phase2": 19.8,
    "phase3": 21.2
  },
  "documentId": "xyz789abc123"
}
```

#### Arduino Example
```cpp
// Send only current data
void sendCurrentData(float i1, float i2, float i3) {
  String payload = "{";
  payload += "\"deviceId\":\"DEVICE_001\",";
  payload += "\"phase1\":" + String(i1, 2) + ",";
  payload += "\"phase2\":" + String(i2, 2) + ",";
  payload += "\"phase3\":" + String(i3, 2);
  payload += "}";
  
  // ... GSM HTTP POST code to /api/sensor/current
}
```

#### cURL Test
```bash
curl -X POST "http://172.200.84.132:5000/api/sensor/current" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "DEVICE_001",
    "phase1": 20.5,
    "phase2": 19.8,
    "phase3": 21.2
  }'
```

---

### 2️⃣ POST: Send VOLTAGE Data Only

**Use this endpoint** when you want to send only voltage measurements (useful for testing voltage dividers independently).

#### Endpoint
```
POST http://172.200.84.132:5000/api/sensor/voltage
```

#### Request Body
```json
{
  "deviceId": "DEVICE_001",
  "phase1": 230.5,
  "phase2": 229.8,
  "phase3": 231.2,
  "frequency": 50.0
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | String | ✅ Yes | Device identifier |
| `phase1` | Number | ✅ Yes | Phase 1 voltage in Volts (V) |
| `phase2` | Number | ✅ Yes | Phase 2 voltage in Volts (V) |
| `phase3` | Number | ✅ Yes | Phase 3 voltage in Volts (V) |
| `frequency` | Number | ⚠️ Optional | AC frequency in Hz (default: 50.0) |

#### Success Response (201)
```json
{
  "success": true,
  "message": "Voltage data received and stored successfully",
  "timestamp": "2024-11-12T10:30:45.123Z",
  "deviceId": "DEVICE_001",
  "voltages": {
    "phase1": 230.5,
    "phase2": 229.8,
    "phase3": 231.2
  },
  "frequency": 50.0,
  "documentId": "abc123xyz789"
}
```

#### Arduino Example
```cpp
// Send only voltage data
void sendVoltageData(float v1, float v2, float v3) {
  String payload = "{";
  payload += "\"deviceId\":\"DEVICE_001\",";
  payload += "\"phase1\":" + String(v1, 2) + ",";
  payload += "\"phase2\":" + String(v2, 2) + ",";
  payload += "\"phase3\":" + String(v3, 2) + ",";
  payload += "\"frequency\":50.0";
  payload += "}";
  
  // ... GSM HTTP POST code to /api/sensor/voltage
}
```

#### cURL Test
```bash
curl -X POST "http://172.200.84.132:5000/api/sensor/voltage" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "DEVICE_001",
    "phase1": 230.5,
    "phase2": 229.8,
    "phase3": 231.2,
    "frequency": 50.0
  }'
```

---

## 🎯 Which Endpoint Should You Use?

| Scenario | Endpoint | Reason |
|----------|----------|--------|
| **Full system working** | `/api/sensor/data` | Send complete data (voltage, current, power) |
| **Testing current sensors only** | `/api/sensor/current` | Test ACS712 sensors independently |
| **Testing voltage dividers only** | `/api/sensor/voltage` | Test voltage measurement circuits |
| **Separate sensor modules** | Both `/current` & `/voltage` | Send data from different modules at different times |
| **Low bandwidth/cost** | `/current` or `/voltage` | Send only what changed to save data usage |

---

## 📦 Database Collections

Your data will be stored in separate Firebase collections:

| Endpoint | Firebase Collection | Contains |
|----------|-------------------|----------|
| `/api/sensor/data` | `sensorData` | Complete 3-phase readings (V, I, P) |
| `/api/sensor/current` | `currentReadings` | Current measurements only (I) |
| `/api/sensor/voltage` | `voltageReadings` | Voltage measurements only (V) |

All collections include:
- ✅ `deviceId` - Your device identifier
- ✅ `timestamp` - When data was received
- ✅ `phase1`, `phase2`, `phase3` - Measurements for each phase
- ✅ `createdAt` - Server timestamp

---

## 🔄 Real-Time Updates

Each endpoint emits WebSocket events:

| Endpoint | WebSocket Event | Dashboard Updates |
|----------|----------------|-------------------|
| `/api/sensor/data` | `sensor-update` | All charts (voltage, current, power) |
| `/api/sensor/current` | `current-update` | Current charts and gauges |
| `/api/sensor/voltage` | `voltage-update` | Voltage charts and gauges |

---

## 🔍 Verify Your Data

### Check Firebase Console
1. Go to: https://console.firebase.google.com
2. Select project: `energy-monitoring-system-s`
3. Navigate to: **Firestore Database** → `sensorData` collection
4. You should see your data with timestamp

### Check Dashboard
1. Open browser: `http://172.200.84.132`
2. Dashboard will show real-time data
3. Charts will update every 5 seconds

### Check Backend Logs (On VM)
```bash
ssh jagath@172.200.84.132
pm2 logs energy-backend
```

You'll see:
```
📡 Incoming sensor data: { deviceId: "DEVICE_001", ... }
✅ Data saved successfully: DEVICE_001 Total Power: 13800 W
```

---

## 🛡️ Important Notes

### Device ID
- ✅ **Use**: `DEVICE_001` (matches dummy data)
- ❌ **Avoid**: Changing device ID frequently
- 💡 **Tip**: Each physical device should have a unique ID

### Data Frequency
- ⏰ **Recommended**: Send data every 5-10 seconds
- ⚠️ **Warning**: Sending too frequently (< 1 second) may overwhelm GSM module
- 💰 **Cost**: More frequent = more data usage on your SIM

### Power Calculation
- 📐 **Formula**: Power (W) = Voltage (V) × Current (A)
- 💡 **Tip**: Calculate on Arduino before sending to save bandwidth
- ✅ **Example**: 230V × 20A = 4600W

### Network Connection
- 📶 **Requirement**: GSM module needs GPRS/mobile data
- 💳 **SIM Card**: Must have active data plan
- 🌍 **APN**: Set your mobile operator's APN correctly

---

## 🔧 Troubleshooting

### Problem: Connection Timeout
**Solution:**
- Check if server is running: `pm2 status energy-backend`
- Verify firewall allows port 5000: `sudo ufw status`
- Test manually: `curl http://172.200.84.132:5000/api/health`

### Problem: 400 Bad Request
**Solution:**
- Check JSON format is correct
- Verify all required fields are present
- Ensure numbers are not strings

### Problem: GSM Not Connecting
**Solution:**
- Verify APN settings for your carrier
- Check SIM card has active data
- Ensure GSM module has power (needs 2A supply)

### Problem: Data Not Showing on Dashboard
**Solution:**
- Verify data was received: Check PM2 logs
- Refresh browser with Ctrl+F5
- Check browser console for errors (F12)

---

## 📞 Support & Contact

| Info | Details |
|------|---------|
| **Server IP** | 172.200.84.132 |
| **Server Port** | 5000 |
| **Health Check** | http://172.200.84.132:5000/api/health |
| **Dashboard** | http://172.200.84.132 |
| **Firebase Console** | https://console.firebase.google.com |
| **Project ID** | energy-monitoring-system-s |

---

## 📚 Additional Endpoints

### Health Check
```
GET http://172.200.84.132:5000/api/health
```
Returns server status and database connection.

### Get Latest Data
```
GET http://172.200.84.132:5000/api/sensor/latest/DEVICE_001
```
Returns the most recent reading for a device.

### Get Historical Data
```
GET http://172.200.84.132:5000/api/sensor/history/DEVICE_001?hours=24
```
Returns historical data. Filters: `hours`, `days`, `weeks`, `months`

---

**Your GSM module is now ready to send data to the server! 📡✅**
