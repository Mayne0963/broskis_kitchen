#!/bin/bash

# NavBar Revert Script
# Automatically generated backup restoration script

set -e  # Exit on any error

NAVBAR_PATH="src/components/common/NavBar.tsx"
BACKUP_PATH="src/components/common/NavBar.backup.tsx"

echo "🔄 Starting NavBar revert process..."

# Check if backup file exists
if [ -f "$BACKUP_PATH" ]; then
    echo "📁 Found backup file: $BACKUP_PATH"
    echo "🔄 Restoring NavBar from backup file..."
    cp "$BACKUP_PATH" "$NAVBAR_PATH"
    echo "✅ NavBar restored from backup file"
else
    # Look for the latest navbar_backup_* tag
    LATEST_TAG=$(git tag -l "navbar_backup_*" | sort -V | tail -n 1)
    
    if [ -n "$LATEST_TAG" ]; then
        echo "🏷️  Found backup tag: $LATEST_TAG"
        echo "🔄 Restoring NavBar from git tag..."
        git checkout "$LATEST_TAG" -- "$NAVBAR_PATH"
        echo "✅ NavBar restored from git tag: $LATEST_TAG"
    else
        echo "❌ Error: No backup file or git tag found!"
        echo "   Expected backup file: $BACKUP_PATH"
        echo "   Expected git tag pattern: navbar_backup_*"
        exit 1
    fi
fi

echo "🔨 Running build to verify restoration..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: NavBar has been successfully reverted!"
    echo "📝 Instructions:"
    echo "   - NavBar has been restored to: $NAVBAR_PATH"
    echo "   - Build completed successfully"
    echo "   - You can now safely make new NavBar edits"
    echo "   - Consider creating a new backup before major changes"
else
    echo "❌ ERROR: Build failed after NavBar restoration!"
    echo "   Please check the build output above for errors"
    exit 1
fi