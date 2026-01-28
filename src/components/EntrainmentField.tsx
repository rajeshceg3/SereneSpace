import { useThree, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useEntrainmentStore } from '../stores/useEntrainmentStore';

export const EntrainmentField = () => {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh) {
      camera.add(mesh);
    }
    return () => {
      if (mesh) {
        camera.remove(mesh);
      }
    };
  }, [camera]);

  useFrame(() => {
    const { currentPulse, intensity, isActive } = useEntrainmentStore.getState();
    if (materialRef.current) {
      // Visualize pulse as subtle opacity change
      // Blending Additive makes it a light "glow"
      materialRef.current.opacity = isActive ? (currentPulse * intensity) : 0;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1.5]}>
      {/* Moved to -1.5 to ensure it's outside near clip if near is large,
          and cover sufficient FOV. Plane size increased to 5x5 to be safe. */}
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
