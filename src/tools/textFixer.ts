import { AIService, type ChatMessage } from '@/services/ai';
import { createLogger } from '@/utils/log';

const logger = createLogger('TEXT_FIXER_TOOL');

export interface TextFixResult {
  originalText: string;
  fixedText: string;
  success: boolean;
  error?: string;
}

export class TextFixerTool {
  private aiService: AIService;
  
  constructor() {
    this.aiService = AIService.getInstance();
  }
  
  async fixText(text: string, userPrompt?: string): Promise<TextFixResult> {
    try {
      logger.info('fixText', 'Starting text fix', { textLength: text.length });
      
      const systemPrompt = this.buildSystemPrompt(userPrompt);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ];
      
      const response = await this.aiService.chat(messages);
      
      if (!response.success) {
        logger.error('fixText', 'AI service error', response.error);
        return {
          originalText: text,
          fixedText: text,
          success: false,
          error: response.error,
        };
      }
      
      logger.info('fixText', 'Text fix completed successfully');
      return {
        originalText: text,
        fixedText: response.content.trim(),
        success: true,
      };
      
    } catch (error) {
      logger.error('fixText', 'Text fix failed', error);
      return {
        originalText: text,
        fixedText: text,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private buildSystemPrompt(userPrompt?: string): string {
    const basePrompt = `You are a text correction assistant. Your task is to:
1. Fix grammar, spelling, and punctuation errors
2. Improve clarity and readability
3. Maintain the original meaning and tone
4. Return only the corrected text without explanations`;
    
    if (userPrompt) {
      return `${basePrompt}\n\nAdditional instructions: ${userPrompt}`;
    }
    
    return basePrompt;
  }
}
