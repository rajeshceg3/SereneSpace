import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { PerspectiveCamera, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const AmbientScene = () => {
  const groupRef = useRef<THREE.Group>(null);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useFrame((state) => {
    if (prefersReducedMotion) return;

    const t = state.clock.getElapsedTime();

    // Slow object rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;
    }

    // Light shift (simulating by moving a light or changing intensity?
    // Let's just move the camera slightly for "breathing" effect + parallax)

    // Automatic ambient breathing
    const breathingX = Math.sin(t * 0.2) * 0.2;
    const breathingY = Math.cos(t * 0.2) * 0.2;

    // Mouse parallax (simple version)
    // state.pointer.x is -1 to 1
    const parallaxX = state.pointer.x * 0.5;
    const parallaxY = state.pointer.y * 0.5;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, breathingX + parallaxX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, breathingY + parallaxY, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <group ref={groupRef}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[-1, 0, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#88ccff" roughness={0.1} metalness={0.1} />
          </mesh>
        </Float>

        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[1, 0.5, -1]}>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial color="#ffcc88" roughness={0.1} metalness={0.1} />
          </mesh>
        </Float>

        <Float speed={3} rotationIntensity={1} floatIntensity={1}>
           <mesh position={[0, -1, 0.5]}>
            <dodecahedronGeometry args={[0.4]} />
            <meshStandardMaterial color="#cc88ff" roughness={0.1} metalness={0.1} />
          </mesh>
        </Float>
      </group>

      <Environment preset="city" />
    </>
  );
};

export const Experience = () => {
  return (
    <Canvas>
      <AmbientScene />
    </Canvas>
  );
};
