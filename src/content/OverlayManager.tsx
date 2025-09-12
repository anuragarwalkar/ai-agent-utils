import React from 'react';
import { AIOverlay } from '@/components/AIOverlay';
import { useAIOverlay } from '@/hooks/useAIOverlay';
import { createLogger } from '@/utils/log';

const logger = createLogger('CONTENT_OVERLAY_MANAGER');

interface MessageRequest {
  type: string;
  data?: {
    targetElement?: HTMLElement;
    selectedText?: string;
  };
}

const ContentOverlayManager: React.FC = () => {
  const {
    overlayState,
    hideOverlay,
    showInputOverlay,
    showTextOverlay,
    showGeneralOverlay,
    showQuestionOverlay,
  } = useAIOverlay();

  // Listen for messages from background script
  React.useEffect(() => {
    const messageListener = (
      request: MessageRequest, 
      _sender: chrome.runtime.MessageSender, 
      sendResponse: (response: { success: boolean }) => void
    ) => {
      logger.info('messageListener', 'Received message', { type: request.type });
      
      // Add console.log for debugging
      console.log('[AI_OVERLAY] Received message:', request.type, request);

      switch (request.type) {
        case 'SHOW_AI_INPUT_OVERLAY':
          console.log('[AI_OVERLAY] Showing input overlay');
          showInputOverlay(request.data?.targetElement);
          sendResponse({ success: true });
          break;

        case 'SHOW_AI_TEXT_OVERLAY':
          console.log('[AI_OVERLAY] Showing text overlay');
          showTextOverlay(request.data?.selectedText || '');
          sendResponse({ success: true });
          break;

        case 'SHOW_AI_OVERLAY':
          console.log('[AI_OVERLAY] Showing general overlay');
          showGeneralOverlay();
          sendResponse({ success: true });
          break;

        case 'SHOW_AI_QUESTION_OVERLAY':
          console.log('[AI_OVERLAY] Showing question overlay');
          showQuestionOverlay();
          sendResponse({ success: true });
          break;

        default:
          return false; // Let other handlers process the message
      }

      return true; // Keep message channel open
    };

    chrome.runtime.onMessage.addListener(messageListener);
    console.log('[AI_OVERLAY] Message listener registered');

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [showInputOverlay, showTextOverlay, showGeneralOverlay, showQuestionOverlay]);

  const handleApplyText = (text: string) => {
    if (overlayState.targetElement) {
      const element = overlayState.targetElement;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.focus();
        
        logger.info('handleApplyText', 'Text applied to target element', { 
          elementType: element.tagName,
          textLength: text.length 
        });
      }
    }
  };

  return (
    <AIOverlay
      isVisible={overlayState.isVisible}
      onClose={hideOverlay}
      context={overlayState.context}
      initialText={overlayState.initialText}
      targetElement={overlayState.targetElement}
      onApplyText={handleApplyText}
    />
  );
};

export default ContentOverlayManager;
