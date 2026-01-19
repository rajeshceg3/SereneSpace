import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import { PerspectiveCamera, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

interface Destination {
  id: string;
  name: string;
  coordinates: [number, number, number];
  ambientColor: string;
  description: string;
}

const AmbientScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [targetZ, setTargetZ] = useState(5);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    setDestinations(destinationsData);

    const handleWheel = (event: WheelEvent) => {
      setTargetZ((prev) => Math.max(-25, Math.min(5, prev - event.deltaY * 0.01)));
    };

    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useFrame((state) => {
    if (prefersReducedMotion) return;

    const t = state.clock.getElapsedTime();

    // Smooth camera z movement
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);

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
        {destinations.map((destination) => (
          <Float key={destination.id} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh position={destination.coordinates}>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color={destination.ambientColor} roughness={0.1} metalness={0.1} />
            </mesh>
          </Float>
        ))}
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
