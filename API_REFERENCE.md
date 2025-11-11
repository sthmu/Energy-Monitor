# API Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered. Please verify your email with the OTP sent to your email address.",
  "userId": "507f1f77bcf86cd799439011"
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "otp": "123456"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "otp": "123456",
  "newPassword": "newsecurepassword123"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

## Energy Data Endpoints

All energy data endpoints require authentication (Bearer token).

### Get Energy Data
```http
GET /api/energy-data?deviceId=device1&startDate=2025-10-01&endDate=2025-10-20&limit=100
Authorization: Bearer <token>
```

**Query Parameters:**
- `deviceId` (optional): Filter by device ID
- `startDate` (optional): Start date for filtering (ISO 8601 format)
- `endDate` (optional): End date for filtering (ISO 8601 format)
- `limit` (optional): Maximum number of records to return (default: 100)

### Get Daily Energy Data
```http
GET /api/energy-data/daily?deviceId=device1&startDate=2025-10-01&endDate=2025-10-20
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "date": "2025-10-20T00:00:00.000Z",
    "deviceId": "device1",
    "totalEnergy": 156.75,
    "averageVoltage": {
      "phase1": 220.5,
      "phase2": 222.3,
      "phase3": 219.8
    },
    "averageCurrent": {
      "phase1": 5.2,
      "phase2": 4.9,
      "phase3": 5.1
    },
    "energy": {
      "phase1": 52.25,
      "phase2": 51.50,
      "phase3": 53.00,
      "total": 156.75
    },
    "readingsCount": 288
  }
]
```

### Get Weekly Energy Data
```http
GET /api/energy-data/weekly?deviceId=device1
Authorization: Bearer <token>
```

### Get Monthly Energy Data
```http
GET /api/energy-data/monthly?deviceId=device1
Authorization: Bearer <token>
```

### Get Real-time Data
```http
GET /api/energy-data/real-time/:deviceId
Authorization: Bearer <token>
```

**Example:**
```http
GET /api/energy-data/real-time/device1
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "timestamp": "2025-10-20T10:30:00.000Z",
  "deviceId": "device1",
  "phase1": {
    "voltage": 220,
    "current": 5.2,
    "power": 1144,
    "energy": 1.14
  },
  "phase2": {
    "voltage": 225,
    "current": 4.8,
    "power": 1080,
    "energy": 1.08
  },
  "phase3": {
    "voltage": 218,
    "current": 5.0,
    "power": 1090,
    "energy": 1.09
  },
  "totalEnergy": 3.31
}
```

### Get Statistics
```http
GET /api/energy-data/statistics?deviceId=device1&period=day
Authorization: Bearer <token>
```

**Query Parameters:**
- `deviceId` (optional): Filter by device ID
- `period` (optional): Time period - 'day', 'week', 'month', or 'year' (default: 'day')

**Response:**
```json
{
  "period": "day",
  "startDate": "2025-10-19T10:30:00.000Z",
  "endDate": "2025-10-20T10:30:00.000Z",
  "totalEnergyKWh": 156.75,
  "averageVoltage": {
    "phase1": 220.5,
    "phase2": 222.3,
    "phase3": 219.8
  },
  "maxCurrent": {
    "phase1": 6.2,
    "phase2": 5.9,
    "phase3": 6.1
  },
  "energyByPhase": {
    "phase1": 52.25,
    "phase2": 51.50,
    "phase3": 53.00
  },
  "readingsCount": 288
}
```

## GSM Data Endpoint

This endpoint is used by the hardware (Arduino + GSM module) to send energy data.

### Submit GSM Data
```http
POST /api/gsm-data
Content-Type: application/json

{
  "deviceId": "device1",
  "phase1": {
    "voltage": 220,
    "current": 5.2,
    "power": 1144,
    "energy": 1.14
  },
  "phase2": {
    "voltage": 225,
    "current": 4.8,
    "power": 1080,
    "energy": 1.08
  },
  "phase3": {
    "voltage": 218,
    "current": 5.0,
    "power": 1090,
    "energy": 1.09
  },
  "totalEnergy": 3.31
}
```

**Response:**
```json
{
  "message": "Data received and processed successfully",
  "id": "507f1f77bcf86cd799439011"
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Energy Update Event
```javascript
socket.on('energy-update', (data) => {
  console.log('New energy data:', data);
  // data format:
  // {
  //   deviceId: 'device1',
  //   timestamp: '2025-10-20T10:30:00.000Z',
  //   phase1: { voltage, current, power, energy },
  //   phase2: { voltage, current, power, energy },
  //   phase3: { voltage, current, power, energy },
  //   totalEnergy: 3.31
  // }
});
```

## Error Responses

### Validation Error (400)
```json
{
  "message": "Invalid data format"
}
```

### Unauthorized (401)
```json
{
  "message": "No token provided"
}
```

### Not Found (404)
```json
{
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "message": "Server error during registration"
}
```

## Testing with cURL (PowerShell)

### Register a User
```powershell
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"test123\"}'
```

### Send Energy Data
```powershell
curl -X POST http://localhost:5000/api/gsm-data `
  -H "Content-Type: application/json" `
  -d '{\"deviceId\":\"device1\",\"phase1\":{\"voltage\":220,\"current\":5.2,\"power\":1144,\"energy\":1.14},\"phase2\":{\"voltage\":225,\"current\":4.8,\"power\":1080,\"energy\":1.08},\"phase3\":{\"voltage\":218,\"current\":5.0,\"power\":1090,\"energy\":1.09},\"totalEnergy\":3.31}'
```

### Get Energy Data (with authentication)
```powershell
curl -X GET "http://localhost:5000/api/energy-data?deviceId=device1" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```