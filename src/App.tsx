import { Experience } from './scenes/Experience';
import './App.css';
import { useEffect, useState } from 'react';
import { DestinationDetails } from './components/DestinationDetails';
import { useDestinationStore } from './stores/useDestinationStore';

function App() {
  const [visible, setVisible] = useState(false);
  const [hasWebGL] = useState(() => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  });
  const fetchDestinations = useDestinationStore((state) => state.fetchDestinations);

  useEffect(() => {
    // Fetch destinations when the app mounts
    fetchDestinations();

    // Start fade in after mount
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100); // Small delay to ensure render
    return () => clearTimeout(timer);
  }, [fetchDestinations]);

  if (!hasWebGL) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backgroundColor: '#000' }}>
        <p>Your device does not support WebGL. Please try a different device.</p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100%',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
          backgroundColor: '#000'
        }}
      >
        <Experience />
      </div>
      <DestinationDetails />
    </>
  );
}

export default App;
