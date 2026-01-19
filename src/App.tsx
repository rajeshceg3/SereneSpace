import { Experience } from './scenes/Experience';
import './App.css';
import { useEffect, useState } from 'react';
import { DestinationDetails } from './components/DestinationDetails';
import { useDestinationStore } from './stores/useDestinationStore';
import { Loading } from './components/Loading';
import { ErrorFallback } from './components/ErrorFallback';

function App() {
  const { isLoading, error } = useDestinationStore();
  const [visible, setVisible] = useState(false);
  const [hasWebGL] = useState(() => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  });

  useEffect(() => {
    // Fade in effect after loading is complete
    if (!isLoading && !error) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 100); // Small delay for render
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
    </>
  );
}

export default App;
