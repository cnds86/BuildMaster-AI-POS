import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GlobalProvider } from '../context/GlobalContext';
import { ToastProvider } from '../components/toast/ToastContext';
import { ConfirmProvider } from '@/components/common/Confirm';
import { ErrorBoundary } from '../components/ux/ErrorBoundary';
import './styles/tokens.css';
import './styles/utilities.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GlobalProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </GlobalProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);