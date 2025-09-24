export const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1/chat/completions',
} as const;

export const DEFAULT_CONFIG = {
  apiKey: '',
  apiServer: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2048,
} as const;

export const STORAGE_KEYS = {
  CONFIG: 'ai_agent_config',
  HISTORY: 'ai_agent_history',
} as const;

export const TOOLS = {
  WEB_READER: 'web_reader',
  QUESTION_ANSWERER: 'question_answerer', 
  INPUT_FILLER: 'input_filler',
  TEXT_FIXER: 'text_fixer',
} as const;

export const MESSAGES = {
  ERRORS: {
    NO_API_KEY: 'Please configure your API key in extension settings',
    INVALID_CONFIG: 'Invalid configuration. Please check your settings',
    NETWORK_ERROR: 'Network error. Please try again',
    CONTENT_SCRIPT_UNAVAILABLE: 'Unable to read page content. Please refresh the page and try again.',
    QUESTION_FAILED: 'Failed to answer question. Please try again.',
  },
  SUCCESS: {
    CONFIG_SAVED: 'Configuration saved successfully',
    TEXT_FIXED: 'Text has been auto-fixed',
    QUESTION_ANSWERED: 'Question answered successfully',
  },
  QA: {
    CONTEXT_ENABLED: 'Questions will be answered using the current page content',
    CONTEXT_DISABLED: 'Questions will be answered using general knowledge only',
    SUGGESTIONS: [
      "What is this page about?",
      "Summarize the main points", 
      "What are the key features?",
      "How does this work?"
    ],
  },
} as const;
