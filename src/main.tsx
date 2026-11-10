import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { FirebaseProvider } from './context/FirebaseContext.tsx';
import './index.css';

// Guard against Vite client attempting WebSocket .send() when HMR is disabled in preview environments
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes("Cannot read properties of undefined (reading 'send')") ||
      (typeof event.filename === 'string' && event.filename.includes('@vite/client'))
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes("Cannot read properties of undefined (reading 'send')") ||
      (typeof event.reason?.stack === 'string' && event.reason.stack.includes('@vite/client'))
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </ThemeProvider>
);

