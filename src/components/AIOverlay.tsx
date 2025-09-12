import React, { useState, useEffect, useRef } from 'react';
import { createLogger } from '@/utils/log';

const logger = createLogger('AI_OVERLAY');

interface AIOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  context: 'fill_input' | 'fix_text' | 'general' | 'question_page';
  initialText?: string;
  targetElement?: HTMLElement | null;
  onApplyText?: (text: string) => void;
}

export const AIOverlay: React.FC<AIOverlayProps> = ({
  isVisible,
  onClose,
  context,
  initialText = '',
  targetElement,
  onApplyText,
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editedText, setEditedText] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isVisible && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    setEditedText(response);
  }, [response]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      
      // Enable pointer events on the overlay root when visible
      const overlayRoot = document.getElementById('ai-agent-overlay-root');
      if (overlayRoot) {
        overlayRoot.style.pointerEvents = 'all';
      }
    } else {
      // Disable pointer events when hidden
      const overlayRoot = document.getElementById('ai-agent-overlay-root');
      if (overlayRoot) {
        overlayRoot.style.pointerEvents = 'none';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const getContextualPrompt = () => {
    switch (context) {
      case 'fill_input':
        return 'What would you like to generate for this input field?';
      case 'fix_text':
        return `Fix or improve this text: "${initialText}"`;
      case 'question_page':
        return 'What would you like to know about this page?';
      default:
        return 'How can I assist you?';
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse('');
    
    try {
      logger.info('handleSubmit', 'Sending AI request', { context, prompt });

      // Send message to background script for AI processing
      const response = await chrome.runtime.sendMessage({
        type: 'AI_GENERATE_TEXT',
        data: {
          prompt,
          context,
          initialText,
          streaming: true
        }
      });

      if (response.success) {
        // Simulate streaming response for now
        await simulateStreamingResponse(response.data);
      } else {
        throw new Error(response.error || 'Failed to generate text');
      }
    } catch (error) {
      logger.error('handleSubmit', 'AI request failed', error);
      setResponse('Sorry, there was an error generating the response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateStreamingResponse = async (text: string) => {
    const words = text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      setResponse(currentText);
      
      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const handleApply = () => {
    const textToApply = editedText || response;
    
    if (onApplyText) {
      onApplyText(textToApply);
    } else if (targetElement) {
      // Direct application to target element
      if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
        targetElement.value = textToApply;
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        targetElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    logger.info('handleApply', 'Text applied', { context, textLength: textToApply.length });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="ai-overlay-backdrop">
      <div ref={overlayRef} className="ai-overlay-container">
        <div className="ai-overlay-header">
          <h3 className="ai-overlay-title">AI Assistant</h3>
          <button
            className="ai-overlay-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="ai-overlay-content">
          <div className="ai-overlay-prompt-section">
            <label className="ai-overlay-label">
              {getContextualPrompt()}
            </label>
            <textarea
              ref={promptInputRef}
              className="ai-overlay-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your prompt here... (Ctrl+Enter to submit)"
              rows={3}
            />
            <button
              className="ai-overlay-button ai-overlay-button-primary"
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {(response || isLoading) && (
            <div className="ai-overlay-response-section">
              <label className="ai-overlay-label">Response:</label>
              <div className="ai-overlay-response">
                {isLoading && !response && (
                  <div className="ai-overlay-loading">
                    <div className="ai-overlay-spinner"></div>
                    Generating response...
                  </div>
                )}
                {response && (
                  <textarea
                    className="ai-overlay-textarea ai-overlay-editable"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={6}
                    placeholder="AI response will appear here..."
                  />
                )}
              </div>
              {response && (
                <div className="ai-overlay-actions">
                  <button
                    className="ai-overlay-button ai-overlay-button-secondary"
                    onClick={() => setEditedText(response)}
                  >
                    Reset
                  </button>
                  <button
                    className="ai-overlay-button ai-overlay-button-primary"
                    onClick={handleApply}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
