#!/bin/bash

# Chrome Extension Packaging Script
# This script creates a production-ready ZIP file for Chrome Web Store submission

set -e  # Exit on any error

echo "🚀 Starting Chrome Extension packaging process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -f *.zip

# Validate before building
echo "🔍 Running linting and validation..."
npm run lint

# Build for production
echo "🏗️  Building extension for production..."
npm run build:prod

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Validate required files exist
echo "✅ Validating required files..."
required_files=(
    "dist/manifest.json"
    "dist/popup.html"
    "dist/options.html"
    "dist/background.js"
    "dist/content.js"
    "dist/icon-128x128.png"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

# Get version from manifest
VERSION=$(node -p "require('./dist/manifest.json').version")
EXTENSION_NAME="ai-agent-utils-v${VERSION}"

# Create ZIP file
echo "📦 Creating ZIP package: ${EXTENSION_NAME}.zip"
cd dist
zip -r "../${EXTENSION_NAME}.zip" . -x "*.DS_Store" "*.map" "node_modules/*"
cd ..

echo "✅ Package created successfully: ${EXTENSION_NAME}.zip"
echo "📊 Package size: $(du -h "${EXTENSION_NAME}.zip" | cut -f1)"

# Display contents
echo "📋 Package contents:"
unzip -l "${EXTENSION_NAME}.zip"

echo ""
echo "🎉 Extension packaging complete!"
echo "💡 Next steps:"
echo "   1. Test the extension by loading the ZIP in Chrome"
echo "   2. Submit ${EXTENSION_NAME}.zip to Chrome Web Store"
echo "   3. Follow Chrome Web Store publishing guidelines"
