const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create/open database file
const dbPath = path.join(dataDir, 'energy-monitor.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
const createTables = () => {
  // Main sensor data table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      phase1_voltage REAL NOT NULL,
      phase1_current REAL NOT NULL,
      phase1_power REAL NOT NULL,
      phase2_voltage REAL NOT NULL,
      phase2_current REAL NOT NULL,
      phase2_power REAL NOT NULL,
      phase3_voltage REAL NOT NULL,
      phase3_current REAL NOT NULL,
      phase3_power REAL NOT NULL,
      total_power REAL NOT NULL,
      frequency REAL DEFAULT 50.0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Index for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_device_timestamp 
    ON sensor_data(device_id, timestamp DESC);
  `);

  // Current readings table (optional - for current-only data)
  db.exec(`
    CREATE TABLE IF NOT EXISTS current_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      phase1 REAL NOT NULL,
      phase2 REAL NOT NULL,
      phase3 REAL NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Voltage readings table (optional - for voltage-only data)
  db.exec(`
    CREATE TABLE IF NOT EXISTS voltage_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      phase1 REAL NOT NULL,
      phase2 REAL NOT NULL,
      phase3 REAL NOT NULL,
      frequency REAL DEFAULT 50.0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Devices table (track device status)
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      device_id TEXT PRIMARY KEY,
      last_seen_at INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  console.log('✅ SQLite database initialized:', dbPath);
};

// Initialize database
createTables();

// Prepared statements for better performance
const statements = {
  // Insert sensor data
  insertSensorData: db.prepare(`
    INSERT INTO sensor_data (
      device_id, timestamp,
      phase1_voltage, phase1_current, phase1_power,
      phase2_voltage, phase2_current, phase2_power,
      phase3_voltage, phase3_current, phase3_power,
      total_power, frequency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  // Insert current reading
  insertCurrentReading: db.prepare(`
    INSERT INTO current_readings (device_id, timestamp, phase1, phase2, phase3)
    VALUES (?, ?, ?, ?, ?)
  `),

  // Insert voltage reading
  insertVoltageReading: db.prepare(`
    INSERT INTO voltage_readings (device_id, timestamp, phase1, phase2, phase3, frequency)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  // Update device status
  updateDevice: db.prepare(`
    INSERT INTO devices (device_id, last_seen_at, is_active)
    VALUES (?, ?, 1)
    ON CONFLICT(device_id) DO UPDATE SET
      last_seen_at = excluded.last_seen_at,
      is_active = 1
  `),

  // Get latest sensor data
  getLatestData: db.prepare(`
    SELECT * FROM sensor_data
    WHERE device_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `),

  // Get historical data
  getHistoricalData: db.prepare(`
    SELECT * FROM sensor_data
    WHERE device_id = ?
      AND timestamp >= ?
      AND timestamp <= ?
    ORDER BY timestamp DESC
    LIMIT ?
  `)
};

// Helper functions
const helpers = {
  // Convert timestamp to Unix seconds
  toUnixTimestamp: (date) => Math.floor(date.getTime() / 1000),

  // Convert Unix seconds to Date
  fromUnixTimestamp: (timestamp) => new Date(timestamp * 1000),

  // Convert row to API format
  rowToApiFormat: (row) => {
    if (!row) return null;
    
    return {
      id: row.id,
      deviceId: row.device_id,
      timestamp: helpers.fromUnixTimestamp(row.timestamp),
      phase1: {
        voltage: row.phase1_voltage,
        current: row.phase1_current,
        power: row.phase1_power
      },
      phase2: {
        voltage: row.phase2_voltage,
        current: row.phase2_current,
        power: row.phase2_power
      },
      phase3: {
        voltage: row.phase3_voltage,
        current: row.phase3_current,
        power: row.phase3_power
      },
      totalPower: row.total_power,
      frequency: row.frequency
    };
  }
};

module.exports = {
  db,
  statements,
  helpers
};
