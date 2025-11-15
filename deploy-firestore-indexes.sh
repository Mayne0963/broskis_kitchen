#!/bin/bash

# Firestore Index Deployment Script for Broski's Kitchen
# This script deploys the required composite indexes for the order history functionality

echo "🔥 Deploying Firestore indexes for Broski's Kitchen..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list | grep -q "broskis-kitchen"; then
    echo "❌ Please login to Firebase and select the broskis-kitchen project:"
    echo "   firebase login"
    echo "   firebase use broskis-kitchen-4d42d"
    exit 1
fi

echo "✅ Firebase CLI found and project selected"
echo ""
echo "📋 Indexes to be deployed:"
echo "   1. Collection: orders, Fields: userId (ASC), createdAt (DESC)"
echo "   2. Collection: orders, Fields: userEmail (ASC), createdAt (DESC)"
echo ""

# Deploy the indexes
echo "🚀 Deploying indexes..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Indexes deployed successfully!"
    echo ""
    echo "⏳ Note: Index creation may take a few minutes to complete."
    echo "   You can check the status in the Firebase Console:"
    echo "   https://console.firebase.google.com/project/broskis-kitchen-4d42d/firestore/indexes"
    echo ""
    echo "🔄 Once the indexes are built, the order history page should work correctly."
else
    echo ""
    echo "❌ Index deployment failed. Please check the error messages above."
    echo "   You can also create the indexes manually in the Firebase Console:"
    echo "   https://console.firebase.google.com/project/broskis-kitchen-4d42d/firestore/indexes"
fi