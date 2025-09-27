import { createLogger } from '@/utils/log';
import { AIService } from '@/services/ai';

const logger = createLogger('BACKGROUND_SCRIPT');

// Background script for Chrome extension
// Handles communication between content scripts and popup

chrome.runtime.onInstalled.addListener(() => {
  logger.info('onInstalled', 'Extension installed successfully');
  
  // Create context menu items
  createContextMenus();
});

// Create context menu items
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // Main AI Agent menu
    chrome.contextMenus.create({
      id: 'ai-agent-main',
      title: 'AI Agent Utils',
      contexts: ['all']
    });

    // Sub-menu for text input fields
    chrome.contextMenus.create({
      id: 'ai-fill-input',
      title: 'Fill with AI',
      parentId: 'ai-agent-main',
      contexts: ['editable']
    });

    // Sub-menu for selected text
    chrome.contextMenus.create({
      id: 'ai-fix-text',
      title: 'Fix Selected Text',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    // Summarize options
    chrome.contextMenus.create({
      id: 'ai-summarize-short',
      title: 'Summarize (Short)',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ai-summarize-medium',
      title: 'Summarize (Medium)',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ai-summarize-detailed',
      title: 'Summarize (Detailed)',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    // Rephrase options
    chrome.contextMenus.create({
      id: 'ai-rephrase-casual',
      title: 'Rephrase (Casual)',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ai-rephrase-formal',
      title: 'Rephrase (Formal)',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ai-rephrase-professional',
      title: 'Rephrase (Professional)',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    // Expand/Shorten options
    chrome.contextMenus.create({
      id: 'ai-expand-text',
      title: 'Expand Text',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'ai-shorten-text',
      title: 'Shorten Text',
      parentId: 'ai-agent-main',
      contexts: ['selection']
    });

    // Sub-menu for any page content
    chrome.contextMenus.create({
      id: 'ai-overlay',
      title: 'Open AI Assistant',
      parentId: 'ai-agent-main',
      contexts: ['page']
    });

    // Sub-menu for asking questions about page
    chrome.contextMenus.create({
      id: 'ai-question',
      title: 'Ask About Page',
      parentId: 'ai-agent-main',
      contexts: ['page']
    });

    logger.info('createContextMenus', 'Context menus created successfully');
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  logger.info('contextMenuClicked', 'Context menu clicked', { 
    menuItemId: info.menuItemId,
    tabId: tab?.id 
  });
  
  // Add console.log for debugging
  console.log('[BACKGROUND] Context menu clicked:', info.menuItemId, 'on tab:', tab?.id);

  if (!tab?.id) {
    console.log('[BACKGROUND] No tab ID available');
    return;
  }

  switch (info.menuItemId) {
    case 'ai-fill-input':
      console.log('[BACKGROUND] Handling fill input context');
      handleFillInputContext(tab.id);
      break;
    case 'ai-fix-text':
      console.log('[BACKGROUND] Handling fix text context');
      handleFixTextContext(tab.id, info);
      break;
    case 'ai-summarize-short':
      console.log('[BACKGROUND] Handling summarize short');
      handleTextProcessing(tab.id, info, 'summarize-short');
      break;
    case 'ai-summarize-medium':
      console.log('[BACKGROUND] Handling summarize medium');
      handleTextProcessing(tab.id, info, 'summarize-medium');
      break;
    case 'ai-summarize-detailed':
      console.log('[BACKGROUND] Handling summarize detailed');
      handleTextProcessing(tab.id, info, 'summarize-detailed');
      break;
    case 'ai-rephrase-casual':
      console.log('[BACKGROUND] Handling rephrase casual');
      handleTextProcessing(tab.id, info, 'rephrase-casual');
      break;
    case 'ai-rephrase-formal':
      console.log('[BACKGROUND] Handling rephrase formal');
      handleTextProcessing(tab.id, info, 'rephrase-formal');
      break;
    case 'ai-rephrase-professional':
      console.log('[BACKGROUND] Handling rephrase professional');
      handleTextProcessing(tab.id, info, 'rephrase-professional');
      break;
    case 'ai-expand-text':
      console.log('[BACKGROUND] Handling expand text');
      handleTextProcessing(tab.id, info, 'expand-text');
      break;
    case 'ai-shorten-text':
      console.log('[BACKGROUND] Handling shorten text');
      handleTextProcessing(tab.id, info, 'shorten-text');
      break;
    case 'ai-overlay':
      console.log('[BACKGROUND] Handling open overlay');
      handleOpenOverlay(tab.id);
      break;
    case 'ai-question':
      console.log('[BACKGROUND] Handling question context');
      handleQuestionContext(tab.id);
      break;
    default:
      console.log('[BACKGROUND] Unknown menu item:', info.menuItemId);
  }
});

// Helper function to ensure content script is ready
async function ensureContentScriptReady(tabId: number): Promise<boolean> {
  try {
    // Get tab info first
    const tab = await chrome.tabs.get(tabId);
    console.log('[BACKGROUND] Tab info:', { 
      url: tab.url, 
      status: tab.status,
      id: tab.id 
    });
    
    // Check if we can communicate with this URL
    if (tab.url?.startsWith('chrome://') || 
        tab.url?.startsWith('chrome-extension://') || 
        tab.url?.startsWith('edge://') || 
        tab.url?.startsWith('about:') ||
        tab.url?.startsWith('moz-extension://') ||
        !tab.url) {
      throw new Error('Cannot communicate with browser internal pages or invalid URLs');
    }

    // Wait for tab to be ready if it's still loading
    if (tab.status === 'loading') {
      console.log('[BACKGROUND] Tab is loading, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Try to ping the content script with retries since it's auto-injected
    console.log('[BACKGROUND] Checking if content script is ready on tab:', tabId);
    
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        const pingPromise = chrome.tabs.sendMessage(tabId, { type: 'PING' });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Ping timeout')), 2000)
        );
        
        const pingResponse = await Promise.race([pingPromise, timeoutPromise]);
        console.log('[BACKGROUND] Content script ping successful:', pingResponse);
        return true;
      } catch (pingError) {
        attempts++;
        console.log(`[BACKGROUND] Ping attempt ${attempts} failed:`, pingError);
        
        if (attempts < maxAttempts) {
          // Wait progressively longer between attempts
          const waitTime = attempts * 500;
          console.log(`[BACKGROUND] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw new Error('Content script not responding after multiple attempts');
    
  } catch (error) {
    console.error('[BACKGROUND] Failed to establish content script communication:', error);
    throw error;
  }
}

async function handleFillInputContext(tabId: number) {
  try {
    console.log('[BACKGROUND] Handling fill input context for tab:', tabId);
    
    // First, ensure content script is ready
    await ensureContentScriptReady(tabId);
    
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_AI_INPUT_OVERLAY',
      data: { 
        context: 'fill_input'
      }
    });
    console.log('[BACKGROUND] Response from content script:', response);
  } catch (error) {
    console.error('[BACKGROUND] Failed to show input overlay:', error);
    logger.error('handleFillInputContext', 'Failed to show input overlay', error);
    
    // Fallback: Show popup as alternative
    try {
      await chrome.action.openPopup();
      console.log('[BACKGROUND] Opened popup as fallback');
    } catch (popupError) {
      console.error('[BACKGROUND] Failed to open popup fallback:', popupError);
    }
  }
}

async function handleFixTextContext(tabId: number, info: chrome.contextMenus.OnClickData) {
  try {
    console.log('[BACKGROUND] Sending SHOW_AI_TEXT_OVERLAY message to tab:', tabId);
    
    // First, ensure content script is ready
    await ensureContentScriptReady(tabId);
    
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_AI_TEXT_OVERLAY',
      data: { 
        selectedText: info.selectionText,
        context: 'fix_text'
      }
    });
    console.log('[BACKGROUND] Response from content script:', response);
  } catch (error) {
    console.error('[BACKGROUND] Failed to show text overlay:', error);
    logger.error('handleFixTextContext', 'Failed to show text overlay', error);
    
    // Fallback: Show notification to user
    await showErrorNotification(tabId, 'Unable to fix selected text. Please try refreshing the page.');
  }
}

async function handleTextProcessing(
  tabId: number, 
  info: chrome.contextMenus.OnClickData, 
  processingType: string
) {
  try {
    console.log(`[BACKGROUND] Sending SHOW_AI_TEXT_OVERLAY message to tab: ${tabId} for ${processingType}`);
    
    // First, ensure content script is ready
    await ensureContentScriptReady(tabId);
    
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_AI_TEXT_OVERLAY',
      data: { 
        selectedText: info.selectionText,
        context: processingType
      }
    });
    console.log('[BACKGROUND] Response from content script:', response);
  } catch (error) {
    console.error(`[BACKGROUND] Failed to show text overlay for ${processingType}:`, error);
    logger.error('handleTextProcessing', `Failed to show text overlay for ${processingType}`, error);
    
    // Fallback: Show notification to user
    await showErrorNotification(tabId, `Unable to ${processingType.replace('-', ' ')} text. Please try refreshing the page.`);
  }
}

// Helper function to show error notifications to users
async function showErrorNotification(tabId: number, message: string) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (msg: string) => {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: #f44336 !important;
          color: white !important;
          padding: 12px 16px !important;
          border-radius: 6px !important;
          z-index: 100001 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 14px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          max-width: 300px !important;
          pointer-events: all !important;
        `;
        notification.textContent = msg;
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
          if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 5000);
      },
      args: [message]
    });
  } catch (notificationError) {
    console.error('[BACKGROUND] Failed to show error notification:', notificationError);
  }
}

async function handleOpenOverlay(tabId: number) {
  try {
    console.log('[BACKGROUND] Sending SHOW_AI_OVERLAY message to tab:', tabId);
    
    // First, ensure content script is ready
    await ensureContentScriptReady(tabId);
    
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_AI_OVERLAY',
      data: { 
        context: 'general'
      }
    });
    console.log('[BACKGROUND] Response from content script:', response);
  } catch (error) {
    console.error('[BACKGROUND] Failed to show overlay:', error);
    logger.error('handleOpenOverlay', 'Failed to show overlay', error);
    
    // Fallback: Show notification to user
    await showErrorNotification(tabId, 'Unable to open AI assistant. Please try refreshing the page.');
  }
}

async function handleQuestionContext(tabId: number) {
  try {
    console.log('[BACKGROUND] Sending SHOW_AI_QUESTION_OVERLAY message to tab:', tabId);
    
    // First, ensure content script is ready
    await ensureContentScriptReady(tabId);
    
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_AI_QUESTION_OVERLAY',
      data: { 
        context: 'question_page'
      }
    });
    console.log('[BACKGROUND] Response from content script:', response);
  } catch (error) {
    console.error('[BACKGROUND] Failed to show question overlay:', error);
    logger.error('handleQuestionContext', 'Failed to show question overlay', error);
    
    // Fallback: Show notification to user
    await showErrorNotification(tabId, 'Unable to open page question tool. Please try refreshing the page.');
  }
}

interface AIGenerationRequest {
  prompt: string;
  context: 'fill_input' | 'fix_text' | 'general' | 'question_page' | 'summarize-short' | 'summarize-medium' | 'summarize-detailed' | 'rephrase-casual' | 'rephrase-formal' | 'rephrase-professional' | 'expand-text' | 'shorten-text';
  initialText?: string;
  streaming?: boolean;
}

async function handleAIGeneration(
  data: AIGenerationRequest, 
  sendResponse: (response: { success: boolean; data?: string; error?: string }) => void
) {
  try {
    const aiService = AIService.getInstance();
    
    // Create context-appropriate system message
    const systemMessage = getSystemMessage(data.context, data.initialText);
    
    const response = await aiService.chat([
      { role: 'system', content: systemMessage },
      { role: 'user', content: data.prompt }
    ]);

    if (response.success) {
      sendResponse({ 
        success: true, 
        data: response.content 
      });
    } else {
      sendResponse({ 
        success: false, 
        error: response.error || 'AI generation failed' 
      });
    }
  } catch (error) {
    logger.error('handleAIGeneration', 'AI generation failed', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

function getSystemMessage(context: string, initialText?: string): string {
  switch (context) {
    case 'fill_input':
      return 'You are an AI assistant that helps fill out form fields. Generate helpful, relevant content based on the user\'s request. Keep responses concise and appropriate for form inputs.';
    
    case 'fix_text':
      return `You are an AI assistant that helps improve and fix text. ${initialText ? `Here is the original text: "${initialText}". ` : ''}Please provide an improved version that fixes grammar, spelling, clarity, and style while maintaining the original meaning.`;
    
    case 'summarize-short':
      return `You are an AI assistant that creates concise summaries. ${initialText ? `Here is the text to summarize: "${initialText}". ` : ''}Create a brief, 1-2 sentence summary that captures the main points.`;
    
    case 'summarize-medium':
      return `You are an AI assistant that creates medium-length summaries. ${initialText ? `Here is the text to summarize: "${initialText}". ` : ''}Create a balanced summary of 3-5 sentences that covers the key points and important details.`;
    
    case 'summarize-detailed':
      return `You are an AI assistant that creates comprehensive summaries. ${initialText ? `Here is the text to summarize: "${initialText}". ` : ''}Create a detailed summary that covers all main points, key details, and important nuances while being well-organized.`;
    
    case 'rephrase-casual':
      return `You are an AI assistant that rephrases text in a casual style. ${initialText ? `Here is the original text: "${initialText}". ` : ''}Rewrite this text using a friendly, relaxed, and conversational tone while preserving the meaning.`;
    
    case 'rephrase-formal':
      return `You are an AI assistant that rephrases text in a formal style. ${initialText ? `Here is the original text: "${initialText}". ` : ''}Rewrite this text using proper, structured, and academic language while maintaining the original meaning.`;
    
    case 'rephrase-professional':
      return `You are an AI assistant that rephrases text in a professional style. ${initialText ? `Here is the original text: "${initialText}". ` : ''}Rewrite this text using business-appropriate, polished, and competent language while keeping the core message intact.`;
    
    case 'expand-text':
      return `You are an AI assistant that expands and elaborates on text. ${initialText ? `Here is the original text: "${initialText}". ` : ''}Provide a more detailed and comprehensive version with additional context, examples, or explanations while maintaining the original meaning.`;
    
    case 'shorten-text':
      return `You are an AI assistant that condenses text. ${initialText ? `Here is the original text: "${initialText}". ` : ''}Create a shorter, more concise version that retains all essential information and meaning while removing unnecessary words.`;
    
    case 'question_page':
      return 'You are an AI assistant that helps answer questions about web pages. Use the context provided to give helpful, accurate answers about the page content, functionality, or related topics.';
    
    default:
      return 'You are a helpful AI assistant. Provide clear, concise, and useful responses to user requests.';
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.info('onMessage', 'Received message', { 
    type: request.type, 
    tabId: sender.tab?.id 
  });

  switch (request.type) {
    case 'GET_PAGE_CONTENT':
      handleGetPageContentFromPopup(sendResponse);
      return true; // Keep message channel open for async response

    case 'FILL_INPUTS':
      handleFillInputs(sender.tab?.id, request.data, sendResponse);
      return true;

    case 'AI_GENERATE_TEXT':
      handleAIGeneration(request.data, sendResponse);
      return true;

    case 'PING':
      sendResponse({ success: true, message: 'Background script is active' });
      break;

    default:
      logger.warn('onMessage', 'Unknown message type', request.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

async function handleGetPageContentFromPopup(sendResponse: (response: { success: boolean; data?: unknown; error?: string }) => void) {
  try {
    // When called from popup, we need to get the active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab?.id) {
      throw new Error('No active tab found');
    }

    logger.info('handleGetPageContentFromPopup', 'Getting content from active tab', { 
      tabId: activeTab.id, 
      url: activeTab.url 
    });

    // Inject content script to extract page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: extractPageContent,
    });

    const pageContent = results[0]?.result;
    logger.info('handleGetPageContentFromPopup', 'Page content extracted', { 
      title: pageContent?.title,
      contentLength: pageContent?.content?.length,
      url: pageContent?.url
    });

    sendResponse({ 
      success: true, 
      data: pageContent 
    });
  } catch (error) {
    logger.error('handleGetPageContentFromPopup', 'Failed to get page content', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}



async function handleFillInputs(tabId: number | undefined, inputData: { selector: string; value: string }[], sendResponse: (response: { success: boolean; data?: unknown; error?: string }) => void) {
  try {
    if (!tabId) {
      throw new Error('No tab ID provided');
    }

    // Inject content script to fill inputs
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: fillPageInputs,
      args: [inputData],
    });

    const result = results[0]?.result;
    logger.info('handleFillInputs', 'Inputs filled', result);

    sendResponse({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    logger.error('handleFillInputs', 'Failed to fill inputs', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Functions to be injected into content scripts
function extractPageContent() {
  return {
    title: document.title,
    url: window.location.href,
    content: document.body.innerText || '',
    timestamp: new Date().toISOString(),
  };
}

function fillPageInputs(inputData: Array<{ selector: string; value: string }>) {
  const results: Array<{ selector: string; success: boolean; error?: string }> = [];

  inputData.forEach(({ selector, value }) => {
    try {
      const elements = document.querySelectorAll(selector);
      let filled = 0;

      elements.forEach((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          filled++;
        }
      });

      results.push({
        selector,
        success: filled > 0,
        error: filled === 0 ? 'No matching elements found' : undefined,
      });
    } catch (error) {
      results.push({
        selector,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return results;
}
