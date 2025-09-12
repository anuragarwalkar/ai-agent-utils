import { createRoot } from 'react-dom/client';
import ContentOverlayManager from './OverlayManager';
import { createLogger } from '@/utils/log';

const logger = createLogger('OVERLAY_INJECTOR');

// Function to inject the overlay manager into the page
export const injectOverlayManager = () => {
  // Check if already injected
  if (document.getElementById('ai-agent-overlay-root')) {
    logger.warn('injectOverlayManager', 'Overlay manager already injected');
    return;
  }

  try {
    // Create root element
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'ai-agent-overlay-root';
    overlayRoot.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      pointer-events: none !important;
    `;

    document.body.appendChild(overlayRoot);

    // Create React root and render the overlay manager
    const root = createRoot(overlayRoot);
    root.render(<ContentOverlayManager />);

    logger.info('injectOverlayManager', 'Overlay manager injected successfully');
  } catch (error) {
    logger.error('injectOverlayManager', 'Failed to inject overlay manager', error);
  }
};
