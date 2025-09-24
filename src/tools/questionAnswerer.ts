import { AIService, type ChatMessage } from '@/services/ai';
import { WebReaderTool } from './webReader';
import { createLogger } from '@/utils/log';

const logger = createLogger('QUESTION_ANSWERER_TOOL');

export interface QuestionAnswer {
  question: string;
  answer: string;
  context: string;
  pageTitle?: string;
  pageUrl?: string;
  contextLength?: number;
  success: boolean;
  error?: string;
}

export class QuestionAnswererTool {
  private aiService: AIService;
  private webReader: WebReaderTool;
  
  constructor() {
    this.aiService = AIService.getInstance();
    this.webReader = new WebReaderTool();
  }
  
  async answerQuestion(question: string, useCurrentPage = true): Promise<QuestionAnswer> {
    try {
      logger.info('answerQuestion', 'Answering question', { question, useCurrentPage });
      
      let context = '';
      let pageTitle = '';
      let pageUrl = '';
      let contextLength = 0;
      
      if (useCurrentPage) {
        const pageContent = await this.webReader.readCurrentPage();
        if (pageContent.success && pageContent.content.trim()) {
          pageTitle = pageContent.title;
          pageUrl = pageContent.url;
          contextLength = pageContent.content.length;
          
          // Create structured context
          context = this.formatPageContext(pageContent);
          logger.info('answerQuestion', 'Using page context', { 
            title: pageTitle, 
            contentLength: contextLength 
          });
        } else {
          logger.warn('answerQuestion', 'Failed to get page content, using general knowledge', 
            pageContent.error);
        }
      }
      
      const systemPrompt = this.buildSystemPrompt(!!context);
      const userPrompt = this.buildUserPrompt(question, context);
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const response = await this.aiService.chat(messages);
      
      if (!response.success) {
        logger.error('answerQuestion', 'AI service error', response.error);
        return {
          question,
          answer: '',
          context,
          success: false,
          error: response.error,
        };
      }
      
      logger.info('answerQuestion', 'Question answered successfully');
      return {
        question,
        answer: response.content.trim(),
        context,
        pageTitle,
        pageUrl,
        contextLength,
        success: true,
      };
      
    } catch (error) {
      logger.error('answerQuestion', 'Failed to answer question', error);
      return {
        question,
        answer: '',
        context: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatPageContext(pageContent: { title: string; content: string; url: string }): string {
    const { title, content, url } = pageContent;
    
    return `Current webpage information:
Title: ${title}
URL: ${url}
Content: ${content}`;
  }

  private buildSystemPrompt(hasContext: boolean): string {
    if (hasContext) {
      return `You are a helpful AI assistant that answers questions based on the current webpage content. 
You have access to the page's title, URL, and text content.

Guidelines:
- Use the provided webpage context to answer questions accurately
- If the question relates to the page content, prioritize information from the page
- If the question is general and not related to the page, you can use your general knowledge
- Be specific and reference relevant parts of the page when applicable
- If the page content doesn't contain enough information to answer the question, say so clearly
- Provide concise but complete answers

Always be helpful, accurate, and honest about the limitations of the available information.`;
    } else {
      return `You are a helpful AI assistant. Answer the user's question using your general knowledge.
Provide clear, concise, and accurate answers. If you're unsure about something, say so.`;
    }
  }

  private buildUserPrompt(question: string, context: string): string {
    if (context.trim()) {
      return `${context}

Based on the above webpage content, please answer this question:
${question}`;
    } else {
      return question;
    }
  }
}
