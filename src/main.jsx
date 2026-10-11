import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

// Preserve bookmarks shared before the migration from hash-based URLs.
if (window.location.hash.startsWith('#/')) {
  const path = window.location.hash.slice(1).replace(/^\/+/, '/');
  window.history.replaceState(null, '', path);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
