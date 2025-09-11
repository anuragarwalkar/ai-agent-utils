# Chrome Web Store Publishing Guide

## Quick Start - Create Publishable Package

### Option 1: Using NPM Scripts (Recommended)
```bash
# Create production build and ZIP package
npm run package

# Or run steps individually:
npm run validate    # Lint and validate
npm run build:prod  # Build for production
npm run zip         # Create ZIP file
```

### Option 2: Using Shell Script
```bash
# Run the comprehensive packaging script
./scripts/package-extension.sh
```

## Detailed Steps for Chrome Web Store Publication

### 1. Pre-Publication Checklist

#### ✅ Extension Requirements
- [ ] **Version**: Update version in `public/manifest.json` (follows semver: 1.0.0, 1.0.1, etc.)
- [ ] **Icons**: Ensure all icon sizes are present (16x16, 32x32, 48x48, 128x128)
- [ ] **Manifest**: Valid manifest.json with proper permissions
- [ ] **Description**: Clear, concise description in manifest.json
- [ ] **Screenshots**: Prepare 1280x800 or 640x400 screenshots for store listing

#### ✅ Code Quality
- [ ] **Linting**: No ESLint errors (`npm run lint`)
- [ ] **Build**: Successful production build (`npm run build:prod`)
- [ ] **Testing**: Test all features in Chrome
- [ ] **Permissions**: Only request necessary permissions
- [ ] **Privacy**: No unnecessary data collection

#### ✅ Store Assets (Prepare separately)
- [ ] **Store Icon**: 128x128 PNG
- [ ] **Screenshots**: At least 1, max 5 (1280x800 or 640x400)
- [ ] **Description**: Detailed description (max 132 characters for short description)
- [ ] **Category**: Choose appropriate category
- [ ] **Privacy Policy**: Required if collecting user data

### 2. Build Production Package

```bash
# Method 1: One command
npm run package

# Method 2: Step by step
npm run validate      # Check code quality
npm run build:prod    # Build minified version
npm run zip          # Create ZIP package
```

This creates: `ai-agent-utils-v[VERSION].zip`

### 3. Chrome Web Store Submission

#### A. Developer Account Setup
1. Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/developer/dashboard)
2. Pay $5 one-time registration fee
3. Verify your identity

#### B. Create New Extension
1. Click "Add new item"
2. Upload your ZIP file (`ai-agent-utils-v[VERSION].zip`)
3. Fill in store listing details:

**Required Information:**
- **Name**: AI Agent Utils
- **Summary**: AI-powered tools for web page interaction and automation
- **Description**: 
  ```
  AI Agent Utils provides powerful AI-driven tools for enhancing your web browsing experience:

  🔧 Text Fixer: Automatically improve and fix text using AI
  ❓ Question Answerer: Get AI answers based on current page content  
  📝 Input Filler: Smart form filling with AI assistance
  📖 Web Reader: Extract and analyze web page content

  Features:
  - OpenAI-compatible API support
  - Configurable AI models and parameters
  - Privacy-focused: all data processing via your API key
  - Modern React-based interface
  - Keyboard shortcuts for quick access

  Perfect for content creators, researchers, and anyone who wants to enhance their web workflow with AI assistance.
  ```

**Category**: Productivity
**Language**: English
**Screenshots**: Upload 1-5 screenshots showing the extension in action

#### C. Privacy and Permissions
- **Permissions Justification**: Explain why each permission is needed
  - `activeTab`: To interact with current page content
  - `storage`: To save user configuration and API settings
  - `scripting`: To inject content scripts for page interaction
  - `tabs`: To read page content for AI processing
  - `<all_urls>`: To work on any website

- **Privacy Policy**: If collecting any data, provide privacy policy URL

#### D. Submit for Review
1. Click "Submit for review"
2. Wait for Google's review (typically 1-7 days)
3. Address any review feedback if needed

### 4. Testing Before Submission

#### Local Testing
```bash
# Build and test locally
npm run build:prod

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the 'dist' folder
```

#### ZIP Testing
```bash
# Create package
npm run package

# Test the actual ZIP:
# 1. Go to chrome://extensions/
# 2. Drag and drop the ZIP file
# 3. Test all functionality
```

### 5. Version Updates

For future updates:

1. **Update Version**:
   ```bash
   # Update version in public/manifest.json
   # Example: "1.0.0" → "1.0.1"
   ```

2. **Build and Package**:
   ```bash
   npm run package
   ```

3. **Upload to Store**:
   - Go to Developer Console
   - Select your extension
   - Upload new package
   - Submit for review

### 6. Common Issues and Solutions

#### Build Issues
- **Missing files**: Check `vite.config.ts` input paths
- **Large bundle**: Use `npm run build:prod` for minification
- **Permission errors**: Verify manifest.json permissions

#### Store Rejection Reasons
- **Excessive permissions**: Only request what you need
- **Poor description**: Be clear about functionality
- **Missing privacy policy**: Required if collecting data
- **Copyright issues**: Ensure all assets are original/licensed

#### Testing Issues
- **Extension not loading**: Check manifest.json syntax
- **Features not working**: Test in incognito mode
- **API errors**: Verify OpenAI API integration

### 7. Post-Publication

#### Monitor Performance
- Check Chrome Web Store reviews
- Monitor error reports
- Track user feedback

#### Maintenance
- Regular updates for security
- New feature releases
- Bug fixes and improvements

## Files Created by This Guide

- `scripts/package-extension.sh` - Automated packaging script
- Updated `package.json` - Added packaging npm scripts
- Updated `vite.config.ts` - Production build configuration
- This guide - `CHROME_STORE_GUIDE.md`

## Support

For issues with this extension:
1. Check the Chrome Developer Console for errors
2. Verify API key configuration in extension settings
3. Test with different websites and content types
4. Submit issues to the project repository

Good luck with your Chrome Web Store submission! 🚀
