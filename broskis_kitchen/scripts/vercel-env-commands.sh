#!/bin/bash

# Vercel Environment Variables Setup Commands
# This script contains the exact Vercel CLI commands needed to set up
# all required environment variables for Broski's Kitchen deployment.
#
# Usage:
# 1. Make sure you have Vercel CLI installed: npm install -g vercel
# 2. Make sure you're logged in: vercel login
# 3. Make sure you're in the project directory: cd /path/to/broskis-kitchen
# 4. Run individual commands below or execute this script: bash scripts/vercel-env-commands.sh

echo "🚀 Setting up Vercel Environment Variables for Broski's Kitchen"
echo "================================================================"

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login first:"
    echo "   vercel login"
    exit 1
fi

echo "✅ Vercel CLI is ready"
echo ""

# Function to set environment variable for all environments
set_env_all() {
    local var_name=$1
    local description=$2
    local example=$3
    
    echo "Setting $var_name..."
    echo "Description: $description"
    echo "Example: $example"
    echo "Please enter the value for $var_name:"
    
    # Set for production
    echo "Setting for PRODUCTION environment:"
    vercel env add "$var_name" production
    
    # Set for preview
    echo "Setting for PREVIEW environment:"
    vercel env add "$var_name" preview
    
    # Set for development
    echo "Setting for DEVELOPMENT environment:"
    vercel env add "$var_name" development
    
    echo "✅ $var_name set for all environments"
    echo ""
}

# Function to set NEXTAUTH_URL with specific values for each environment
set_nextauth_url() {
    echo "Setting NEXTAUTH_URL for different environments..."
    
    # Production
    echo "Setting NEXTAUTH_URL for PRODUCTION (https://broskiskitchen.com):"
    echo "https://broskiskitchen.com" | vercel env add NEXTAUTH_URL production
    
    # Preview - user needs to provide their preview URL
    echo "Setting NEXTAUTH_URL for PREVIEW environment:"
    echo "Please enter your Vercel preview URL (e.g., https://your-app-git-main-username.vercel.app):"
    vercel env add NEXTAUTH_URL preview
    
    # Development
    echo "Setting NEXTAUTH_URL for DEVELOPMENT (http://localhost:3000):"
    echo "http://localhost:3000" | vercel env add NEXTAUTH_URL development
    
    echo "✅ NEXTAUTH_URL set for all environments"
    echo ""
}

# Interactive mode - ask user if they want to set variables
read -p "Do you want to set environment variables interactively? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting interactive setup..."
    echo ""
    
    # Set each required environment variable
    set_env_all "STRIPE_PUBLISHABLE_KEY" "Stripe publishable key for payment processing" "pk_test_..."
    set_env_all "GOOGLE_MAPS_API_KEY" "Google Maps API key for location services" "AIzaSy..."
    set_env_all "ADMIN_EMAILS" "Comma-separated list of admin email addresses" "admin@broskiskitchen.com,manager@broskiskitchen.com"
    
    # Set NEXTAUTH_URL with specific values
    set_nextauth_url
    
    echo "🎉 All environment variables have been set!"
    echo ""
else
    echo "Skipping interactive setup. Here are the manual commands:"
    echo ""
fi

# Display manual commands for reference
echo "📋 Manual Vercel CLI Commands (copy and paste as needed):"
echo "=========================================================="
echo ""

echo "# STRIPE_PUBLISHABLE_KEY"
echo "vercel env add STRIPE_PUBLISHABLE_KEY production"
echo "vercel env add STRIPE_PUBLISHABLE_KEY preview"
echo "vercel env add STRIPE_PUBLISHABLE_KEY development"
echo ""

echo "# GOOGLE_MAPS_API_KEY"
echo "vercel env add GOOGLE_MAPS_API_KEY production"
echo "vercel env add GOOGLE_MAPS_API_KEY preview"
echo "vercel env add GOOGLE_MAPS_API_KEY development"
echo ""

echo "# ADMIN_EMAILS"
echo "vercel env add ADMIN_EMAILS production"
echo "vercel env add ADMIN_EMAILS preview"
echo "vercel env add ADMIN_EMAILS development"
echo ""

echo "# NEXTAUTH_URL (with specific values)"
echo "echo 'https://broskiskitchen.com' | vercel env add NEXTAUTH_URL production"
echo "vercel env add NEXTAUTH_URL preview  # Enter your preview URL"
echo "echo 'http://localhost:3000' | vercel env add NEXTAUTH_URL development"
echo ""

echo "🚀 After setting variables, trigger a new deployment:"
echo "vercel --prod"
echo ""

echo "✅ Validate your environment variables:"
echo "npm run validate:env"
echo ""

echo "📖 For more help, see: vercel_deployment_fix_guide.md"