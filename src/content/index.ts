import { createLogger } from '@/utils/log';
import { AIOverlayManager } from './VanillaOverlay';

const logger = createLogger('CONTENT_SCRIPT');

// Content script that runs on all pages
// Provides interface between page and extension

class ContentScript {
  private isInitialized = false;
  private currentTargetElement: HTMLElement | null = null;
  private overlayManager: AIOverlayManager;

  constructor() {
    this.overlayManager = new AIOverlayManager();
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    
    console.log('[CONTENT] Content script initializing on:', window.location.href);
    logger.info('init', 'Content script initializing', { url: window.location.href });
    
    try {
      this.setupMessageListener();
      console.log('[CONTENT] Message listener set up');
      
      this.setupUIElements();
      console.log('[CONTENT] UI elements set up');
      
      this.setupRightClickHandling();
      console.log('[CONTENT] Right-click handling set up');
      
      this.isInitialized = true;
      console.log('[CONTENT] Content script initialized successfully');
      logger.info('init', 'Content script initialized successfully');
      
      // Announce readiness to background script
      chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(() => {
        // Ignore errors - background script might not be listening
      });
      
    } catch (error) {
      console.error('[CONTENT] Error during initialization:', error);
      logger.error('init', 'Content script initialization failed', error);
    }
  }

  private setupRightClickHandling() {
    // Track the current target element for context menu actions
    document.addEventListener('contextmenu', (event) => {
      const target = event.target as HTMLElement;
      this.currentTargetElement = target;
      
      // Store the target element for potential AI input filling
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        logger.debug('contextmenu', 'Right-clicked on input element', { 
          type: target.tagName,
          name: target.name,
          id: target.id 
        });
      }
    });

    // Listen for clicks on input elements to show AI assistance
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        // Add a subtle indicator that AI assistance is available
        this.addAIIndicator(target);
      }
    });
  }

  private addAIIndicator(element: HTMLInputElement | HTMLTextAreaElement) {
    // Add a subtle visual indicator that AI assistance is available
    if (element.dataset.aiIndicatorAdded) return;
    
    element.dataset.aiIndicatorAdded = 'true';
    element.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.3)';
    element.style.transition = 'box-shadow 0.2s ease';
    
    // Remove indicator after a short time
    setTimeout(() => {
      element.style.boxShadow = '';
      element.style.transition = '';
      delete element.dataset.aiIndicatorAdded;
    }, 2000);

    logger.debug('addAIIndicator', 'AI indicator added to input', { 
      type: element.tagName,
      id: element.id 
    });
  }

  private setupMessageListener() {
    // Listen for messages from background script or popup
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      console.log('[CONTENT] Received message:', request.type, request);
      logger.info('onMessage', 'Received message', { type: request.type });

      switch (request.type) {
        case 'EXTRACT_PAGE_CONTENT':
          sendResponse(this.extractPageContent());
          break;

        case 'FILL_INPUT':
          this.fillInput(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ 
              success: false, 
              error: error.message 
            }));
          return true; // Keep message channel open

        case 'GET_INPUT_ELEMENTS':
          sendResponse(this.getInputElements());
          break;

        case 'HIGHLIGHT_TEXT':
          this.highlightText(request.data.text);
          sendResponse({ success: true });
          break;

        case 'GET_TARGET_ELEMENT':
          sendResponse({ 
            success: true, 
            data: { 
              hasTarget: !!this.currentTargetElement,
              targetInfo: this.currentTargetElement ? {
                tagName: this.currentTargetElement.tagName,
                type: (this.currentTargetElement as HTMLInputElement).type || 'unknown',
                id: this.currentTargetElement.id,
                name: (this.currentTargetElement as HTMLInputElement).name || '',
              } : null
            }
          });
          break;

        case 'FOCUS_TARGET_ELEMENT':
          if (this.currentTargetElement instanceof HTMLInputElement || 
              this.currentTargetElement instanceof HTMLTextAreaElement) {
            this.currentTargetElement.focus();
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No valid target element' });
          }
          break;

        case 'SHOW_AI_INPUT_OVERLAY':
          logger.info('onMessage', 'Showing AI input overlay', { hasTarget: !!this.currentTargetElement });
          this.overlayManager.showOverlay({
            context: 'fill_input',
            targetElement: this.currentTargetElement
          });
          sendResponse({ success: true });
          break;

        case 'SHOW_AI_TEXT_OVERLAY':
          logger.info('onMessage', 'Showing AI text overlay', { 
            selectedText: request.data?.selectedText,
            context: request.data?.context 
          });
          this.overlayManager.showOverlay({
            context: request.data?.context || 'fix_text',
            initialText: request.data?.selectedText || ''
          });
          sendResponse({ success: true });
          break;

        case 'SHOW_AI_OVERLAY':
          logger.info('onMessage', 'Showing AI general overlay');
          this.overlayManager.showOverlay({
            context: 'general'
          });
          sendResponse({ success: true });
          break;

        case 'SHOW_AI_QUESTION_OVERLAY':
          logger.info('onMessage', 'Showing AI question overlay');
          this.overlayManager.showOverlay({
            context: 'question_page'
          });
          sendResponse({ success: true });
          break;

        case 'PING':
          console.log('[CONTENT] PING received, responding...');
          logger.debug('onMessage', 'Content script ping received');
          sendResponse({ success: true, message: 'Content script is active', timestamp: Date.now() });
          break;

        default:
          logger.warn('onMessage', 'Unknown message type', request.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    });
  }

  private setupUIElements() {
    // Add keyboard shortcut for quick access
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+A (or Cmd+Shift+A on Mac) to trigger text fixer
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        this.handleQuickTextFix();
      }
      
      // Ctrl+Shift+T to test overlay (for debugging)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        console.log('[CONTENT] Testing overlay trigger');
        // Simulate a message to show overlay
        chrome.runtime.sendMessage({
          type: 'SHOW_AI_OVERLAY',
          data: { context: 'general' }
        }).then(response => {
          console.log('[CONTENT] Test message response:', response);
        }).catch(error => {
          console.error('[CONTENT] Test message error:', error);
        });
      }
    });

    // Add context menu for selected text
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        this.showTextSelectionOptions(selection);
      }
    });
  }

  private extractPageContent() {
    const content = {
      title: document.title,
      url: window.location.href,
      text: document.body.innerText || '',
      html: document.body.innerHTML,
      forms: this.getFormData(),
      inputs: this.getInputElements(),
      timestamp: new Date().toISOString(),
    };

    logger.info('extractPageContent', 'Page content extracted', { 
      textLength: content.text.length,
      formsCount: content.forms.length,
      inputsCount: content.inputs.length,
    });

    return content;
  }

  private getFormData() {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.map((form, index) => ({
      index,
      action: form.action,
      method: form.method,
      inputs: Array.from(form.querySelectorAll('input, textarea, select')).map((input: Element) => {
        const htmlInput = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const hasName = 'name' in htmlInput;
        const hasPlaceholder = 'placeholder' in htmlInput;
        const hasValue = 'value' in htmlInput;
        const hasType = 'type' in htmlInput;
        
        return {
          type: hasType ? (htmlInput as HTMLInputElement).type : input.tagName.toLowerCase(),
          name: hasName ? htmlInput.name : '',
          id: htmlInput.id || '',
          placeholder: hasPlaceholder ? (htmlInput as HTMLInputElement | HTMLTextAreaElement).placeholder : '',
          value: hasValue ? htmlInput.value : '',
        };
      }),
    }));
  }

  private getInputElements() {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    return inputs.map((input, index) => {
      const htmlInput = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const hasName = 'name' in htmlInput;
      const hasPlaceholder = 'placeholder' in htmlInput;
      const hasValue = 'value' in htmlInput;
      const hasType = 'type' in htmlInput;
      
      return {
        index,
        type: hasType ? (htmlInput as HTMLInputElement).type : input.tagName.toLowerCase(),
        name: hasName ? htmlInput.name : '',
        id: htmlInput.id,
        className: htmlInput.className,
        placeholder: hasPlaceholder ? (htmlInput as HTMLInputElement | HTMLTextAreaElement).placeholder : '',
        value: hasValue ? htmlInput.value : '',
        selector: this.generateSelector(input),
      };
    });
  }

  private generateSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private async fillInput(data: { selector: string; value: string }) {
    try {
      const elements = document.querySelectorAll(data.selector);
      const results: Array<{ element: string; success: boolean }> = [];

      elements.forEach((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.value = data.value;
          
          // Trigger events to notify frameworks like React
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          
          results.push({ element: data.selector, success: true });
          logger.info('fillInput', 'Input filled successfully', { selector: data.selector });
        }
      });

      return results;
    } catch (error) {
      logger.error('fillInput', 'Failed to fill input', error);
      throw error;
    }
  }

  private highlightText(text: string) {
    // Simple text highlighting implementation
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent?.includes(text)) {
        textNodes.push(node as Text);
      }
    }

    textNodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (parent) {
        const highlightedHTML = textNode.textContent!.replace(
          new RegExp(text, 'gi'),
          `<mark style="background-color: yellow; padding: 2px;">$&</mark>`
        );
        parent.innerHTML = parent.innerHTML.replace(textNode.textContent!, highlightedHTML);
      }
    });

    logger.info('highlightText', 'Text highlighted', { text, nodesCount: textNodes.length });
  }

  private handleQuickTextFix() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      // Send selected text to background script for processing
      chrome.runtime.sendMessage({
        type: 'QUICK_TEXT_FIX',
        data: { text: selection.toString() }
      });
    }
  }

  private showTextSelectionOptions(selection: Selection) {
    // TODO: Implement floating menu for text selection options
    // This could show options like "Fix Text", "Ask Question", etc.
    logger.debug('showTextSelectionOptions', 'Text selected', { 
      text: selection.toString().substring(0, 100) 
    });
  }
}

// Initialize content script when DOM is ready
console.log('[CONTENT] Script loaded, document.readyState:', document.readyState);

let contentScriptInstance: ContentScript | null = null;

function initializeContentScript() {
  try {
    if (contentScriptInstance) {
      console.log('[CONTENT] Content script already initialized');
      return;
    }
    console.log('[CONTENT] Creating new ContentScript instance');
    contentScriptInstance = new ContentScript();
    console.log('[CONTENT] ContentScript instance created successfully');
  } catch (error) {
    console.error('[CONTENT] Failed to initialize content script:', error);
  }
}

if (document.readyState === 'loading') {
  console.log('[CONTENT] Document loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  console.log('[CONTENT] Document ready, initializing immediately');
  initializeContentScript();
}

// Failsafe: Initialize after a short delay if not already done
setTimeout(() => {
  if (!contentScriptInstance) {
    console.log('[CONTENT] Failsafe initialization after 1 second');
    initializeContentScript();
  }
}, 1000);
