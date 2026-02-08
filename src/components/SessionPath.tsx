import { useEffect, useState, useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetryStore } from '../stores/useTelemetryStore';

export const SessionPath = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sessionPath = useTelemetryStore((state) => state.sessionPath);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with 'O' (Oracle) - also toggles ForecastCone visually?
      // No, ForecastCone is always there but subtle.
      // This is the "Breadcrumbs" toggle.
      if (e.code === 'KeyO' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsVisible((prev) => !prev);
        console.log('[ORACLE] Path Visualization Toggled');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { points, colors } = useMemo(() => {
    if (!sessionPath || sessionPath.length < 2) return { points: [], colors: [] };

    // Optimize: If huge, maybe downsample? For now, render all.
    const pts: [number, number, number][] = [];
    const cols: [number, number, number][] = []; // Need to be same length as points? Line supports vertexColors.
    // Drei Line vertexColors expects array of [r,g,b] or THREE.Color or string

    const colorHelper = new THREE.Color();

    sessionPath.forEach((p) => {
      pts.push([p.x, p.y, p.z]);

      // Map stress to color (Blue -> Red)
      // 0.6 = Blue, 0.0 = Red
      const hue = 0.6 - (p.stress * 0.6);
      colorHelper.setHSL(hue, 1, 0.5);
      cols.push([colorHelper.r, colorHelper.g, colorHelper.b]);
    });

    return { points: pts, colors: cols };
  }, [sessionPath]); // Re-computes on every update (5Hz)

  if (!isVisible || points.length < 2) return null;

  return (
    <group>
      <Line
        points={points}
        color="white" // Fallback
        vertexColors={colors}
        lineWidth={2}
        dashed={false}
        transparent
        opacity={0.6}
      />
      {/* Start Marker */}
      <mesh position={points[0]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color="#44ff44" />
      </mesh>
    </group>
  );
};
