#!/bin/bash
################################################################################
# Auto Deploy Script for Energy Monitoring Dashboard
# This script forcefully updates and deploys the latest code from GitHub
################################################################################

set -e  # Exit on any error

# Configuration
PROJECT_DIR="$HOME/energy-monitoring/Energy-Monitor"
BRANCH="production"
NGINX_DIR="/var/www/html"
BACKEND_PROCESS="energy-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Energy Monitor - Auto Deploy Script v1.0              ║"
echo "║     Forceful Update & Deployment to Production            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print step
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

################################################################################
# Step 1: Check Prerequisites
################################################################################
print_step "Step 1: Checking prerequisites..."

if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi
print_success "Project directory exists"

cd "$PROJECT_DIR"

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed!"
    exit 1
fi
print_success "Git is installed"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository!"
    exit 1
fi
print_success "Git repository verified"

################################################################################
# Step 2: Backup Current State (Optional)
################################################################################
print_step "Step 2: Creating backup..."

BACKUP_DIR="$HOME/energy-monitoring-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Backup nginx files
if [ -d "$NGINX_DIR" ]; then
    sudo cp -r "$NGINX_DIR" "$BACKUP_PATH"
    print_success "Backup created: $BACKUP_PATH"
else
    print_warning "Nginx directory not found, skipping backup"
fi

################################################################################
# Step 3: Force Pull Latest Code
################################################################################
print_step "Step 3: Forcing pull from GitHub ($BRANCH branch)..."

# Show current commit
echo "Current commit:"
git log -1 --oneline

# Fetch latest changes
print_step "Fetching latest changes..."
git fetch origin "$BRANCH"

# Discard all local changes and force update
print_step "Resetting to origin/$BRANCH (this will discard local changes)..."
git reset --hard "origin/$BRANCH"

# Clean untracked files
print_step "Cleaning untracked files..."
git clean -fd

# Pull to ensure we're up to date
print_step "Pulling latest changes..."
git pull origin "$BRANCH"

print_success "Code updated successfully!"

# Show new commit
echo "New commit:"
git log -1 --oneline

################################################################################
# Step 4: Verify Build Files
################################################################################
print_step "Step 4: Verifying build files..."

if [ ! -d "frontend/build" ]; then
    print_error "Build directory not found! You need to build the frontend first."
    exit 1
fi

if [ ! -f "frontend/build/index.html" ]; then
    print_error "index.html not found in build directory!"
    exit 1
fi

print_success "Build files verified"

# Show build file details
echo "Build files:"
ls -lh frontend/build/static/js/main.*.js 2>/dev/null || echo "No JS files found"
ls -lh frontend/build/static/css/main.*.css 2>/dev/null || echo "No CSS files found"

################################################################################
# Step 5: Deploy to Nginx
################################################################################
print_step "Step 5: Deploying to nginx..."

# Stop nginx temporarily (optional)
# sudo systemctl stop nginx

# Remove old files
print_step "Removing old files from $NGINX_DIR..."
sudo rm -rf "$NGINX_DIR"/*

# Copy new build files
print_step "Copying new build files..."
sudo cp -r frontend/build/* "$NGINX_DIR/"

# Set proper permissions
print_step "Setting permissions..."
sudo chown -R www-data:www-data "$NGINX_DIR"
sudo chmod -R 755 "$NGINX_DIR"

print_success "Files deployed to nginx"

# Verify deployment
echo "Deployed files:"
sudo ls -lh "$NGINX_DIR"/static/js/main.*.js 2>/dev/null || echo "No JS files found"

################################################################################
# Step 6: Restart Backend (Optional)
################################################################################
print_step "Step 6: Restarting backend..."

if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "$BACKEND_PROCESS"; then
        pm2 restart "$BACKEND_PROCESS"
        print_success "Backend restarted"
    else
        print_warning "Backend process '$BACKEND_PROCESS' not found in PM2"
    fi
else
    print_warning "PM2 not installed, skipping backend restart"
fi

################################################################################
# Step 7: Restart Nginx
################################################################################
print_step "Step 7: Restarting nginx..."

sudo systemctl restart nginx

# Check nginx status
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx failed to start!"
    sudo systemctl status nginx --no-pager
    exit 1
fi

################################################################################
# Step 8: Verification
################################################################################
print_step "Step 8: Running verification tests..."

# Test HTTP access
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "HTTP test passed (Status: $HTTP_CODE)"
else
    print_warning "HTTP returned: $HTTP_CODE"
fi

# Test backend API
if curl -s http://localhost:5000/api/sensor/latest/DEVICE_001 > /dev/null 2>&1; then
    print_success "Backend API is accessible"
else
    print_warning "Backend API test failed (might be normal if no data)"
fi

################################################################################
# Step 9: Summary
################################################################################
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  DEPLOYMENT SUMMARY                        ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "  ${GREEN}✅ Git Branch:${NC}      $BRANCH"
echo -e "  ${GREEN}✅ Commit:${NC}          $(git log -1 --oneline | cut -d' ' -f1)"
echo -e "  ${GREEN}✅ Build Files:${NC}     Deployed to $NGINX_DIR"
echo -e "  ${GREEN}✅ Nginx Status:${NC}    $(sudo systemctl is-active nginx)"
echo -e "  ${GREEN}✅ Backend Status:${NC}  $(pm2 list 2>/dev/null | grep -q "$BACKEND_PROCESS" && echo "Running" || echo "Unknown")"
echo -e "  ${GREEN}✅ Backup:${NC}          $BACKUP_PATH"
echo ""
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Open browser: http://172.200.84.132"
echo "  2. Press Ctrl+Shift+R to hard refresh"
echo "  3. Check browser console (F12) for errors"
echo "  4. Verify bar graph is displaying correctly"
echo ""
echo -e "${YELLOW}📊 View Logs:${NC}"
echo "  - Backend: pm2 logs $BACKEND_PROCESS"
echo "  - Nginx: sudo tail -f /var/log/nginx/access.log"
echo "  - Nginx Errors: sudo tail -f /var/log/nginx/error.log"
echo ""
echo -e "${YELLOW}🔄 Rollback (if needed):${NC}"
echo "  sudo rm -rf $NGINX_DIR/*"
echo "  sudo cp -r $BACKUP_PATH/* $NGINX_DIR/"
echo "  sudo systemctl restart nginx"
echo ""
