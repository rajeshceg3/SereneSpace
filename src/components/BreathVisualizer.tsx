import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRespirationStore } from '../stores/useRespirationStore';
import { RespirationController } from '../services/RespirationController';

export const BreathVisualizer = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const isActive = useRespirationStore((state) => state.isActive);

  useFrame(() => {
    if (!meshRef.current) return;

    if (!isActive) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;
    const breathValue = RespirationController.getValue(); // 0.0 to 1.0

    // Pulse Logic
    // Scale: 1.0 -> 2.0
    const scale = 1.0 + (breathValue * 1.0);
    meshRef.current.scale.setScalar(scale);

    // Opacity: 0.1 -> 0.6
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    if (material) {
      material.opacity = 0.1 + (breathValue * 0.5);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 2]}>
      <ringGeometry args={[0.3, 0.35, 64]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
