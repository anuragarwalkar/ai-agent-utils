import { createLogger } from '@/utils/log';

const logger = createLogger('BACKGROUND_SCRIPT');

// Background script for Chrome extension
// Handles communication between content scripts and popup

chrome.runtime.onInstalled.addListener(() => {
  logger.info('onInstalled', 'Extension installed successfully');
});

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

    case 'PING':
      sendResponse({ success: true, message: 'Background script is active' });
      break;

    default:
      logger.warn('onMessage', 'Unknown message type', request.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

async function handleGetPageContent(tabId: number | undefined, sendResponse: (response: any) => void) {
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

async function handleFillInputs(tabId: number | undefined, inputData: any, sendResponse: (response: any) => void) {
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
