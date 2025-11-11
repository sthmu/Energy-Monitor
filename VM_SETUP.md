# VM Installation Guide - Backend + Database

## 🖥️ System Requirements

**Minimum Specs:**
- OS: Windows Server 2019/2022 or Ubuntu 20.04/22.04
- RAM: 4GB (8GB recommended)
- Storage: 20GB free space
- Network: Internet access for Arduino to reach VM

---

## Option 1: Windows Server VM

### Step 1: Install SQL Server Express (Free)

```powershell
# Download SQL Server 2022 Express
# URL: https://www.microsoft.com/en-us/sql-server/sql-server-downloads

# Or use Chocolatey:
choco install sql-server-express -y

# Install SQL Server Management Studio (optional but helpful)
choco install sql-server-management-studio -y
```

**Configuration:**
- Authentication: Mixed Mode (SQL + Windows)
- SA Password: Create a strong password
- Default instance name: `localhost` or `.\SQLEXPRESS`

### Step 2: Create Database

Open PowerShell as Administrator:

```powershell
# Connect to SQL Server using sqlcmd
sqlcmd -S localhost\SQLEXPRESS -U sa -P YourPassword

# In sqlcmd prompt:
CREATE DATABASE EnergyMonitoring;
GO
USE EnergyMonitoring;
GO

# Now copy-paste the schema from database/schema.sql
# Or run it from file:
:r C:\path\to\schema.sql
GO
```

### Step 3: Install Node.js

```powershell
# Using Chocolatey
choco install nodejs-lts -y

# Or download from: https://nodejs.org

# Verify installation
node --version
npm --version
```

### Step 4: Setup Backend

```powershell
# Copy your project to VM (use FTP, SCP, or Git)
cd C:\EnergyMonitoring\backend

# Install dependencies
npm install

# Create .env file
@"
PORT=5000
FRONTEND_URL=http://your-vm-ip:3000

DB_SERVER=localhost\SQLEXPRESS
DB_NAME=EnergyMonitoring
DB_USER=sa
DB_PASSWORD=YourStrongPassword
"@ | Out-File -FilePath .env -Encoding utf8
```

### Step 5: Configure Firewall

```powershell
# Allow Node.js backend port
New-NetFirewallRule -DisplayName "Energy Monitor API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Allow SQL Server (if needed from outside VM)
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -LocalPort 1433 -Protocol TCP -Action Allow
```

### Step 6: Install as Windows Service (Run backend permanently)

```powershell
# Install PM2 (process manager)
npm install -g pm2
npm install -g pm2-windows-service

# Setup PM2 as Windows Service
pm2-service-install -n PM2

# Start backend
cd C:\EnergyMonitoring\backend
pm2 start server.js --name energy-monitor
pm2 save

# Backend now runs automatically on boot!
```

### Step 7: Get VM IP Address

```powershell
# Get your VM's IP address
ipconfig

# Look for IPv4 Address, example: 192.168.1.100
```

---

## Option 2: Ubuntu/Linux VM (Recommended - Easier)

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install SQL Server on Ubuntu

```bash
# Add Microsoft repository
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/mssql-server-2022.list)"

# Install SQL Server
sudo apt update
sudo apt install -y mssql-server

# Configure SQL Server
sudo /opt/mssql/bin/mssql-conf setup
# Choose: 2) Developer (free)
# Set SA password when prompted

# Start SQL Server
sudo systemctl start mssql-server
sudo systemctl enable mssql-server

# Verify it's running
systemctl status mssql-server
```

### Step 3: Install SQL Tools

```bash
# Add repository
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list)"

# Install sqlcmd
sudo apt update
sudo apt install -y mssql-tools unixodbc-dev

# Add to PATH
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

### Step 4: Create Database

```bash
# Connect to SQL Server
sqlcmd -S localhost -U sa -P 'YourStrongPassword'

# In sqlcmd:
CREATE DATABASE EnergyMonitoring;
GO
USE EnergyMonitoring;
GO
```

Then copy-paste the schema from `database/schema.sql`, or:

```bash
# Run schema from file
sqlcmd -S localhost -U sa -P 'YourStrongPassword' -d EnergyMonitoring -i /path/to/schema.sql
```

### Step 5: Install Node.js

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

### Step 6: Setup Backend

```bash
# Create project directory
sudo mkdir -p /opt/energy-monitor
sudo chown $USER:$USER /opt/energy-monitor

# Copy your backend files (use SCP, Git, etc)
# Example with Git:
cd /opt/energy-monitor
git clone your-repo-url .

# Or copy files
# scp -r ./backend/* user@vm-ip:/opt/energy-monitor/

cd /opt/energy-monitor/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
FRONTEND_URL=http://your-vm-ip:3000

DB_SERVER=localhost
DB_NAME=EnergyMonitoring
DB_USER=sa
DB_PASSWORD=YourStrongPassword
EOF
```

### Step 7: Configure Firewall

```bash
# Allow backend port
sudo ufw allow 5000/tcp

# Allow SSH (if not already)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### Step 8: Install as System Service (Auto-start on boot)

```bash
# Install PM2
sudo npm install -g pm2

# Start backend
cd /opt/energy-monitor/backend
pm2 start server.js --name energy-monitor

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs (starts with sudo env...)

# Check status
pm2 status
pm2 logs energy-monitor
```

### Step 9: Get VM IP Address

```bash
# Get IP address
ip addr show

# Or simpler:
hostname -I
```

---

## 🧪 Test Your VM Setup

### 1. Test Database Connection

**Windows:**
```powershell
sqlcmd -S localhost\SQLEXPRESS -U sa -P YourPassword -Q "SELECT 1"
```

**Linux:**
```bash
sqlcmd -S localhost -U sa -P 'YourPassword' -Q "SELECT 1"
```

### 2. Test Backend

```bash
# From VM
curl http://localhost:5000/api/health

# From your computer (replace VM_IP)
curl http://VM_IP:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 3. Test Arduino Endpoint

**PowerShell (from your computer):**
```powershell
$body = @{ deviceId = "device1"; data = 5.2 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://VM_IP:5000/api/sensor/data" -Method Post -Body $body -ContentType "application/json"
```

**Linux/Mac:**
```bash
curl -X POST http://VM_IP:5000/api/sensor/data \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"device1","data":5.2}'
```

---

## 📱 Update Arduino Code

In `arduino_simple.ino`:

```cpp
const String SERVER_URL = "http://YOUR_VM_IP:5000/api/sensor/data";
// Replace YOUR_VM_IP with your VM's actual IP address
// Example: "http://192.168.1.100:5000/api/sensor/data"
```

---

## 🔧 Management Commands

### Check Backend Status

**Windows:**
```powershell
pm2 status
pm2 logs energy-monitor
pm2 restart energy-monitor
```

**Linux:**
```bash
pm2 status
pm2 logs energy-monitor --lines 100
pm2 restart energy-monitor
```

### Check Database

**Both:**
```bash
sqlcmd -S localhost -U sa -P 'YourPassword'
# Then:
USE EnergyMonitoring;
SELECT TOP 10 * FROM SensorData ORDER BY timestamp DESC;
GO
```

### View Latest Data

```bash
# From VM
curl http://localhost:5000/api/sensor/latest/device1

# See logs
pm2 logs energy-monitor
```

---

## 🌐 Optional: Setup Frontend on Same VM

### Install Frontend

```bash
cd /opt/energy-monitor/frontend

# Install dependencies
npm install

# Build production version
npm run build

# Install serve (simple web server)
sudo npm install -g serve

# Run frontend
pm2 serve build 3000 --name energy-frontend --spa
pm2 save

# Allow port 3000
sudo ufw allow 3000/tcp  # Linux
# Or
New-NetFirewallRule -DisplayName "Energy Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow  # Windows
```

Access frontend at: `http://VM_IP:3000`

---

## 🔒 Security Recommendations

### 1. Change Default Ports (Optional)

```bash
# In backend .env
PORT=8080

# Update firewall rules accordingly
```

### 2. Use Strong SA Password

```bash
# Must include: uppercase, lowercase, numbers, symbols
# Minimum 8 characters
# Example: "Energy@2025!Secure"
```

### 3. Restrict Database Access

SQL Server should only listen on localhost (default), unless you need remote access.

### 4. Setup HTTPS (Production)

Use reverse proxy (nginx) with Let's Encrypt SSL certificate.

---

## 📊 Monitor Your System

### Check Disk Space

**Linux:**
```bash
df -h
```

**Windows:**
```powershell
Get-PSDrive C
```

### Check Memory Usage

**Linux:**
```bash
free -h
htop  # if installed
```

**Windows:**
```powershell
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10
```

### Database Size

```sql
-- Connect to SQL Server
USE EnergyMonitoring;
GO

-- Check table size
SELECT 
    COUNT(*) as TotalRecords,
    MIN(timestamp) as FirstRecord,
    MAX(timestamp) as LastRecord
FROM SensorData;
GO
```

---

## 🚀 Quick Start Script

### Linux Auto-Install Script

Save as `install.sh`:

```bash
#!/bin/bash
set -e

echo "Installing Energy Monitoring System..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install SQL Server
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/mssql-server-2022.list)"
sudo apt update
sudo apt install -y mssql-server
sudo /opt/mssql/bin/mssql-conf setup

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Setup firewall
sudo ufw allow 5000/tcp
sudo ufw --force enable

echo "✅ Installation complete!"
echo "Next steps:"
echo "1. Create database using schema.sql"
echo "2. Copy backend files"
echo "3. Configure .env"
echo "4. Run: pm2 start server.js"
```

Run with: `bash install.sh`

---

## 💰 Cost Comparison

| Option | Monthly Cost |
|--------|--------------|
| Your own VM (Local/Cloud) | $0 - $10 |
| Azure SQL + App Service | ~$5 - $20 |
| AWS EC2 + RDS | ~$15 - $30 |

**Recommendation:** VM with SQL Server Express = **FREE** (or very cheap VPS)

---

## 📞 Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs energy-monitor

# Check if port is in use
netstat -tuln | grep 5000  # Linux
netstat -an | findstr 5000  # Windows

# Restart
pm2 restart energy-monitor
```

### Can't connect to database
```bash
# Check SQL Server is running
systemctl status mssql-server  # Linux
Get-Service MSSQL*  # Windows

# Test connection
sqlcmd -S localhost -U sa -P 'YourPassword' -Q "SELECT 1"
```

### Arduino can't reach VM
```bash
# Check firewall
sudo ufw status  # Linux
Get-NetFirewallRule -DisplayName "Energy*"  # Windows

# Test from another computer
curl http://VM_IP:5000/api/health
```

---

## ✅ Final Checklist

- [ ] SQL Server installed and running
- [ ] Database created with schema.sql
- [ ] Node.js installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Firewall port 5000 opened
- [ ] Backend running with PM2
- [ ] Health check passes: `curl http://VM_IP:5000/api/health`
- [ ] Arduino updated with VM IP address
- [ ] Test data sent successfully

Your VM is ready! 🎉
