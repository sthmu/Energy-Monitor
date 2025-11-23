# Frontend Configuration Guide

## 🌐 **API URL Configuration**

Your frontend can connect to the backend in two ways:

### ✅ **Recommended: Use VM Backend (Current Setup)**

This is already configured and working!

---

## 📋 **Environment Files**

### **1. `.env.production`** ✅
```bash
REACT_APP_API_URL=http://172.200.84.132:5000
```
**When used**: Production builds (`npm run build`)  
**Purpose**: Deployed app connects to VM backend  
**Status**: ✅ Already configured correctly

### **2. `.env.development`** ✅ (Just created)
```bash
REACT_APP_API_URL=http://172.200.84.132:5000
```
**When used**: Development mode (`npm start`)  
**Purpose**: Develop on Windows, connect to VM backend  
**Status**: ✅ Just created for you

### **3. `.env.local.example`** (Template)
```bash
REACT_APP_API_URL=http://localhost:5000
```
**When used**: Only if running backend locally  
**Purpose**: Template file (not used by default)  
**How to use**: `cp .env.local.example .env.local`

---

## 🎯 **Usage Scenarios**

### **Scenario 1: Development on Windows (Recommended)**

```bash
# Frontend runs on Windows PC
# Backend runs on VM
cd frontend
npm start
```

**What happens:**
- Browser opens: `http://localhost:3000` (your PC)
- API calls go to: `http://172.200.84.132:5000` (VM)
- You can edit code and see changes instantly
- Backend stays on VM (no need to run locally)

**Advantages:**
- ✅ Easy setup
- ✅ No backend installation needed on Windows
- ✅ Always uses real data from VM
- ✅ Tests against production backend

---

### **Scenario 2: Production Deployment**

```bash
# Build for production
cd frontend
npm run build

# Deploy to VM (using your script)
scp auto-deploy.sh jagath@172.200.84.132:~/
ssh jagath@172.200.84.132
./auto-deploy.sh
```

**What happens:**
- Creates optimized build
- Uses `.env.production` settings
- Deployed app connects to: `http://172.200.84.132:5000`
- Users access via: `http://172.200.84.132`

---

### **Scenario 3: Local Backend (Optional)**

If you want to run backend on Windows:

```bash
# 1. Copy template
cp .env.local.example .env.local

# 2. .env.local will override other settings
REACT_APP_API_URL=http://localhost:5000

# 3. Start backend locally (you need Node.js + Firebase setup)
cd backend
node server.js

# 4. Start frontend
cd frontend
npm start
```

**Note**: This requires setting up Firebase credentials on Windows (complex)

---

## 🔍 **How to Verify Configuration**

### **Check Current Configuration:**

Open browser console (F12) when running `npm start`, you should see:

```
🔧 Energy Service Configuration:
   API_URL: http://172.200.84.132:5000
   Environment: development
   REACT_APP_API_URL: http://172.200.84.132:5000
```

### **Test API Connection:**

```bash
# From Windows PowerShell
Invoke-RestMethod -Uri "http://172.200.84.132:5000/api/sensor/latest/DEVICE_001" -Method Get
```

Should return sensor data (not 404 error)

---

## 🐛 **Common Issues**

### **Issue 1: CORS Errors**

If you see in browser console:
```
Access to XMLHttpRequest at 'http://172.200.84.132:5000' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution**: Backend needs CORS configured (already done in your server.js)

Verify backend has:
```javascript
app.use(cors({
  origin: '*', // or specific origins
  credentials: true
}));
```

---

### **Issue 2: Connection Refused**

If API calls fail with "Connection refused":

**Causes:**
1. Backend not running on VM
2. Firewall blocking port 5000
3. Wrong IP address

**Fix:**
```bash
# SSH to VM
ssh jagath@172.200.84.132

# Check backend
pm2 status
pm2 logs energy-backend

# Restart if needed
pm2 restart energy-backend

# Check if port is open
sudo netstat -tlnp | grep 5000
```

---

### **Issue 3: Wrong API URL**

If seeing 404 errors on old endpoints:

**Check:**
1. Clear browser cache (Ctrl+Shift+R)
2. Verify build is latest:
   ```bash
   # On VM
   sudo ls -lh /var/www/html/static/js/main.*.js
   # Should show: main.0cdb1d79.js
   ```
3. Check console for API_URL value

---

## 📝 **Environment Priority**

React loads environment files in this order (later ones override earlier):

1. `.env` (base config)
2. `.env.local` (local overrides, git ignored)
3. `.env.development` or `.env.production` (based on NODE_ENV)
4. `.env.development.local` or `.env.production.local` (git ignored)

**Your setup:**
- Development (`npm start`): Uses `.env.development` → `http://172.200.84.132:5000`
- Production (`npm run build`): Uses `.env.production` → `http://172.200.84.132:5000`

---

## 🎨 **Visual Flow**

### **Development Mode:**
```
┌─────────────────┐
│  Windows PC     │
│  localhost:3000 │ ← Your browser
│  (Frontend)     │
└────────┬────────┘
         │ HTTP requests
         ↓
┌─────────────────┐
│  VM Server      │
│  172.200.84.132 │
│  Port 5000      │ ← Backend API
│  (Backend)      │
└─────────────────┘
```

### **Production Mode:**
```
┌─────────────────┐
│  Browser        │
│  172.200.84.132 │ ← User visits
│  Port 80        │
└────────┬────────┘
         │ HTTP requests
         ↓
┌─────────────────┐
│  VM Server      │
│  172.200.84.132 │
│  Port 80 (nginx)│ ← Serves frontend
│  Port 5000      │ ← Backend API
└─────────────────┘
```

---

## ✅ **Best Practices**

### **For Development:**
1. ✅ Use `.env.development` pointing to VM
2. ✅ Keep backend running on VM (easier)
3. ✅ Run frontend locally for hot-reload
4. ✅ Check console for API_URL on startup

### **For Production:**
1. ✅ Use `.env.production` pointing to VM
2. ✅ Build before deploying: `npm run build`
3. ✅ Use auto-deploy script
4. ✅ Test after deployment

### **Security:**
- ❌ Never commit `.env.local` (contains secrets)
- ✅ Commit `.env.example` (template)
- ✅ Commit `.env.production` (public VM IP is okay)
- ✅ Use environment-specific configs

---

## 🔧 **Quick Reference**

| Command | Environment | API URL |
|---------|-------------|---------|
| `npm start` | development | From `.env.development` |
| `npm run build` | production | From `.env.production` |
| `npm test` | test | From `.env.test` (if exists) |

---

## 📞 **Testing Checklist**

Before deploying, verify:

- [ ] `npm start` works on Windows
- [ ] Console shows correct API_URL
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors
- [ ] Dashboard loads data
- [ ] Bar graph displays
- [ ] Time filters work
- [ ] No 404 errors

---

**Summary**: You're already set up correctly! Just run `npm start` on Windows and it will connect to your VM backend automatically. No need to run backend locally! 🎉
