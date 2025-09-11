import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setConfig } from '../store/configSlice';
import { getConfig } from '../config';
import { TextFixerTool } from '../tools/textFixer';
import { QuestionAnswererTool } from '../tools/questionAnswerer';
import { createLogger } from '../utils/log';

const logger = createLogger('POPUP_APP');

const PopupApp: React.FC = () => {
  const dispatch = useDispatch();
  const { config } = useSelector((state: RootState) => state.config);
  const [activeTab, setActiveTab] = useState<'textFixer' | 'qa' | 'settings'>('textFixer');
  const [inputText, setInputText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const textFixer = new TextFixerTool();
  const questionAnswerer = new QuestionAnswererTool();

  const loadConfig = useCallback(async () => {
    try {
      const savedConfig = await getConfig();
      dispatch(setConfig(savedConfig));
    } catch (error) {
      logger.error('loadConfig', 'Failed to load config', error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleTextFix = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await textFixer.fixText(inputText, userPrompt);
      setResult(result.success ? result.fixedText : result.error || 'Failed to fix text');
    } catch (error) {
      logger.error('handleTextFix', 'Text fix failed', error);
      setResult('Error occurred while fixing text');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestion = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await questionAnswerer.answerQuestion(inputText);
      setResult(result.success ? result.answer : result.error || 'Failed to answer question');
    } catch (error) {
      logger.error('handleQuestion', 'Question answering failed', error);
      setResult('Error occurred while answering question');
    } finally {
      setIsLoading(false);
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>AI Agent</h1>
        <div className="tab-buttons">
          <button 
            className={activeTab === 'textFixer' ? 'active' : ''}
            onClick={() => setActiveTab('textFixer')}
          >
            Text Fixer
          </button>
          <button 
            className={activeTab === 'qa' ? 'active' : ''}
            onClick={() => setActiveTab('qa')}
          >
            Q&A
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={openSettings}
          >
            Settings
          </button>
        </div>
      </header>

      <main className="popup-main">
        {!config.apiKey && (
          <div className="warning">
            ⚠️ Please configure your API key in settings
          </div>
        )}

        {activeTab === 'textFixer' && (
          <div className="tool-section">
            <h3>Auto-fix Text</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to fix..."
              rows={4}
            />
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Custom instructions (optional)"
            />
            <button 
              onClick={handleTextFix} 
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? 'Fixing...' : 'Fix Text'}
            </button>
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="tool-section">
            <h3>Ask Question</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question about this page..."
              rows={3}
            />
            <button 
              onClick={handleQuestion} 
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? 'Answering...' : 'Ask Question'}
            </button>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h4>Result:</h4>
            <div className="result-content">
              {result}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PopupApp;
