# Three Phase Energy Monitoring System

This project is a complete solution for monitoring the energy usage of a three-phase building. It includes:

1. Hardware components:
   - Arduino Nano for data collection
   - Current sensors for measuring current
   - Voltage dividers for measuring voltage
   - GSM module for data transmission

2. Software components:
   - React frontend for data visualization and user interface
   - Node.js backend for data processing and API
   - MongoDB database for data storage
   - Authentication system with email OTP

## Project Structure

- **frontend/**: React application with dashboard and authentication
- **backend/**: Node.js server, MongoDB integration, and GSM data handling

## Features

- Real-time energy usage monitoring
- Historical data visualization
- User authentication with email OTP
- Responsive dashboard with graphs and metrics
- Data storage for long-term analysis

## Getting Started

For detailed setup instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md)

### Quick Start

### Backend Setup

```bash
cd backend
npm install
# Create and configure .env file (see .env.example)
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### MongoDB Setup

Ensure MongoDB is running on your system. Update the `MONGODB_URI` in the backend `.env` file.

## Technologies Used

- **Frontend**: React, Chart.js (with chartjs-adapter-date-fns), Material-UI, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens), Bcrypt
- **Email**: Nodemailer for OTP delivery

## Features in Detail