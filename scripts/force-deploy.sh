#!/bin/bash

# Force Deploy Script for Vercel
# This script forces a new build by bypassing prebuilt artifacts

set -e

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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="preview"
SKIP_CONFIRMATION=false
CLEAR_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --prod|--production)
            ENVIRONMENT="production"
            shift
            ;;
        --preview)
            ENVIRONMENT="preview"
            shift
            ;;
        --yes|-y)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --clear-cache)
            CLEAR_CACHE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --prod, --production    Deploy to production"
            echo "  --preview              Deploy to preview (default)"
            echo "  --yes, -y              Skip confirmation prompt"
            echo "  --clear-cache          Clear local cache before deployment"
            echo "  --help, -h             Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_status "Force Deploy Script for Vercel"
print_status "=============================="
print_status "Environment: $ENVIRONMENT"
print_status "Clear Cache: $CLEAR_CACHE"
echo

# Confirmation prompt
if [ "$SKIP_CONFIRMATION" = false ]; then
    if [ "$ENVIRONMENT" = "production" ]; then
        print_warning "You are about to force deploy to PRODUCTION!"
        print_warning "This will bypass all prebuilt artifacts and create a fresh build."
    else
        print_status "You are about to force deploy to preview environment."
    fi
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

# Clear local cache if requested
if [ "$CLEAR_CACHE" = true ]; then
    print_status "Clearing local cache..."
    
    # Clear Next.js cache
    if [ -d ".next" ]; then
        rm -rf .next
        print_success "Cleared .next directory"
    fi
    
    # Clear Vercel cache
    if [ -d ".vercel" ]; then
        rm -rf .vercel
        print_success "Cleared .vercel directory"
    fi
    
    # Clear node_modules cache (optional)
    read -p "Clear node_modules and reinstall dependencies? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Clearing node_modules..."
        rm -rf node_modules
        print_status "Reinstalling dependencies..."
        npm install
        print_success "Dependencies reinstalled"
    fi
fi

# Run pre-deployment validation
print_status "Running pre-deployment validation..."
if [ -f "scripts/validate-env.js" ]; then
    node scripts/validate-env.js
    if [ $? -ne 0 ]; then
        print_error "Environment validation failed. Please fix the issues before deploying."
        exit 1
    fi
    print_success "Environment validation passed"
else
    print_warning "No environment validation script found (scripts/validate-env.js)"
fi

# Build the deployment command
DEPLOY_CMD="vercel deploy --force"

if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --prod"
fi

# Add build environment variables to force fresh build
export VERCEL_FORCE_BUILD="true"
export BUILD_TIMESTAMP=$(date +%s)

print_status "Executing force deployment..."
print_status "Command: $DEPLOY_CMD"
echo

# Execute the deployment
if eval "$DEPLOY_CMD"; then
    print_success "Force deployment completed successfully!"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        print_success "Your application is now live in production with a fresh build."
    else
        print_success "Your preview deployment is ready with a fresh build."
    fi
    
    print_status "Next steps:"
    echo "  1. Test your deployment thoroughly"
    echo "  2. Monitor for any issues"
    echo "  3. Check Vercel dashboard for deployment details"
    
else
    print_error "Force deployment failed!"
    print_error "Please check the error messages above and try again."
    exit 1
fi

# Cleanup
unset VERCEL_FORCE_BUILD
unset BUILD_TIMESTAMP

print_success "Force deployment script completed."