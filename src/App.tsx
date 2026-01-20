import { Experience } from './scenes/Experience';
import './App.css';
import { useCallback, useEffect, useState } from 'react';
import { DestinationDetails } from './components/DestinationDetails';
import { HoverHint } from './components/HoverHint';
import { useDestinationStore } from './stores/useDestinationStore';
import { Loading } from './components/Loading';
import { ErrorFallback } from './components/ErrorFallback';
import { ReducedMotionToggle } from './components/ReducedMotionToggle';

function App() {
  const { isLoading, error, destinations, activeDestination, setActiveDestination, setCameraTargetZ } =
    useDestinationStore();
  const [visible, setVisible] = useState(false);
  const [hasWebGL] = useState(() => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (destinations.length === 0) return;

      const currentIndex = destinations.findIndex((d) => d.id === activeDestination);

      let nextIndex = -1;
      if (event.key === 'ArrowRight') {
        nextIndex = currentIndex >= 0 ? (currentIndex + 1) % destinations.length : 0;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex >= 0 ? (currentIndex - 1 + destinations.length) % destinations.length : destinations.length - 1;
      }

      if (nextIndex !== -1) {
        const nextDestination = destinations[nextIndex];
        setActiveDestination(nextDestination.id);
        // Also move the camera to the destination
        setCameraTargetZ(nextDestination.coordinates[2] + 1.5);
      }
    },
    [destinations, activeDestination, setActiveDestination, setCameraTargetZ],
  );

  useEffect(() => {
    // Fade in effect after loading is complete
    if (!isLoading && !error) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 100); // Small delay for render
      return () => clearTimeout(timer);
    }
  }, [isLoading, error]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


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
        style={{
          width: '100%',
          height: '100%',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          backgroundColor: '#000',
        }}
      >
        <Experience />
      </div>
      <DestinationDetails />
      <HoverHint />
      <ReducedMotionToggle />
    </>
  );
}

export default App;
