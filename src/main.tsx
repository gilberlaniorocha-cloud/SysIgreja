import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent "Failed to fetch" unhandled promise rejections from crashing the app
// This commonly happens when Supabase tries to refresh a token or connect to an invalid URL
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message === 'Failed to fetch') {
    event.preventDefault(); // Prevent the error from bubbling up to the AI Studio error boundary
    console.warn('Caught unhandled "Failed to fetch" rejection. This is usually due to invalid Supabase credentials or network issues.');
  }
});

window.addEventListener('error', (event) => {
  if (event.message === 'Failed to fetch' || (event.error && event.error.message === 'Failed to fetch')) {
    event.preventDefault();
    console.warn('Caught uncaught "Failed to fetch" error.');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
