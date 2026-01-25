import { Experience } from './scenes/Experience';
import './App.css';
import { useEffect, useState } from 'react';
import { DestinationDetails } from './components/DestinationDetails';
import { HoverHint } from './components/HoverHint';
import { useDestinationStore } from './stores/useDestinationStore';
import { Loading } from './components/Loading';
import { ErrorFallback } from './components/ErrorFallback';
import { FADE_IN_DELAY, FADE_IN_DURATION } from './constants';
import { isWebGLSupported } from './utils/webglDetector';
import { TelemetryRecorder } from './components/TelemetryRecorder';
import { SessionDebrief } from './components/SessionDebrief';
import { useTelemetryStore } from './stores/useTelemetryStore';
import { SentinelSystem } from './components/SentinelSystem';

function App() {
  const { isLoading, error, fetchDestinations } = useDestinationStore();
  const setDebriefOpen = useTelemetryStore((state) => state.setDebriefOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);
  const [hasWebGL] = useState(isWebGLSupported);

  useEffect(() => {
    // Fade in effect after loading is complete
    if (!isLoading && !error) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, FADE_IN_DELAY); // Small delay for render
      return () => clearTimeout(timer);
    }
  }, [isLoading, error]);

  if (!hasWebGL) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backgroundColor: '#000' }}>
        <p>Your device does not support WebGL. Please try a different device.</p>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorFallback message={error} />;
  }

  return (
    <>
      <div
        data-testid="app-container"
        style={{
          width: '100%',
          height: '100%',
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_IN_DURATION}ms ease-in-out`,
          backgroundColor: '#000',
        }}
      >
        <Experience />
      </div>
      <DestinationDetails />
      <HoverHint />

      <TelemetryRecorder />
      <SentinelSystem />
      <SessionDebrief />

      <button
        onClick={() => setDebriefOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 50,
          backgroundColor: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'rgba(255, 255, 255, 0.7)',
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: '12px',
          cursor: 'pointer',
          borderRadius: '2px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#00ffcc';
          e.currentTarget.style.color = '#00ffcc';
          e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 204, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        Signal Telemetry
      </button>
    </>
  );
}

export default App;
