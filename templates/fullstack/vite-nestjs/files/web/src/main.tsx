import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './style.css';
import { initLocale } from './lib/i18n/translator';

initLocale();

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
