import { createLogger } from '@/utils/log';

const logger = createLogger('AI_OVERLAY_VANILLA');

interface OverlayConfig {
  context: 'fill_input' | 'fix_text' | 'general' | 'question_page';
  initialText?: string;
  targetElement?: HTMLElement | null;
}

export class AIOverlayManager {
  private overlay: HTMLElement | null = null;
  private isVisible = false;
  private currentConfig: OverlayConfig | null = null;

  constructor() {
    // No longer setting up message listener here since content script handles it
  }

  public showOverlay(config: OverlayConfig) {
    logger.info('showOverlay', 'Showing overlay', config);
    
    if (this.isVisible) {
      this.hideOverlay();
    }

    this.currentConfig = config;
    this.createOverlay();
    this.isVisible = true;
    
    // Focus the prompt input
    setTimeout(() => {
      const promptInput = this.overlay?.querySelector('.ai-overlay-prompt-input') as HTMLTextAreaElement;
      if (promptInput) {
        promptInput.focus();
      }
    }, 100);
  }

  private hideOverlay() {
    logger.info('hideOverlay', 'Hiding overlay');
    
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.isVisible = false;
    this.currentConfig = null;
  }

  private createOverlay() {
    const backdrop = document.createElement('div');
    backdrop.className = 'ai-overlay-backdrop';
    
    const container = document.createElement('div');
    container.className = 'ai-overlay-container';
    
    container.innerHTML = this.getOverlayHTML();
    backdrop.appendChild(container);
    
    // Add event listeners
    this.setupOverlayEvents(backdrop, container);
    
    document.body.appendChild(backdrop);
    this.overlay = backdrop;
  }

  private getOverlayHTML(): string {
    const contextPrompt = this.getContextualPrompt();
    
    return `
      <div class="ai-overlay-header">
        <h3 class="ai-overlay-title">AI Assistant</h3>
        <button class="ai-overlay-close" aria-label="Close">×</button>
      </div>
      <div class="ai-overlay-content">
        <div class="ai-overlay-prompt-section">
          <label class="ai-overlay-label">${contextPrompt}</label>
          <textarea 
            class="ai-overlay-textarea ai-overlay-prompt-input" 
            placeholder="Enter your prompt here... (Ctrl+Enter to submit)"
            rows="3"
          ></textarea>
          <button class="ai-overlay-button ai-overlay-button-primary ai-overlay-generate-btn">
            Generate
          </button>
        </div>
        <div class="ai-overlay-response-section" style="display: none;">
          <label class="ai-overlay-label">Response:</label>
          <div class="ai-overlay-response">
            <div class="ai-overlay-loading" style="display: none;">
              <div class="ai-overlay-spinner"></div>
              Generating response...
            </div>
            <textarea 
              class="ai-overlay-textarea ai-overlay-editable ai-overlay-response-text" 
              rows="6"
              placeholder="AI response will appear here..."
              style="display: none;"
            ></textarea>
          </div>
          <div class="ai-overlay-actions" style="display: none;">
            <button class="ai-overlay-button ai-overlay-button-secondary ai-overlay-reset-btn">
              Reset
            </button>
            <button class="ai-overlay-button ai-overlay-button-primary ai-overlay-apply-btn">
              Apply
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private getContextualPrompt(): string {
    if (!this.currentConfig) return 'How can I assist you?';
    
    switch (this.currentConfig.context) {
      case 'fill_input':
        return 'What would you like to generate for this input field?';
      case 'fix_text':
        return `Fix or improve this text: "${this.currentConfig.initialText}"`;
      case 'question_page':
        return 'What would you like to know about this page?';
      default:
        return 'How can I assist you?';
    }
  }

  private setupOverlayEvents(backdrop: HTMLElement, container: HTMLElement) {
    // Close button
    const closeBtn = container.querySelector('.ai-overlay-close') as HTMLButtonElement;
    closeBtn?.addEventListener('click', () => this.hideOverlay());

    // Click outside to close
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.hideOverlay();
      }
    });

    // Escape key to close
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hideOverlay();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Prompt input and generate button
    const promptInput = container.querySelector('.ai-overlay-prompt-input') as HTMLTextAreaElement;
    const generateBtn = container.querySelector('.ai-overlay-generate-btn') as HTMLButtonElement;

    const handleGenerate = () => this.handleGenerate(container);
    
    generateBtn?.addEventListener('click', handleGenerate);
    
    promptInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleGenerate();
      }
    });

    // Response actions
    const resetBtn = container.querySelector('.ai-overlay-reset-btn') as HTMLButtonElement;
    const applyBtn = container.querySelector('.ai-overlay-apply-btn') as HTMLButtonElement;

    resetBtn?.addEventListener('click', () => this.handleReset(container));
    applyBtn?.addEventListener('click', () => this.handleApply(container));
  }

  private async handleGenerate(container: HTMLElement) {
    const promptInput = container.querySelector('.ai-overlay-prompt-input') as HTMLTextAreaElement;
    const prompt = promptInput.value.trim();
    
    if (!prompt) return;

    logger.info('handleGenerate', 'Generating AI response', { prompt, context: this.currentConfig?.context });

    // Show loading state
    this.showLoading(container, true);
    this.showResponseSection(container, true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'AI_GENERATE_TEXT',
        data: {
          prompt,
          context: this.currentConfig?.context,
          initialText: this.currentConfig?.initialText,
          streaming: true
        }
      });

      if (response.success) {
        this.showResponse(container, response.data);
      } else {
        throw new Error(response.error || 'Failed to generate text');
      }
    } catch (error) {
      logger.error('handleGenerate', 'AI generation failed', error);
      this.showResponse(container, 'Sorry, there was an error generating the response. Please try again.');
    } finally {
      this.showLoading(container, false);
    }
  }

  private showLoading(container: HTMLElement, show: boolean) {
    const loading = container.querySelector('.ai-overlay-loading') as HTMLElement;
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  private showResponseSection(container: HTMLElement, show: boolean) {
    const responseSection = container.querySelector('.ai-overlay-response-section') as HTMLElement;
    if (responseSection) {
      responseSection.style.display = show ? 'block' : 'none';
    }
  }

  private showResponse(container: HTMLElement, text: string) {
    const responseText = container.querySelector('.ai-overlay-response-text') as HTMLTextAreaElement;
    const actions = container.querySelector('.ai-overlay-actions') as HTMLElement;
    
    if (responseText) {
      responseText.value = text;
      responseText.style.display = 'block';
    }
    
    if (actions) {
      actions.style.display = 'flex';
    }
  }

  private handleReset(container: HTMLElement) {
    const responseText = container.querySelector('.ai-overlay-response-text') as HTMLTextAreaElement;
    // Reset would restore original AI response - for now just clear
    if (responseText) {
      responseText.value = '';
    }
  }

  private handleApply(container: HTMLElement) {
    const responseText = container.querySelector('.ai-overlay-response-text') as HTMLTextAreaElement;
    const textToApply = responseText?.value || '';
    
    if (this.currentConfig?.targetElement) {
      const element = this.currentConfig.targetElement;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = textToApply;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.focus();
        
        logger.info('handleApply', 'Text applied to target element', { 
          elementType: element.tagName,
          textLength: textToApply.length 
        });
      }
    }

    this.hideOverlay();
  }
}
