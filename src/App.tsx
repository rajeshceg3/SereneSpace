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
import { TelemetryControls } from './components/TelemetryControls';

function App() {
  const { isLoading, error, fetchDestinations } = useDestinationStore();
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
      <SessionDebrief />
      <TelemetryControls />
    </>
  );
}

export default App;
