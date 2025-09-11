import { AIService, type ChatMessage } from '@/services/ai';
import { WebReaderTool } from './webReader';
import { createLogger } from '@/utils/log';

const logger = createLogger('QUESTION_ANSWERER_TOOL');

export interface QuestionAnswer {
  question: string;
  answer: string;
  context: string;
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
      logger.info('answerQuestion', 'Answering question', { question });
      
      let context = '';
      
      if (useCurrentPage) {
        const pageContent = await this.webReader.readCurrentPage();
        if (pageContent.success) {
          context = `Page Title: ${pageContent.title}\nPage Content: ${pageContent.content}`;
        }
      }
      
      const systemPrompt = `You are a helpful assistant that answers questions based on the provided context. 
If context is provided, use it to answer the question. If no context is available, use your general knowledge.
Provide clear, concise, and accurate answers.`;
      
      const userPrompt = context 
        ? `Context: ${context}\n\nQuestion: ${question}`
        : `Question: ${question}`;
      
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
}
