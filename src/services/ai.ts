import { getConfig, validateConfig, type AIConfig } from '@/config';
import { createLogger } from '@/utils/log';
import { MESSAGES } from '@/constants';

const logger = createLogger('AI_SERVICE');

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export class AIService {
  private static instance: AIService;
  
  private constructor() {}
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  
  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    try {
      const config = await getConfig();
      
      if (!validateConfig(config)) {
        logger.error('chat', 'Invalid configuration', config);
        return {
          content: '',
          success: false,
          error: MESSAGES.ERRORS.INVALID_CONFIG,
        };
      }
      
      const response = await this.makeRequest(config, messages);
      logger.info('chat', 'Chat response received', { messageCount: messages.length });
      
      return {
        content: response.choices[0]?.message?.content || '',
        success: true,
      };
      
    } catch (error) {
      logger.error('chat', 'Chat request failed', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : MESSAGES.ERRORS.NETWORK_ERROR,
      };
    }
  }
  
  private async makeRequest(config: AIConfig, messages: ChatMessage[]) {
    const endpoint = `${config.apiServer.replace(/\/$/, '')}/chat/completions`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}
