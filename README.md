# AI Agent Utils Chrome Extension

A Chrome extension that provides AI-powered tools for web page interaction, including text fixing, question answering, input filling, and web content reading.

## Features

### ✅ Fully Implemented
- **Text Fixer Tool**: Auto-fix text using AI with custom prompts
- **Question Answerer**: Answer questions based on current page content with intelligent webpage context extraction
- **Web Reader**: Extract and read web page content for AI processing
- **Configuration Management**: OpenAI-compatible API settings with model and temperature controls
- **Chrome Extension Infrastructure**: Complete popup, options page, background script, and content script setup
- **Redux State Management**: Centralized state management for configuration
- **Modern React UI**: Built with React 18, TypeScript, and Vite

### 🚧 Placeholder Tools (Ready for Implementation)
- **Input Filler**: Automatically fill form inputs based on user prompts

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit
- **Styling**: Pure CSS (no framework dependencies)
- **AI Integration**: OpenAI-compatible API support
- **Extension Structure**: Manifest v3 with proper content/background scripts

## Setup & Installation

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the extension**:
   ```bash
   npm run build
   ```

3. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Production Build & Publishing

1. **Create publishable package**:
   ```bash
   npm run package
   ```
   This creates a `ai-agent-utils-v[VERSION].zip` file ready for Chrome Web Store submission.

2. **Alternative methods**:
   ```bash
   # Using shell script
   ./scripts/package-extension.sh
   
   # Step by step
   npm run validate     # Lint and validate
   npm run build:prod   # Build for production  
   npm run zip         # Create ZIP package
   ```

3. **Chrome Web Store submission**:
   See `CHROME_STORE_GUIDE.md` for detailed publishing instructions.

### Configuration

1. Click the extension icon in Chrome toolbar
2. Go to "Settings" 
3. Configure:
   - **API Key**: Your OpenAI-compatible API key
   - **API Server**: Base URL (default: `https://api.openai.com/v1`)
   - **Model**: AI model name (e.g., `gpt-3.5-turbo`, `gpt-4`)
   - **Temperature**: Response creativity (0-2)
   - **Max Tokens**: Maximum response length

## Usage

### Text Fixer
1. Click extension icon
2. Select "Text Fixer" tab
3. Paste text to fix
4. Optionally add custom instructions
5. Click "Fix Text"

### Keyboard Shortcuts
- `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac): Quick text fix for selected text

## Project Structure

```
src/
├── constants/          # App constants and configuration values
├── config/            # Configuration management utilities
├── services/          # AI service and API integration
├── tools/             # AI agent tools (textFixer, webReader, etc.)
├── store/             # Redux store and slices
├── utils/             # Utility functions (logging, etc.)
├── popup/             # Extension popup React app
├── options/           # Settings page React app
├── content/           # Content script for page interaction
└── background/        # Background service worker
```

## Development Guidelines

- **Functional Programming**: Prefer pure functions and immutability
- **File Size**: Max 200 lines per file
- **Logging**: Consistent format: `[COMPONENT] [FUNCTION] message`
- **Error Handling**: Proper try/catch with meaningful error messages
- **Modularity**: Small, composable components and functions

## API Compatibility

Supports OpenAI-compatible APIs including:
- OpenAI GPT models
- Azure OpenAI
- Anthropic Claude (via compatible proxies)
- Local models via API-compatible servers

## Contributing

1. Follow the established patterns in existing code
2. Add proper logging to all functions
3. Handle errors gracefully
4. Update this README for any new features
5. Test thoroughly in Chrome extension environment

## License

[Add your license here]
