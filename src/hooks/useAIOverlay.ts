import { useState, useCallback } from 'react';
import { createLogger } from '@/utils/log';

const logger = createLogger('USE_AI_OVERLAY');

export interface OverlayState {
  isVisible: boolean;
  context: 'fill_input' | 'fix_text' | 'general' | 'question_page';
  initialText?: string;
  targetElement?: HTMLElement | null;
}

export const useAIOverlay = () => {
  const [overlayState, setOverlayState] = useState<OverlayState>({
    isVisible: false,
    context: 'general',
  });

  const showOverlay = useCallback((config: Partial<OverlayState>) => {
    logger.info('showOverlay', 'Showing AI overlay', config);
    setOverlayState(prev => ({
      ...prev,
      isVisible: true,
      ...config,
    }));
  }, []);

  const hideOverlay = useCallback(() => {
    logger.info('hideOverlay', 'Hiding AI overlay');
    setOverlayState(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showInputOverlay = useCallback((targetElement?: HTMLElement) => {
    showOverlay({
      context: 'fill_input',
      targetElement,
    });
  }, [showOverlay]);

  const showTextOverlay = useCallback((selectedText: string) => {
    showOverlay({
      context: 'fix_text',
      initialText: selectedText,
    });
  }, [showOverlay]);

  const showGeneralOverlay = useCallback(() => {
    showOverlay({
      context: 'general',
    });
  }, [showOverlay]);

  const showQuestionOverlay = useCallback(() => {
    showOverlay({
      context: 'question_page',
    });
  }, [showOverlay]);

  return {
    overlayState,
    showOverlay,
    hideOverlay,
    showInputOverlay,
    showTextOverlay,
    showGeneralOverlay,
    showQuestionOverlay,
  };
};
