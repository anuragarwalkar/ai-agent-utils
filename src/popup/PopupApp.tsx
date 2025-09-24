import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setConfig } from '../store/configSlice';
import { getConfig } from '../config';
import { TextFixerTool } from '../tools/textFixer';
import { QuestionAnswererTool } from '../tools/questionAnswerer';
import { createLogger } from '../utils/log';
import { MESSAGES } from '../constants';

const logger = createLogger('POPUP_APP');

const PopupApp: React.FC = () => {
  const dispatch = useDispatch();
  const { config } = useSelector((state: RootState) => state.config);
  const [activeTab, setActiveTab] = useState<'textFixer' | 'qa' | 'settings'>('textFixer');
  const [inputText, setInputText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useWebpageContext, setUseWebpageContext] = useState(true);
  const [currentPageInfo, setCurrentPageInfo] = useState<{ title: string; url: string } | null>(null);
  
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

  const loadCurrentPageInfo = useCallback(async () => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        setCurrentPageInfo({
          title: activeTab.title || 'Unknown Title',
          url: activeTab.url || 'Unknown URL'
        });
      }
    } catch (error) {
      logger.error('loadCurrentPageInfo', 'Failed to load page info', error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadCurrentPageInfo();
  }, [loadConfig, loadCurrentPageInfo]);

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
    setResult(''); // Clear previous result
    
    try {
      logger.info('handleQuestion', 'Starting Q&A process', { 
        question: inputText.substring(0, 50) + '...', 
        useWebpageContext 
      });
      
      const result = await questionAnswerer.answerQuestion(inputText, useWebpageContext);
      
      if (result.success) {
        let displayResult = result.answer;
        
        // Add context information if available
        if (useWebpageContext && result.pageTitle) {
          displayResult += `\n\n📄 Based on: ${result.pageTitle}`;
          if (result.contextLength && result.contextLength > 0) {
            displayResult += ` (${result.contextLength} characters analyzed)`;
          }
        } else if (useWebpageContext && !result.pageTitle) {
          // Show warning if context was requested but not available
          displayResult += `\n\n⚠️ Page context was not available, answered using general knowledge`;
        }
        
        setResult(displayResult);
        logger.info('handleQuestion', 'Question answered successfully', { 
          hasPageContext: !!result.pageTitle 
        });
      } else {
        const errorMessage = result.error || MESSAGES.ERRORS.QUESTION_FAILED;
        setResult(`❌ ${errorMessage}`);
        logger.error('handleQuestion', 'Question failed', result.error);
      }
    } catch (error) {
      logger.error('handleQuestion', 'Question answering failed', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult(`❌ ${MESSAGES.ERRORS.QUESTION_FAILED}\n\nDetails: ${errorMsg}`);
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
            
            {/* Current page info */}
            {currentPageInfo && (
              <div className="page-info" style={{ 
                marginBottom: '12px', 
                padding: '8px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  📄 Current page: {currentPageInfo.title}
                </div>
                <div style={{ color: '#666', wordBreak: 'break-all' }}>
                  🔗 {currentPageInfo.url}
                </div>
                {!config.apiKey && (
                  <div style={{ color: '#d32f2f', marginTop: '4px', fontSize: '11px' }}>
                    ⚠️ API key not configured - go to Settings to configure
                  </div>
                )}
              </div>
            )}
            
            {/* Webpage context toggle */}
            <div className="context-toggle" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={useWebpageContext}
                  onChange={(e) => setUseWebpageContext(e.target.checked)}
                />
                Use current webpage context
              </label>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {useWebpageContext 
                  ? MESSAGES.QA.CONTEXT_ENABLED
                  : MESSAGES.QA.CONTEXT_DISABLED
                }
              </div>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={useWebpageContext 
                ? "Ask a question about this page..." 
                : "Ask any question..."
              }
              rows={3}
            />
            
            {/* Quick question suggestions */}
            {useWebpageContext && (
              <div className="question-suggestions" style={{ marginTop: '8px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Quick questions:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {MESSAGES.QA.SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputText(suggestion)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        border: '1px solid #ddd',
                        borderRadius: '12px',
                        background: '#fff',
                        cursor: 'pointer',
                        color: '#333'
                      }}
                      disabled={isLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
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
            <div className="result-content" style={{ whiteSpace: 'pre-wrap' }}>
              {result}
            </div>
          </div>
        )}
        
        {/* Loading indicator for Q&A */}
        {isLoading && activeTab === 'qa' && (
          <div style={{ 
            padding: '12px', 
            textAlign: 'center', 
            color: '#666',
            fontStyle: 'italic'
          }}>
            {useWebpageContext 
              ? "🔍 Analyzing page content and generating answer..." 
              : "🤔 Thinking about your question..."
            }
          </div>
        )}
      </main>
    </div>
  );
};

export default PopupApp;
