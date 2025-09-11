import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { setConfig, setLoading, setError, clearError } from '@/store/configSlice';
import { getConfig, saveConfig, validateConfig, type AIConfig } from '@/config';
import { MESSAGES } from '@/constants';
import { createLogger } from '@/utils/log';

const logger = createLogger('OPTIONS_APP');

const OptionsApp: React.FC = () => {
  const dispatch = useDispatch();
  const { config, isLoading, error } = useSelector((state: RootState) => state.config);
  const [formData, setFormData] = useState<AIConfig>(config);
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const loadConfig = async () => {
    try {
      dispatch(setLoading(true));
      const savedConfig = await getConfig();
      dispatch(setConfig(savedConfig));
    } catch (error) {
      logger.error('loadConfig', 'Failed to load config', error);
      dispatch(setError('Failed to load configuration'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInputChange = (field: keyof AIConfig, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    dispatch(clearError());
    setSaveStatus('');
  };

  const handleSave = async () => {
    try {
      if (!validateConfig(formData)) {
        dispatch(setError('Please fill in all required fields correctly'));
        return;
      }

      dispatch(setLoading(true));
      await saveConfig(formData);
      dispatch(setConfig(formData));
      setSaveStatus(MESSAGES.SUCCESS.CONFIG_SAVED);
      logger.info('handleSave', 'Configuration saved successfully');
    } catch (error) {
      logger.error('handleSave', 'Failed to save config', error);
      dispatch(setError('Failed to save configuration'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleReset = () => {
    setFormData(config);
    dispatch(clearError());
    setSaveStatus('');
  };

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>AI Agent Settings</h1>
        <p>Configure your AI agent with API credentials and preferences</p>
      </header>

      <main className="options-main">
        <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
          <section className="form-section">
            <h2>API Configuration</h2>
            
            <div className="form-group">
              <label htmlFor="apiKey">API Key *</label>
              <input
                type="password"
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="Enter your OpenAI-compatible API key"
                required
              />
              <small>Your API key for accessing AI services (e.g., OpenAI, Azure OpenAI, etc.)</small>
            </div>

            <div className="form-group">
              <label htmlFor="apiServer">API Server *</label>
              <input
                type="url"
                id="apiServer"
                value={formData.apiServer}
                onChange={(e) => handleInputChange('apiServer', e.target.value)}
                placeholder="https://api.openai.com/v1"
                required
              />
              <small>Base URL for the API server</small>
            </div>

            <div className="form-group">
              <label htmlFor="model">Model *</label>
              <input
                type="text"
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="gpt-3.5-turbo"
                required
              />
              <small>AI model to use (e.g., gpt-3.5-turbo, gpt-4, claude-3-sonnet)</small>
            </div>
          </section>

          <section className="form-section">
            <h2>Model Parameters</h2>
            
            <div className="form-group">
              <label htmlFor="temperature">Temperature: {formData.temperature}</label>
              <input
                type="range"
                id="temperature"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              />
              <small>Controls randomness: 0 = focused, 2 = creative</small>
            </div>

            <div className="form-group">
              <label htmlFor="maxTokens">Max Tokens</label>
              <input
                type="number"
                id="maxTokens"
                min="1"
                max="8192"
                value={formData.maxTokens}
                onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
              />
              <small>Maximum number of tokens in the response</small>
            </div>
          </section>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {saveStatus && (
            <div className="success-message">
              ✅ {saveStatus}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleReset}
              className="button-secondary"
              disabled={isLoading}
            >
              Reset
            </button>
            <button 
              type="button" 
              onClick={handleSave}
              className="button-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default OptionsApp;
