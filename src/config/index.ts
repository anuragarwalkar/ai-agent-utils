import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/constants';

export { DEFAULT_CONFIG } from '@/constants';

export interface AIConfig {
  apiKey: string;
  apiServer: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export const getConfig = async (): Promise<AIConfig> => {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
    return {
      ...DEFAULT_CONFIG,
      ...result[STORAGE_KEYS.CONFIG],
    };
  } catch (error) {
    console.error('[CONFIG] [getConfig] Error retrieving config:', error);
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = async (config: Partial<AIConfig>): Promise<void> => {
  try {
    const currentConfig = await getConfig();
    const newConfig = { ...currentConfig, ...config };
    await chrome.storage.sync.set({ [STORAGE_KEYS.CONFIG]: newConfig });
    console.log('[CONFIG] [saveConfig] Config saved successfully');
  } catch (error) {
    console.error('[CONFIG] [saveConfig] Error saving config:', error);
    throw error;
  }
};

export const validateConfig = (config: AIConfig): boolean => {
  return !!(
    config.apiKey?.trim() &&
    config.apiServer?.trim() &&
    config.model?.trim() &&
    typeof config.temperature === 'number' &&
    config.temperature >= 0 &&
    config.temperature <= 2 &&
    typeof config.maxTokens === 'number' &&
    config.maxTokens > 0
  );
};
