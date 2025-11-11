# Azure Deployment Guide

## 🎯 Architecture Overview

```
Arduino + GSM → Azure App Service (Backend API) → Azure SQL Database
                            ↓
                    Azure Static Web Apps (Frontend)
```

---

## 📋 Prerequisites

- Azure Account (free tier works!)
- Azure CLI installed
- Git installed
- Node.js 18+ installed

---

## 1️⃣ Create Azure SQL Database

### Option A: Azure Portal (Easy)

1. **Go to Azure Portal** → Create Resource → SQL Database

2. **Database Settings:**
   - Database name: `EnergyMonitoring`
   - Server: Create new
     - Server name: `your-energy-db-server`
     - Admin login: `sqladmin`
     - Password: (create strong password)
     - Location: (choose closest region)
   - Compute + storage: Basic (5 DTUs) - **Costs ~$5/month**
   
3. **Networking:**
   - Allow Azure services: ✅ YES
   - Add current client IP: ✅ YES

4. **Create** and wait for deployment

### Option B: Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name EnergyMonitoringRG --location eastus

# Create SQL Server
az sql server create \
  --name your-energy-db-server \
  --resource-group EnergyMonitoringRG \
  --location eastus \
  --admin-user sqladmin \
  --admin-password "YourStrongPassword123!"

# Create Database
az sql db create \
  --resource-group EnergyMonitoringRG \
  --server your-energy-db-server \
  --name EnergyMonitoring \
  --service-objective Basic

# Allow Azure services
az sql server firewall-rule create \
  --resource-group EnergyMonitoringRG \
  --server your-energy-db-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Initialize Database

1. Go to Azure Portal → Your Database → Query Editor
2. Login with `sqladmin` and your password
3. Copy and paste the contents of `database/schema.sql`
4. Run the query

---

## 2️⃣ Deploy Backend to Azure App Service

### Get Database Connection String

```bash
# Get connection string
az sql db show-connection-string \
  --client ado.net \
  --server your-energy-db-server \
  --name EnergyMonitoring
```

Example output:
```
Server=tcp:your-energy-db-server.database.windows.net,1433;Database=EnergyMonitoring;User ID=sqladmin;Password={your_password};Encrypt=true;Connection Timeout=30;
```

### Deploy Backend

#### Option A: Azure Portal (Easy)

1. **Create App Service:**
   - Resource Group: `EnergyMonitoringRG`
   - Name: `energy-monitor-api`
   - Runtime: Node 18 LTS
   - Region: (same as database)
   - Pricing: F1 Free tier

2. **Configure Environment Variables:**
   - Go to App Service → Configuration → Application Settings
   - Add:
     ```
     DB_SERVER = your-energy-db-server.database.windows.net
     DB_NAME = EnergyMonitoring
     DB_USER = sqladmin
     DB_PASSWORD = YourStrongPassword123!
     PORT = 8080
     FRONTEND_URL = https://your-frontend.azurestaticapps.net
     ```

3. **Deploy Code:**
   ```bash
   cd backend
   
   # Install Azure CLI extension
   az extension add --name webapp
   
   # Deploy
   az webapp up \
     --name energy-monitor-api \
     --resource-group EnergyMonitoringRG \
     --runtime "NODE:18-lts"
   ```

#### Option B: GitHub Actions (Recommended)

1. **Create GitHub repository** and push your code

2. **In Azure Portal:**
   - Go to App Service → Deployment Center
   - Source: GitHub
   - Authorize and select your repository
   - Branch: main
   - Build provider: GitHub Actions

3. **Azure creates workflow automatically**

---

## 3️⃣ Deploy Frontend to Azure Static Web Apps

### Option A: Azure Portal

1. **Create Static Web App:**
   - Resource Group: `EnergyMonitoringRG`
   - Name: `energy-monitor-web`
   - Region: (choose closest)
   - Source: GitHub
   - Repository: (select your repo)
   - Build Presets: React
   - App location: `/frontend`
   - Api location: (leave empty)
   - Output location: `build`

2. **Update Frontend API URL:**
   
   In `frontend/package.json`, add:
   ```json
   "proxy": "https://energy-monitor-api.azurewebsites.net"
   ```
   
   Or create `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://energy-monitor-api.azurewebsites.net
   ```

3. **Commit and push** - Auto-deploys!

### Option B: Azure CLI

```bash
cd frontend

# Build
npm run build

# Deploy
az staticwebapp create \
  --name energy-monitor-web \
  --resource-group EnergyMonitoringRG \
  --source . \
  --location "East US 2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "build"
```

---

## 4️⃣ Configure Arduino

Update in `arduino_simple.ino`:

```cpp
const String DEVICE_ID = "device1";
const String SERVER_URL = "https://energy-monitor-api.azurewebsites.net/api/sensor/data";
```

---

## 5️⃣ Test Deployment

### Test Backend Health

```bash
curl https://energy-monitor-api.azurewebsites.net/api/health
```

Expected:
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "Energy Monitoring API"
}
```

### Test Arduino Endpoint

```bash
curl -X POST https://energy-monitor-api.azurewebsites.net/api/sensor/data \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"device1","data":5.2}'
```

Expected:
```json
{
  "success": true,
  "message": "Data received successfully"
}
```

### Test Frontend

Open: `https://energy-monitor-web.azurestaticapps.net`

---

## 💰 Cost Estimate

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Azure SQL Database | Basic (5 DTU) | ~$5 |
| App Service | F1 Free | $0 |
| Static Web App | Free | $0 |
| **Total** | | **~$5/month** |

*Free tier has limits but sufficient for testing/development*

---

## 🔒 Security Best Practices

### 1. Enable HTTPS Only

```bash
az webapp update \
  --name energy-monitor-api \
  --resource-group EnergyMonitoringRG \
  --https-only true
```

### 2. Restrict Database Access

```bash
# Get your Arduino's public IP
# Then add firewall rule:
az sql server firewall-rule create \
  --resource-group EnergyMonitoringRG \
  --server your-energy-db-server \
  --name ArduinoIP \
  --start-ip-address YOUR_ARDUINO_PUBLIC_IP \
  --end-ip-address YOUR_ARDUINO_PUBLIC_IP
```

### 3. Use Managed Identity (Optional, Advanced)

App Service can connect to SQL without passwords using Managed Identity.

---

## 📊 Monitor Your Application

### Application Insights (Optional)

1. Create Application Insights in Azure Portal
2. Copy instrumentation key
3. Add to App Service environment variables:
   ```
   APPINSIGHTS_INSTRUMENTATIONKEY = your-key
   ```

### View Logs

```bash
# Stream backend logs
az webapp log tail \
  --name energy-monitor-api \
  --resource-group EnergyMonitoringRG

# View SQL database queries
# Azure Portal → SQL Database → Query Performance Insight
```

---

## 🔄 Update Deployment

### Backend Updates

```bash
cd backend
az webapp up --name energy-monitor-api
```

### Frontend Updates

Just push to GitHub - auto-deploys!

---

## 🚨 Troubleshooting

### Backend won't connect to database

1. Check firewall rules in SQL Server
2. Verify connection string in App Service settings
3. Check backend logs: `az webapp log tail`

### Frontend can't reach backend

1. Check CORS settings in backend
2. Verify API URL in frontend .env
3. Check browser console for errors

### Arduino can't send data

1. Verify server URL is correct
2. Check Arduino has internet connection
3. Test endpoint with curl first
4. Check backend logs for errors

---

## 📱 URLs After Deployment

- **Frontend:** `https://energy-monitor-web.azurestaticapps.net`
- **Backend API:** `https://energy-monitor-api.azurewebsites.net`
- **Health Check:** `https://energy-monitor-api.azurewebsites.net/api/health`
- **Arduino Endpoint:** `https://energy-monitor-api.azurewebsites.net/api/sensor/data`

---

## 🎉 You're Done!

Your 3-phase energy monitoring system is now running on Azure! 🚀
