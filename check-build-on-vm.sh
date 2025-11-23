#!/bin/bash
# Script to check frontend build files on VM (172.200.84.132)

echo "================================================"
echo "🔍 Checking Frontend Build on VM"
echo "================================================"

# Check if project directory exists
echo -e "\n1️⃣ Checking project directory..."
if [ -d ~/energy-monitoring/Energy-Monitor ]; then
    echo "✅ Project directory exists"
    cd ~/energy-monitoring/Energy-Monitor
else
    echo "❌ Project directory not found!"
    echo "Expected: ~/energy-monitoring/Energy-Monitor"
    exit 1
fi

# Check current branch
echo -e "\n2️⃣ Checking Git branch..."
BRANCH=$(git branch --show-current)
echo "Current branch: $BRANCH"
if [ "$BRANCH" = "production" ]; then
    echo "✅ On production branch"
else
    echo "⚠️  Not on production branch, switching..."
    git checkout production
fi

# Check latest commit
echo -e "\n3️⃣ Checking Git status..."
git log -1 --oneline

# Check if build folder exists
echo -e "\n4️⃣ Checking build folder..."
if [ -d frontend/build ]; then
    echo "✅ Build folder exists"
    echo ""
    echo "Build folder contents:"
    ls -lh frontend/build/
    echo ""
    echo "Static files:"
    ls -lh frontend/build/static/js/ 2>/dev/null
    ls -lh frontend/build/static/css/ 2>/dev/null
else
    echo "❌ Build folder not found!"
    echo "You need to pull latest code: git pull origin production"
    exit 1
fi

# Check nginx deployment
echo -e "\n5️⃣ Checking nginx deployment..."
if [ -d /var/www/html ]; then
    echo "Nginx web root contents:"
    sudo ls -lh /var/www/html/
    echo ""
    
    # Check if index.html exists
    if [ -f /var/www/html/index.html ]; then
        echo "✅ index.html exists in nginx"
        echo "First line of index.html:"
        sudo head -n 1 /var/www/html/index.html
    else
        echo "❌ index.html NOT found in nginx!"
        echo "You need to deploy: sudo cp -r frontend/build/* /var/www/html/"
    fi
else
    echo "❌ Nginx directory not found!"
fi

# Check nginx status
echo -e "\n6️⃣ Checking nginx status..."
sudo systemctl status nginx --no-pager | head -n 5

# Check if files are accessible via HTTP
echo -e "\n7️⃣ Testing HTTP access..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Nginx is serving files (HTTP $HTTP_CODE)"
else
    echo "⚠️  HTTP returned: $HTTP_CODE"
fi

# Check backend status
echo -e "\n8️⃣ Checking backend status..."
pm2 list | grep energy-backend

# Test backend API
echo -e "\n9️⃣ Testing backend API..."
API_RESPONSE=$(curl -s http://localhost:5000/api/sensor/latest/DEVICE_001)
if [ $? -eq 0 ]; then
    echo "✅ Backend API is accessible"
    echo "Response preview:"
    echo "$API_RESPONSE" | head -n 3
else
    echo "❌ Backend API is NOT accessible"
fi

echo -e "\n================================================"
echo "✅ Check Complete!"
echo "================================================"
echo ""
echo "📝 Summary:"
echo "  - Build folder: $([ -d frontend/build ] && echo '✅ Exists' || echo '❌ Missing')"
echo "  - Nginx files: $([ -f /var/www/html/index.html ] && echo '✅ Deployed' || echo '❌ Not deployed')"
echo "  - Nginx status: $(sudo systemctl is-active nginx)"
echo "  - Backend API: $([ -n "$API_RESPONSE" ] && echo '✅ Running' || echo '❌ Not running')"
echo ""
