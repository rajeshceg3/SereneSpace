import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export const FPSMonitor = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
    lastTime.current = performance.now();
  }, []);

  useFrame(() => {
    frameCount.current++;
    const time = performance.now();
    if (time >= lastTime.current + 1000) {
      setFps(Math.round((frameCount.current * 1000) / (time - lastTime.current)));
      frameCount.current = 0;
      lastTime.current = time;
    }
  });

  return (
    <Html position={[-1, 1, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          color: fps < 50 ? 'red' : 'green',
          fontFamily: 'monospace',
          fontSize: '12px',
          background: 'rgba(0,0,0,0.5)',
          padding: '4px',
          borderRadius: '4px',
          zIndex: 9999,
        }}
      >
        FPS: {fps}
      </div>
    </Html>
  );
};
