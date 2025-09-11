import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import OptionsApp from './OptionsApp';
import './options.css';

ReactDOM.createRoot(document.getElementById('options-root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <OptionsApp />
    </Provider>
  </React.StrictMode>
);
