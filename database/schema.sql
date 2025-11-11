-- Three Phase Energy Monitoring System Database Schema
-- Optimized for Azure SQL Database

-- Create SensorData table (main data storage)
CREATE TABLE SensorData (
    id INT IDENTITY(1,1) PRIMARY KEY,
    deviceId NVARCHAR(50) NOT NULL,
    timestamp DATETIME2 DEFAULT GETDATE(),
    phase INT NOT NULL,                    -- 1, 2, or 3
    current FLOAT NOT NULL,                -- Amperes (A)
    voltage FLOAT NULL,                    -- Volts (V) - nullable for future
    power FLOAT NULL,                      -- Watts (W) - calculated
    energy FLOAT NULL,                     -- Watt-hours (Wh) - calculated
    INDEX IX_DeviceId_Timestamp (deviceId, timestamp DESC),
    INDEX IX_Timestamp (timestamp DESC)
);

-- Create DeviceInfo table (device metadata)
CREATE TABLE DeviceInfo (
    deviceId NVARCHAR(50) PRIMARY KEY,
    deviceName NVARCHAR(100),
    location NVARCHAR(200),
    isActive BIT DEFAULT 1,
    lastSeenAt DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE()
);

-- Create aggregated daily statistics table (for faster queries)
CREATE TABLE DailyStats (
    id INT IDENTITY(1,1) PRIMARY KEY,
    deviceId NVARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    phase INT NOT NULL,
    avgCurrent FLOAT,
    maxCurrent FLOAT,
    minCurrent FLOAT,
    totalEnergy FLOAT,
    readingCount INT,
    UNIQUE (deviceId, date, phase)
);

-- Insert default device
INSERT INTO DeviceInfo (deviceId, deviceName, location, isActive)
VALUES ('device1', 'Main Building', 'Default Location', 1);
