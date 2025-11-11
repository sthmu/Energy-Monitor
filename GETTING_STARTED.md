# Getting Started Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git (optional)

## Step 1: Install Dependencies

### Backend
```powershell
cd backend
npm install
```

### Frontend
```powershell
cd frontend
npm install
```

## Step 2: Configure Environment Variables

### Backend Configuration

1. Navigate to the `backend` directory
2. Create a `.env` file by copying `.env.example`:
   ```powershell
   copy .env.example .env
   ```
3. Edit the `.env` file with your settings:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/energy-monitor
JWT_SECRET=your_secure_random_secret_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
OTP_EXPIRY=10
FRONTEND_URL=http://localhost:3000
```

**Important Email Setup:**
- If using Gmail, you need to generate an "App Password"
- Go to Google Account → Security → 2-Step Verification → App passwords
- Generate an app password for "Mail" and use it in `EMAIL_PASSWORD`

### Frontend Configuration

1. Navigate to the `frontend` directory
2. Create a `.env` file by copying `.env.example`:
   ```powershell
   copy .env.example .env
   ```
3. The default configuration should work:
```env
REACT_APP_API_URL=http://localhost:5000
```

## Step 3: Start MongoDB

Make sure MongoDB is running on your system:

```powershell
# If MongoDB is installed as a service (Windows)
net start MongoDB

# Or start MongoDB manually
mongod --dbpath="C:\data\db"
```

## Step 4: Start the Application

### Option 1: Using VS Code Tasks (Recommended)

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Tasks: Run Task"
3. Select "Start Full Stack"

This will start both the backend and frontend simultaneously.

### Option 2: Manual Start

**Backend (Terminal 1):**
```powershell
cd backend
npm run dev
```

Wait for the message: "Server running on port 5000" and "Connected to MongoDB"

**Frontend (Terminal 2):**
```powershell
cd frontend
npm start
```

Wait for the message: "Compiled successfully!"

## Step 5: Access the Application

1. Open your browser and go to: `http://localhost:3000`
2. You should see the login page
3. Click "Sign Up" to create a new account
4. Enter your name, email, and password
5. Check your email for the OTP verification code
6. Enter the OTP to verify your account
7. You'll be redirected to the dashboard

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**For Backend (Port 5000):**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**For Frontend (Port 3000):**
- The React app will prompt you to use a different port
- Type 'Y' to accept

### MongoDB Connection Error

If you can't connect to MongoDB:
1. Verify MongoDB is running: `net start MongoDB`
2. Check your `MONGODB_URI` in the `.env` file
3. Make sure the database path exists and has proper permissions

### Email Verification Not Working

If you're not receiving OTP emails:
1. Check your email credentials in `.env`
2. Make sure you're using an app-specific password (for Gmail)
3. Check your spam folder
4. Look at the backend console for error messages

### React Compilation Warnings

The warnings about unused imports have been fixed. If you still see them:
```powershell
cd frontend
npm install
```

## Default Test Data

Currently, the application expects a device with ID "device1". You can:

1. **Manually insert test data** into MongoDB:
```javascript
use energy-monitor

db.energydatas.insertOne({
  timestamp: new Date(),
  deviceId: "device1",
  phase1: { voltage: 220, current: 5, power: 1100, energy: 1.1 },
  phase2: { voltage: 225, current: 4.8, power: 1080, energy: 1.08 },
  phase3: { voltage: 218, current: 5.2, power: 1134, energy: 1.13 },
  totalEnergy: 3.31
})
```

2. **Send data via the GSM endpoint**:
```powershell
# Using curl (if available)
curl -X POST http://localhost:5000/api/gsm-data `
  -H "Content-Type: application/json" `
  -d '{
    "deviceId": "device1",
    "phase1": {"voltage": 220, "current": 5, "power": 1100, "energy": 1.1},
    "phase2": {"voltage": 225, "current": 4.8, "power": 1080, "energy": 1.08},
    "phase3": {"voltage": 218, "current": 5.2, "power": 1134, "energy": 1.13},
    "totalEnergy": 3.31
  }'
```

## Hardware Integration

To send data from your Arduino + GSM module:

1. Configure the Arduino to send POST requests to: `http://your-server-ip:5000/api/gsm-data`
2. Format the data as JSON:
```json
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

## Next Steps

- Customize the dashboard to show your specific metrics
- Add more device IDs for multiple monitoring points
- Set up alerts and notifications
- Deploy to a production server (see deployment guide)

## Need Help?

Check the main README.md for more detailed information about the project architecture and features.