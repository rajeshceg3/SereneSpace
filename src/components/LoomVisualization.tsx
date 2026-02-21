import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';
import type { SpatialPoint } from '../stores/useTelemetryStore';

interface LoomVisualizationProps {
  pathData: SpatialPoint[];
  progress: number; // 0 to 1
}

export const LoomVisualization = ({ pathData, progress }: LoomVisualizationProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create curve from points
  const { curve } = useMemo(() => {
    if (pathData.length < 2) return { curve: null, curvePoints: [] };

    const points = pathData.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(points);
    return { curve, curvePoints: points };
  }, [pathData]);

  // Create geometry and apply vertex colors
  const geometry = useMemo(() => {
    if (!curve) return null;

    // 1. Create Tube Geometry
    // tubularSegments = pathData.length * 4 for smoothness
    // radius = 0.2
    // radialSegments = 8
    // closed = false
    const tubularSegments = Math.max(64, pathData.length * 4);
    const geom = new THREE.TubeGeometry(curve, tubularSegments, 0.2, 8, false);

    // 2. Apply Vertex Colors
    const colors = [];
    const count = geom.attributes.position.count;
    const uvs = geom.attributes.uv;

    for (let i = 0; i < count; i++) {
      // get progress along tube from UV.x
      const t = uvs.getX(i);

      // Find corresponding index in pathData
      // t goes from 0 to 1.
      // index = t * (pathData.length - 1)
      const indexFloat = t * (pathData.length - 1);
      const index = Math.floor(indexFloat);
      const nextIndex = Math.min(pathData.length - 1, index + 1);
      const mix = indexFloat - index;

      // Interpolate coherence
      const c1 = pathData[index]?.coherence ?? 0;
      const c2 = pathData[nextIndex]?.coherence ?? 0;
      const coherence = c1 * (1 - mix) + c2 * mix;

      // Map coherence (0-100) to Color
      // 0 (Low) -> Red (1, 0, 0)
      // 100 (High) -> Blue (0.2, 0.5, 1) or Gold
      // Let's use HSL for a nice gradient: Red (0) -> Yellow -> Green -> Blue (0.6)
      const normalizedCoherence = Math.max(0, Math.min(100, coherence)) / 100;
      const color = new THREE.Color().setHSL(normalizedCoherence * 0.6, 1.0, 0.5);

      colors.push(color.r, color.g, color.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return geom;
  }, [curve, pathData]);

  // Calculate current position for the "Ghost" avatar
  const ghostPosition = useMemo(() => {
    if (!curve) return new THREE.Vector3(0, 0, 0);
    return curve.getPointAt(progress);
  }, [curve, progress]);

  // Determine Ghost Color based on current progress
  const ghostColor = useMemo(() => {
      if (pathData.length < 2) return 'white';
      const indexFloat = progress * (pathData.length - 1);
      const index = Math.floor(indexFloat);
      const coherence = pathData[index]?.coherence ?? 50;
      const normalized = Math.max(0, Math.min(100, coherence)) / 100;
      return new THREE.Color().setHSL(normalized * 0.6, 1.0, 0.5);
  }, [pathData, progress]);

  if (!curve || !geometry) return null;

  return (
    <group>
      {/* The Path Tube */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
            vertexColors
            roughness={0.4}
            metalness={0.6}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
        />
      </mesh>

      {/* The Ghost Avatar */}
      <Sphere args={[0.4, 16, 16]} position={ghostPosition}>
        <meshStandardMaterial
            color={ghostColor}
            emissive={ghostColor}
            emissiveIntensity={1}
        />
        <pointLight intensity={1} distance={5} decay={2} color={ghostColor} />
      </Sphere>
    </group>
  );
};
