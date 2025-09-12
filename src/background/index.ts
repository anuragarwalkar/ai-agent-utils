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
      handleFillInputContext(tab.id, info);
      break;
    case 'ai-fix-text':
      console.log('[BACKGROUND] Handling fix text context');
      handleFixTextContext(tab.id, info);
      break;
    case 'ai-overlay':
      console.log('[BACKGROUND] Handling open overlay');
      handleOpenOverlay(tab.id, info);
      break;
    case 'ai-question':
      console.log('[BACKGROUND] Handling question context');
      handleQuestionContext(tab.id, info);
      break;
    default:
      console.log('[BACKGROUND] Unknown menu item:', info.menuItemId);
  }
});

// Helper function to ensure content script is injected
async function ensureContentScriptInjected(tabId: number) {
  try {
    // Try to ping the content script first
    console.log('[BACKGROUND] Pinging content script on tab:', tabId);
    const pingResponse = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    console.log('[BACKGROUND] Content script ping successful:', pingResponse);
    return true;
  } catch (pingError) {
    console.log('[BACKGROUND] Content script ping failed, attempting injection...', pingError);
    
    try {
      // Get tab info first
      const tab = await chrome.tabs.get(tabId);
      console.log('[BACKGROUND] Tab info:', { url: tab.url, status: tab.status });
      
      // Check if we can inject scripts on this URL
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
        throw new Error('Cannot inject content script on browser internal pages');
      }
      
      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Try to ping again to verify injection worked
      const verifyResponse = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      console.log('[BACKGROUND] Content script injection verified:', verifyResponse);
      
      return true;
    } catch (injectionError) {
      console.error('[BACKGROUND] Failed to inject content script:', injectionError);
      throw injectionError;
    }
  }
}

async function handleFillInputContext(tabId: number, _info: chrome.contextMenus.OnClickData) {
  try {
    console.log('[BACKGROUND] Handling fill input context for tab:', tabId);
    
    // First, ensure content script is injected
    await ensureContentScriptInjected(tabId);
    
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
    
    // First, ensure content script is injected
    await ensureContentScriptInjected(tabId);
    
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
  }
}

async function handleOpenOverlay(tabId: number, _info: chrome.contextMenus.OnClickData) {
  try {
    console.log('[BACKGROUND] Sending SHOW_AI_OVERLAY message to tab:', tabId);
    
    // First, ensure content script is injected
    await ensureContentScriptInjected(tabId);
    
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
  }
}

async function handleQuestionContext(tabId: number, _info: chrome.contextMenus.OnClickData) {
  try {
    console.log('[BACKGROUND] Sending SHOW_AI_QUESTION_OVERLAY message to tab:', tabId);
    
    // First, ensure content script is injected
    await ensureContentScriptInjected(tabId);
    
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
  }
}

interface AIGenerationRequest {
  prompt: string;
  context: 'fill_input' | 'fix_text' | 'general' | 'question_page';
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
      handleGetPageContent(sender.tab?.id, sendResponse);
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

async function handleGetPageContent(tabId: number | undefined, sendResponse: (response: { success: boolean; data?: unknown; error?: string }) => void) {
  try {
    if (!tabId) {
      throw new Error('No tab ID provided');
    }

    // Inject content script to extract page content
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageContent,
    });

    const pageContent = results[0]?.result;
    logger.info('handleGetPageContent', 'Page content extracted', { 
      length: pageContent?.content?.length 
    });

    sendResponse({ 
      success: true, 
      data: pageContent 
    });
  } catch (error) {
    logger.error('handleGetPageContent', 'Failed to get page content', error);
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
