import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import Fallback from './components/Fallback.tsx';
import { isWebGLSupported } from './utils/webglDetector.ts';
import { analytics } from './services/AnalyticsService';

const rootElement = document.getElementById('root')!;

// HMR safe root creation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let root = (rootElement as any)._reactRoot;

if (!root) {
  root = createRoot(rootElement);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rootElement as any)._reactRoot = root;
}

analytics.init();
analytics.track('Session Started');

if (isWebGLSupported()) {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <Fallback />
    </StrictMode>
  );
}
