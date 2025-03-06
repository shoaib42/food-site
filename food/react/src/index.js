import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SelectionProvider } from './SelectionProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SelectionProvider>
      <App />
    </SelectionProvider>
  </React.StrictMode>
);
