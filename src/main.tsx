import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import Fallback from './components/Fallback.tsx';
import { isWebGLSupported } from './utils/webglDetector.ts';

const rootElement = document.getElementById('root')!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(rootElement as any)._reactRootContainer) {
  const root = createRoot(rootElement);
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
}
