# VM Deployment Guide - Energy Monitoring System (Ubuntu)

## 📋 Complete Step-by-Step Deployment to Ubuntu VM

This guide provides exact commands for deploying your Energy Monitoring System to an Ubuntu VM.

---

## 💡 BEST PRACTICES: Avoiding Common Mistakes

### Always Check Your Current Directory

Before running any command, verify your location:

```bash
# Check current directory
pwd

# Expected outputs for different locations:
# /home/username/energy-monitoring/Energy-Monitor           (project root)
# /home/username/energy-monitoring/Energy-Monitor/backend   (backend)
# /home/username/energy-monitoring/Energy-Monitor/frontend  (frontend)
```

### Safe Navigation Commands

```bash
# Always start from home directory if lost
cd ~

# Then navigate to your project
cd ~/energy-monitoring/Energy-Monitor

# Verify you're in the right place
pwd
ls -la

# To go to backend specifically
cd ~/energy-monitoring/Energy-Monitor/backend
pwd  # Verify: should show .../Energy-Monitor/backend

# To go to frontend specifically
cd ~/energy-monitoring/Energy-Monitor/frontend
pwd  # Verify: should show .../Energy-Monitor/frontend
```

### Create Command Aliases (Time Saver!)

Add these to your `~/.bashrc` file for quick navigation:

```bash
# Edit bashrc
nano ~/.bashrc

# Add these lines at the end:
alias backend='cd ~/energy-monitoring/Energy-Monitor/backend && pwd'
alias frontend='cd ~/energy-monitoring/Energy-Monitor/frontend && pwd'
alias project='cd ~/energy-monitoring/Energy-Monitor && pwd'

# Save and exit (Ctrl+X, Y, Enter)

# Apply changes
source ~/.bashrc
```

**Now you can use:**
```bash
# Go to backend and see where you are
backend

# Go to frontend and see where you are
frontend

# Go to project root and see where you are
project
```

### Command Safety Checklist

Before running any command, ask yourself:

1. **Am I in the right directory?**
   ```bash
   pwd  # Check current location
   ```

2. **Does this file/folder exist here?**
   ```bash
   ls -la  # List all files in current directory
   ```

3. **Am I in the backend or frontend folder?**
   ```bash
   pwd | grep -E "(backend|frontend)"
   ```

### Common Mistakes to Avoid

❌ **Wrong:**
```bash
cd ~/energy-monitoring
npm install  # Error! No package.json here
```

✅ **Correct:**
```bash
cd ~/energy-monitoring/Energy-Monitor/backend
pwd  # Verify location first
npm install  # Now it works!
```

❌ **Wrong:**
```bash
# From any random folder
pm2 restart energy-backend  # Works but might confuse you
```

✅ **Correct:**
```bash
cd ~/energy-monitoring/Energy-Monitor/backend
pwd  # Verify you're in backend
pm2 restart energy-backend  # Now you know where you are
```

### Quick Recovery Commands

If you get lost:

```bash
# 1. Go home
cd ~

# 2. List your folders
ls -la

# 3. Navigate properly
cd energy-monitoring/Energy-Monitor/backend

# 4. Confirm location
pwd
```

---

## 🎯 PART 1: PREPARE YOUR LOCAL PROJECT

### Step 1.1: Commit Current Changes to Main Branch

```bash
# Navigate to project root
cd "f:\Projects\CREATIVE DESIGN\3 phase energy monitoring system"

# Check current status
git status

# Add all files (except .env and firebase JSON - already in .gitignore)
git add .

# Commit changes
git commit -m "Prepare backend for VM deployment with Firebase"

# Push to main branch
git push origin main
```

### Step 1.2: Create Production Branch for VM Deployment

```bash
# Create and switch to production branch
git checkout -b production

# Verify you're on production branch
git branch

# Push production branch to GitHub
git push -u origin production
```

**Note:** The production branch will be used on your VM. Main branch remains for development.

---

## 🖥️ PART 2: SETUP UBUNTU VM (Fresh Installation)

### Step 2.1: Connect to Your Ubuntu VM

```bash
# From Windows PowerShell or Command Prompt
ssh username@YOUR_VM_IP

# Example:
# ssh azureuser@20.123.45.67
```

**Replace:**
- `username` with your VM username (often `azureuser` for Azure VMs)
- `YOUR_VM_IP` with your actual VM IP address

### Step 2.2: Update Ubuntu System

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl wget git
```

### Step 2.3: Install Node.js (v20 LTS)

```bash
# Install Node.js 20.x LTS using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify installation
node --version
# Expected output: v20.x.x

npm --version
# Expected output: 10.x.x
```

### Step 2.4: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 2.5: Install Nginx (Web Server - Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## 📁 PART 3: CLONE PROJECT TO VM

### Step 3.1: Create Project Directory

```bash
# Create directory for the project
mkdir -p ~/energy-monitoring

# Navigate to directory
cd ~/energy-monitoring

# Verify current path
pwd
# Expected output: /home/username/energy-monitoring
```

### Step 3.2: Clone Repository from GitHub

```bash
# Clone the repository
git clone https://github.com/sthmu/Energy-Monitor.git

# Navigate into the cloned repository
cd Energy-Monitor

# Switch to production branch
git checkout production

# Verify branch
git branch
# Should show * production

# List files to confirm
ls -la

# Your directory structure is now:
# ~/energy-monitoring/Energy-Monitor/backend
# ~/energy-monitoring/Energy-Monitor/frontend
```

**Note:** If your repository is private, you'll need to authenticate:
```bash
# Generate SSH key on VM (if not already done)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Copy this key and add to GitHub → Settings → SSH Keys
```

---

## 🔧 PART 4: SETUP BACKEND

### Step 4.1: Navigate to Backend Directory

```bash
# Go to backend folder
cd ~/energy-monitoring/Energy-Monitor/backend

# List files to verify
ls -la
```

### Step 4.2: Install Backend Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - express
# - socket.io
# - firebase-admin
# - dotenv
# - cors
# And all other dependencies from package.json
```

**Expected output:**
```
added XXX packages in XXs
```

### Step 4.3: Create Environment File (.env)

```bash
# Create .env file
nano .env
```

**Copy and paste this content** (press Shift+Insert to paste in terminal):

```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://YOUR_VM_IP:3000

# Firebase Configuration
FIREBASE_PROJECT_ID=energy-monitoring-system-s
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCut1QM3FiUdsLq\ndGRDY5iwt/p3EEHnagAVetRBIKVKWAyv0wmI7ImNFUwDFlJqjXp5nEYe5ZWMmsiL\nS61H75WK6OMrLD3Ym9RyKGue1tOgO3U98jc10VbSq0ZIsar75Wa0TXPdl2z3A7V7\nJy7vwQ7UqHJTMrMkZFUwJ2NVoMsVSHCZGdxr4wEhjll9CfgmkOM9KdE5r70sp7aG\nzsqBBw5s2vTY+2U5l0UI5EIXwTC4KjtyyLKNN6+WFY7tE6SQ/mcQbM2aYkflDD9G\nlHKW0h7ZgdstHz49Tm/G/brBOU1rUjlSSW3ULtLLmQobxkMXenfga3V8uWrhlZ12\ndJ9XzFrVAgMBAAECggEAMwftDsyVOtftWpmgZ2aBxKwYBgrDlRoK6Ds2H8evP6W0\nHu7fDBU6n/CmgQhWDjVAnqCcgo3APo8/ICB8flRmM2qOX5/OeKQbSzSvKnfI3DZB\nqlRC9/8rAuFv5++s52I7u1IcE48VDpkQuuXY+cJD2K1SpyZZ2LlNgIEgrHQInTBN\nt6YPTRReaWhV+BCFMnrHMzXB53QlrYtJuDRgg58wn+BUW6q23F2z0Nw4m5vd3EAW\naCKmKsBJeWf3cuqhdYl17F1kNIU9Yyg8H7EafmJxM++XXx7Cw/XQ2LS8dZWnvXe4\nWz1g9j4ics3F+kJI6SPGBouWQqT1IyR3rkZQZmoUiQKBgQDdNpWaUmZwJ1P3lu20\nsW68A/frgXk+mqifhHdcEp/RorglA7pB+oJWO/0UYNRJB/nUl6ucblRoulprYXas\ndQUu91RDcLk3z/RRCRQboCjr+JEodxYnsuV69BJGFsG19xSX9LaI9Xx89CbxWSBz\nteOnlsgOyOirBZk51ZZWxBs0jwKBgQDKMOcvM1sV1cm6/URlAyLTgQaa5AZHxNSZ\nFr+hQF/1d3Jh5qcXixctWu583NH6OQDIUhlWdNJDK9je33BLvxE4BSbDAJVucTCn\np5eUrUDcxgWLKzbhmQh3qmBMwR7n8uyIzGs5jrUANdx82VN3OrBsD4Vu6SkLtrth\nvwNEJ2KUWwKBgAYV+VmsiKrvOg0mttVwyDYd+dUd08MYKClzUIFU9dajnmNOTfKA\nvNM4hUbpPw3fTU0++varxmC3N8Oag9RMx9656TSNxlq1uuf70vTLnDSZuwyc8hwX\nfN68FkCdYajq6kMf9WGhN1KMuQGMzSrBx0iWClz1xAjod4WyzZcHgCQbAoGANI/D\n+bxDCIkcOTUP66aGDi+zlN6EV3HuxqFoTbYbfAeCP7sjYvZwnwTNjL4nBAJ/lpPp\nLFWQN5AVf9LcMYTJKCQGsJjdP+nC+UKTID5t5za/SC+Cw+Dxl5I+GJX3v9qh7Oof\nUcYsfZKC8B3bGdqy9FSQnoWUewwU6FMsuTH36ZMCgYA0bfxQ5X2XFszk2lz+dbU0\ntMYpw8wKYb1CGQ1P7qFsFQ1J/OSATvY5oC9Y8dEt2k+YdijkZ56GiGvIOuCkKEv/\nVLbypFl+1ofB0QQiOIQ+igfVMUt/8vrgs/aqTPSvRlBt+y7rv2NckFwfLriZQdvQ\nTHel+TjWY7Nx5uuutqG56g==\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@energy-monitoring-system-s.iam.gserviceaccount.com
```

**Important:** Replace `YOUR_VM_IP` with your actual VM IP address.

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 4.4: Verify .env File

```bash
# Check if .env file was created
ls -la .env

# View content (to verify)
cat .env

# Check file permissions

# Verify environment variables load correctly
node -e "require('dotenv').config(); console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);"
# Expected output: Project ID: energy-monitoring-system-s
```

### Step 4.5: Test Backend Locally

```bash
# Start backend in development mode (foreground)
npm start

# You should see:
# 🔐 Using Firebase credentials from environment variables
# ✅ Firebase initialized successfully
# 📊 Project ID: energy-monitoring-system-s
# 🚀 Server running on port 5000
# 📊 Firebase Firestore connected
```

**Test in another terminal:**
```bash
# Open new SSH session
ssh username@YOUR_VM_IP

# Test health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","database":"connected","service":"Energy Monitoring API"}
```

**If working, press `Ctrl + C` to stop the server.**

---

## 🚀 PART 5: RUN BACKEND WITH PM2 (Production)

### Step 5.1: Start Backend with PM2

```bash
# Make sure you're in backend directory
cd ~/energy-monitoring/Energy-Monitor/backend

# Start application with PM2
pm2 start server.js --name energy-backend

# View status
pm2 status

# View logs
pm2 logs energy-backend

# Press Ctrl+C to exit logs
```

### Step 5.2: Configure PM2 Auto-Restart on Reboot

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u username --hp /home/username

# Copy and run that command (it will be specific to your system)

# Save current PM2 process list
pm2 save

# Verify
pm2 list
```

### Step 5.3: PM2 Useful Commands

```bash
# View real-time logs
pm2 logs energy-backend

# Restart application
pm2 restart energy-backend

# Stop application
pm2 stop energy-backend

# Delete from PM2
pm2 delete energy-backend

# Monitor CPU/Memory
pm2 monit

# View detailed info
pm2 info energy-backend
```

---

## 🌐 PART 6: CONFIGURE FIREWALL

### Step 6.1: Configure Ubuntu UFW Firewall

```bash
# Check if UFW is active
sudo ufw status

# If inactive, enable it
sudo ufw enable

# Allow SSH (IMPORTANT - don't lock yourself out!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow backend port
sudo ufw allow 5000/tcp

# Allow HTTP (for Nginx)
sudo ufw allow 80/tcp

# Allow HTTPS (for future SSL)
sudo ufw allow 443/tcp

# Verify rules
sudo ufw status numbered

# Expected output:
# Status: active
# 
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 5000/tcp                   ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

### Step 6.2: Configure Azure Network Security Group (NSG)

**If using Azure VM, also configure NSG in Azure Portal:**

1. Go to Azure Portal → Your VM → Networking
2. Click "Add inbound port rule"
3. Add these rules:

**Rule 1 - Backend API:**
- Source: Any
- Source port ranges: *
- Destination: Any
- Service: Custom
- Destination port ranges: 5000
- Protocol: TCP
- Action: Allow
- Priority: 310
- Name: Allow-Backend-5000

**Rule 2 - Frontend (if deploying frontend):**
- Source: Any
- Source port ranges: *
- Destination: Any
- Service: HTTP
- Destination port ranges: 80
- Protocol: TCP
- Action: Allow
- Priority: 320
- Name: Allow-HTTP-80

---

## 🧪 PART 7: TEST DEPLOYMENT

### Step 7.1: Test Backend from Outside VM

**From your local Windows machine (PowerShell):**

```powershell
# Test health endpoint
curl http://YOUR_VM_IP:5000/api/health

# Test sensor data endpoint
curl -X POST http://YOUR_VM_IP:5000/api/sensor/data -H "Content-Type: application/json" -d '{\"deviceId\":\"device1\",\"data\":5.2}'

# Expected response:
# {"success":true,"message":"Data received successfully","timestamp":"...","deviceId":"device1","current":5.2}
```

**From your browser:**
```
http://YOUR_VM_IP:5000/api/health
```

### Step 7.2: Check Firebase Data

**On VM, verify data is being stored:**
```bash
# View PM2 logs
pm2 logs energy-backend --lines 50

# You should see successful Firebase operations
```

**Check Firebase Console:**
1. Go to https://console.firebase.google.com
2. Select your project: `energy-monitoring-system-s`
3. Go to Firestore Database
4. You should see `sensorData` collection with documents

---

## 📊 PART 8: DEPLOY FRONTEND (Optional)

### Step 8.1: Build Frontend on Local Machine

**On your local Windows machine:**

```powershell
# Navigate to frontend directory
cd "f:\Projects\CREATIVE DESIGN\3 phase energy monitoring system\frontend"

# Create production environment file
New-Item -Path ".env.production" -ItemType File -Force

# Edit .env.production (use notepad)
notepad .env.production
```

**Add this to .env.production:**
```env
REACT_APP_API_URL=http://YOUR_VM_IP:5000
```

**Build frontend:**
```powershell
# Install dependencies if not already done
npm install

# Build for production
npm run build

# This creates a 'build' folder with static files
```

### Step 8.2: Upload Frontend Build to VM

**Option A - Using SCP from Windows:**
```powershell
# Upload build folder to VM
scp -r "f:\Projects\CREATIVE DESIGN\3 phase energy monitoring system\frontend\build" username@YOUR_VM_IP:/home/username/energy-monitoring/frontend/
```

**Option B - Commit and Pull (Recommended):**
```bash
# On local machine - commit build
git add frontend/build
git add frontend/.env.production
git commit -m "Add production build"
git push origin production

# On VM - pull changes
    cd ~/energy-monitoring/Energy-Monitor
git pull origin production
```

### Step 8.3: Configure Nginx to Serve Frontend

**On VM:**
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/energy-monitoring
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name YOUR_VM_IP;

    # Frontend
    location / {
        root /home/username/energy-monitoring/Energy-Monitor/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket for Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Replace `YOUR_VM_IP` and `username` with actual values.**

**Save and exit** (`Ctrl+X`, `Y`, `Enter`)

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/energy-monitoring /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Expected output: syntax is ok

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Step 8.4: Test Frontend

**From browser:**
```
http://YOUR_VM_IP
```

You should see your React dashboard!

---

## 🔄 PART 9: UPDATE DEPLOYMENT

### When You Make Changes:

**On local machine:**
```powershell
# Make your changes
# Commit changes
git add .
git commit -m "Your update message"
git push origin production
```

**On VM:**
```bash
# Pull latest changes
cd ~/energy-monitoring/Energy-Monitor
git pull origin production

# If backend changes, reinstall dependencies
cd backend
npm install

# Restart backend
pm2 restart energy-backend

# If frontend changes, rebuild and update
cd ../frontend
npm install
npm run build
sudo systemctl restart nginx
```

---

## 📝 PART 10: MONITORING & MAINTENANCE

### Check Application Status

```bash
# PM2 status
pm2 status

# View logs (last 100 lines)
pm2 logs energy-backend --lines 100

# Monitor resources
pm2 monit

# Check disk space
df -h

# Check memory
free -h

# Check running processes
htop
# (Install with: sudo apt install htop)
```

### Backup .env File

```bash
# Create backup
cp ~/energy-monitoring/Energy-Monitor/backend/.env ~/energy-monitoring/Energy-Monitor/backend/.env.backup

# List backups
ls -la ~/energy-monitoring/Energy-Monitor/backend/.env*
```

### View System Logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

---

## 🐛 TROUBLESHOOTING

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs energy-backend

# Check if port is in use
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 <PID>

# Restart
pm2 restart energy-backend
```

### Firebase Connection Error

```bash
# Verify .env file
cat ~/energy-monitoring/Energy-Monitor/backend/.env

# Test environment variables
cd ~/energy-monitoring/Energy-Monitor/backend
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PROJECT_ID);"

# Check Firebase credentials format
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PRIVATE_KEY.substring(0, 50));"
```

### Port Access Issues

```bash
# Check UFW status
sudo ufw status

# Check if port is listening
sudo netstat -tulpn | grep :5000

# Test from VM
curl http://localhost:5000/api/health
```

### Nginx Not Serving Frontend

```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check logs
sudo tail -50 /var/log/nginx/error.log
```

---

## ✅ DEPLOYMENT CHECKLIST

### Initial Setup
- [ ] Ubuntu VM created
- [ ] SSH access configured
- [ ] System updated (`sudo apt update && sudo apt upgrade`)
- [ ] Node.js installed (v20.x)
- [ ] PM2 installed globally
- [ ] Nginx installed (optional)

### Git Repository
- [ ] Code committed to main branch
- [ ] Production branch created
- [ ] Production branch pushed to GitHub
- [ ] Repository cloned on VM
- [ ] Checked out production branch

### Backend Setup
- [ ] Navigated to backend directory
- [ ] `npm install` completed
- [ ] `.env` file created with Firebase credentials
- [ ] Environment variables verified
- [ ] Backend tested with `npm start`
- [ ] PM2 process started
- [ ] PM2 startup script configured
- [ ] PM2 list saved

### Firewall Configuration
- [ ] UFW enabled
- [ ] SSH port allowed (22)
- [ ] Backend port allowed (5000)
- [ ] HTTP port allowed (80)
- [ ] Azure NSG rules added (if using Azure)

### Testing
- [ ] Health endpoint responds: `curl http://YOUR_VM_IP:5000/api/health`
- [ ] Sensor data endpoint works
- [ ] Firebase stores data correctly
- [ ] PM2 logs show no errors
- [ ] Frontend accessible (if deployed)

### Production Ready
- [ ] PM2 auto-restart configured
- [ ] `.env` file backed up
- [ ] Monitoring setup (PM2 logs)
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## 🎯 QUICK REFERENCE COMMANDS

### SSH to VM
```bash
ssh username@YOUR_VM_IP
```

### Navigate to Project
```bash
cd ~/energy-monitoring/Energy-Monitor/backend
```

### PM2 Commands
```bash
pm2 list                    # List all processes
pm2 logs energy-backend     # View logs
pm2 restart energy-backend  # Restart backend
pm2 stop energy-backend     # Stop backend
pm2 start server.js --name energy-backend  # Start backend
pm2 monit                   # Monitor resources
```

### Git Commands
```bash
git pull origin production  # Pull latest changes
git status                  # Check status
git log --oneline -5        # View recent commits
```

### Service Commands
```bash
sudo systemctl restart nginx    # Restart Nginx
sudo systemctl status nginx     # Check Nginx status
sudo ufw status                 # Check firewall
```

### Test Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Send sensor data
curl -X POST http://localhost:5000/api/sensor/data \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"device1","data":5.2}'
```

---

## 🔒 SECURITY NOTES

1. **Never commit `.env` file** - It contains sensitive Firebase credentials
2. **Never commit Firebase JSON file** - Already in `.gitignore`
3. **Keep SSH keys secure** - Use strong passwords or key-based authentication
4. **Regular updates** - Run `sudo apt update && sudo apt upgrade` weekly
5. **Monitor logs** - Check PM2 logs regularly for suspicious activity
6. **Firewall rules** - Only open necessary ports
7. **SSL Certificate** - Set up HTTPS with Let's Encrypt for production
8. **Backup `.env`** - Keep a secure backup of your environment variables

---

## 📞 SUPPORT

If you encounter issues:
1. Check PM2 logs: `pm2 logs energy-backend`
2. Check Nginx logs: `sudo tail -50 /var/log/nginx/error.log`
3. Verify firewall: `sudo ufw status`
4. Test locally: `curl http://localhost:5000/api/health`
5. Check Firebase Console for data

---

**Your backend is now deployed and running on Ubuntu VM! 🎉**
