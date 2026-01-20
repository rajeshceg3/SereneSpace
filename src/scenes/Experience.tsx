import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { PerspectiveCamera, Environment, Float, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { useDestinationStore, type Destination } from '../stores/useDestinationStore';

// Threshold for how close the camera needs to be to a destination to make it "active"
const FOCUS_THRESHOLD = 2.5;

const AmbientScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Get state and actions from the Zustand store
  const {
    destinations,
    setActiveDestination,
    activeDestination,
    setHoveredDestination,
    cameraTargetZ,
    setCameraTargetZ,
    reducedMotion,
  } = useDestinationStore();

  useEffect(() => {
    // Scroll handling to move the camera
    const handleWheel = (event: WheelEvent) => {
      setCameraTargetZ(Math.max(-25, Math.min(5, cameraTargetZ - event.deltaY * 0.01)));
    };

    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [cameraTargetZ, setCameraTargetZ]);

  const handleDestinationClick = (destination: Destination) => {
    // Set the camera target to be slightly in front of the clicked destination
    setCameraTargetZ(destination.coordinates[2] + 1.5);
  };

  useFrame((state) => {
    // Smooth camera Z movement
    if (reducedMotion) {
      camera.position.z = cameraTargetZ;
    } else {
      // eslint-disable-next-line
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraTargetZ, 0.05);
    }

    // Find the closest destination and set it as active
    let closestDist = Infinity;
    let closestDest: Destination | null = null;

    for (const dest of destinations) {
      const dist = camera.position.distanceTo(new THREE.Vector3(...dest.coordinates));
      if (dist < closestDist) {
        closestDist = dist;
        closestDest = dest;
      }
    }

    if (closestDest && closestDist < FOCUS_THRESHOLD) {
      // Avoids setting state on every frame if it's already active
      if (activeDestination !== closestDest.id) {
        setActiveDestination(closestDest.id);
      }
    } else {
      // If nothing is in focus, clear the active destination
      if (activeDestination !== null) {
        setActiveDestination(null);
      }
    }

    // --- Ambient motion (if not reduced) ---
    if (reducedMotion) return;

    const t = state.clock.getElapsedTime();

    // Slow object rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;
    }

    // Camera breathing effect
    const breathingX = Math.sin(t * 0.2) * 0.2;
    const breathingY = Math.cos(t * 0.2) * 0.2;

    // Mouse parallax
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
          <Float key={destination.id} speed={reducedMotion ? 0 : 2} rotationIntensity={reducedMotion ? 0 : 0.5} floatIntensity={reducedMotion ? 0 : 0.5}>
            <mesh
              position={destination.coordinates}
              onClick={() => handleDestinationClick(destination)}
              onPointerOver={() => setHoveredDestination(destination.id)}
              onPointerOut={() => setHoveredDestination(null)}
            >
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color={destination.ambientColor} roughness={0.1} metalness={0.1} />
              {activeDestination === destination.id && (
                <Torus args={[0.6, 0.02, 16, 100]} position={[0, 0, 0]}>
                  <meshBasicMaterial color="white" />
                </Torus>
              )}
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
