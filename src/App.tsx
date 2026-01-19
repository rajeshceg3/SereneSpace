import { Experience } from './scenes/Experience';
import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [visible, setVisible] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setHasWebGL(false);
    }

    // Start fade in after mount
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100); // Small delay to ensure render
    return () => clearTimeout(timer);
  }, []);

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
    </>
  );
}

export default App;
