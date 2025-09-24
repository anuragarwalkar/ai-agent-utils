import { createLogger } from '@/utils/log';
import { MESSAGES } from '@/constants';

const logger = createLogger('WEB_READER_TOOL');

export interface WebPageContent {
  title: string;
  content: string;
  url: string;
  success: boolean;
  error?: string;
}

export class WebReaderTool {
  async readCurrentPage(): Promise<WebPageContent> {
    try {
      logger.info('readCurrentPage', 'Reading current web page');
      
      // Send message to background script to get page content
      logger.info('readCurrentPage', 'Sending GET_PAGE_CONTENT message to background script');
      
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_PAGE_CONTENT' 
      });
      
      logger.info('readCurrentPage', 'Received response from background script', {
        success: response?.success,
        hasData: !!response?.data,
        error: response?.error,
        dataKeys: response?.data ? Object.keys(response.data) : []
      });
      
      if (!response?.success || !response.data) {
        const errorMsg = response?.error || MESSAGES.ERRORS.CONTENT_SCRIPT_UNAVAILABLE;
        logger.warn('readCurrentPage', 'Background script failed, trying fallback method', { 
          response, 
          errorMsg 
        });
        
        // No fallback available - background script is the only way in Manifest V3
        throw new Error(`Background script failed: ${errorMsg}`);
      }
      
      const pageData = response.data;
      logger.info('readCurrentPage', 'Page data extracted', {
        title: pageData.title,
        url: pageData.url,
        contentLength: pageData.content?.length || 0
      });
      
      // Clean and truncate content for AI processing (keep it reasonable)
      const cleanContent = this.cleanTextContent(pageData.content);
      const truncatedContent = this.truncateContent(cleanContent, 5000);
      
      logger.info('readCurrentPage', 'Content processed', {
        originalLength: pageData.content?.length || 0,
        cleanedLength: cleanContent.length,
        finalLength: truncatedContent.length
      });
      
      return {
        title: pageData.title || 'Unknown Title',
        content: truncatedContent,
        url: pageData.url || '',
        success: true,
      };
      
    } catch (error) {
      logger.error('readCurrentPage', 'Failed to read page', error);
      return {
        title: '',
        content: '',
        url: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private cleanTextContent(text: string): string {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace and newlines
      .replace(/\s+/g, ' ')
      // Remove common noise patterns
      .replace(/\b(cookie|privacy|terms|subscribe|newsletter|advertisement)\b/gi, '')
      // Clean up special characters
      .replace(/[^\w\s.,!?;:()\-'"]/g, ' ')
      // Normalize spaces again
      .replace(/\s+/g, ' ')
      .trim();
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    
    // Try to truncate at sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > maxLength * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    }
    
    // Otherwise truncate at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
  
  async readPageByUrl(url: string): Promise<WebPageContent> {
    try {
      logger.info('readPageByUrl', 'Reading page by URL', { url });
      
      // For URL-based reading, we currently use the active tab
      // This could be enhanced to support specific tab targeting in the future
      logger.warn('readPageByUrl', 'URL-based reading not fully implemented, using current page');
      
      return this.readCurrentPage();
      
    } catch (error) {
      logger.error('readPageByUrl', 'Failed to read page by URL', error);
      return {
        title: '',
        content: '',
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }


}
