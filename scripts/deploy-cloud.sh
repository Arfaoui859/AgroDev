#!/bin/bash

echo "🚀 AgroGrowth Cloud Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
    command -v curl >/dev/null 2>&1 || { print_error "curl is required but not installed. Aborting."; exit 1; }
    
    print_success "All dependencies are installed"
}

# Deploy to Vercel (Frontend)
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    if command -v vercel >/dev/null 2>&1; then
        cd client
        npm run build
        vercel --prod
        cd ..
        print_success "Frontend deployed to Vercel"
    else
        print_warning "Vercel CLI not found. Please install: npm i -g vercel"
        print_status "Manual deployment steps:"
        echo "1. Install Vercel CLI: npm i -g vercel"
        echo "2. Run: vercel login"
        echo "3. Run: vercel --prod"
    fi
}

# Deploy AI Services to Railway
deploy_ai_services() {
    print_status "Deploying AI services to Railway..."
    
    if command -v railway >/dev/null 2>&1; then
        railway login
        railway up
        print_success "AI services deployed to Railway"
    else
        print_warning "Railway CLI not found. Please install: npm i -g @railway/cli"
        print_status "Manual deployment steps:"
        echo "1. Install Railway CLI: npm i -g @railway/cli"
        echo "2. Run: railway login"
        echo "3. Run: railway up"
    fi
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env.cloud ]; then
        print_error ".env.cloud file not found!"
        exit 1
    fi
    
    print_status "Please configure your environment variables in .env.cloud"
    print_status "Then copy the values to your cloud platform's environment settings"
    
    print_success "Environment setup guide created"
}

# Main deployment function
main() {
    echo "🌱 Welcome to AgroGrowth Cloud Deployment!"
    echo ""
    
    check_dependencies
    setup_environment
    
    echo ""
    print_status "Choose deployment option:"
    echo "1. Deploy Frontend only (Vercel)"
    echo "2. Deploy AI Services only (Railway)"
    echo "3. Deploy Everything"
    echo "4. Show manual deployment guide"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_frontend
            ;;
        2)
            deploy_ai_services
            ;;
        3)
            deploy_frontend
            deploy_ai_services
            ;;
        4)
            show_manual_guide
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    print_success "Deployment process completed!"
    print_status "Don't forget to update your environment variables on each platform"
}

# Show manual deployment guide
show_manual_guide() {
    echo ""
    print_status "Manual Deployment Guide:"
    echo ""
    echo "🔧 SETUP STEPS:"
    echo "1. Create accounts on Vercel, Railway, and Supabase"
    echo "2. Install CLIs: npm i -g vercel @railway/cli"
    echo "3. Configure .env.cloud with your actual values"
    echo ""
    echo "🚀 FRONTEND DEPLOYMENT (Vercel):"
    echo "   vercel login"
    echo "   cd client && npm run build"
    echo "   vercel --prod"
    echo ""
    echo "🤖 AI SERVICES DEPLOYMENT (Railway):"
    echo "   railway login"
    echo "   railway up"
    echo ""
    echo "🗄️ DATABASE SETUP (Supabase):"
    echo "   1. Create new project on supabase.com"
    echo "   2. Copy connection string to .env.cloud"
    echo "   3. Update frontend environment variables"
    echo ""
    echo "📱 PWA FEATURES:"
    echo "   - Service worker will cache AI responses"
    echo "   - Offline mode will show cached data"
    echo "   - Push notifications will work after deployment"
}

# Run main function
main "$@"
