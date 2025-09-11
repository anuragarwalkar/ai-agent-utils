import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../store';
import PopupApp from './PopupApp';
import './popup.css';

ReactDOM.createRoot(document.getElementById('popup-root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PopupApp />
    </Provider>
  </React.StrictMode>
);
