import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useCallback } from 'react';
import { PerspectiveCamera, Environment, Float, Torus } from '@react-three/drei';
import { A11y, useA11y } from '@react-three/a11y';
import * as THREE from 'three';
import { useDestinationStore, type Destination } from '../stores/useDestinationStore';
import {
  CAMERA_INITIAL_Z,
  CAMERA_LERP_FACTOR,
  CAMERA_POSITION_Z_OFFSET,
  CAMERA_TARGET_Z_MAX,
  CAMERA_TARGET_Z_MIN,
  FOCUS_THRESHOLD,
  GROUP_ROTATION_X_FACTOR,
  GROUP_ROTATION_Y_FACTOR,
  BREATHING_X_FACTOR,
  BREATHING_Y_FACTOR,
  PARALLAX_X_FACTOR,
  PARALLAX_Y_FACTOR,
  FLOAT_INTENSITY,
  FLOAT_ROTATION_INTENSITY,
  FLOAT_SPEED,
  SCROLL_SENSITIVITY,
} from '../constants';

const AmbientScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { a11y } = useA11y();

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

  // Announce the active destination to screen readers
  useEffect(() => {
    if (activeDestination) {
      const destination = destinations.find((d) => d.id === activeDestination);
      if (destination) {
        a11y.announce(`Now viewing: ${destination.name}. Press Enter to focus.`);
      }
    } else {
      a11y.announce('No destination in focus.');
    }
  }, [activeDestination, destinations, a11y]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      const newTargetZ = cameraTargetZ - event.deltaY * SCROLL_SENSITIVITY;
      setCameraTargetZ(Math.max(CAMERA_TARGET_Z_MIN, Math.min(CAMERA_TARGET_Z_MAX, newTargetZ)));
    },
    [cameraTargetZ, setCameraTargetZ],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (destinations.length === 0) return;

      const currentIndex = destinations.findIndex((d) => d.id === activeDestination);

      let nextIndex = -1;
      if (event.key === 'ArrowRight' || event.key === 'Tab') {
        nextIndex = currentIndex >= 0 ? (currentIndex + 1) % destinations.length : 0;
      } else if (event.key === 'ArrowLeft') {
        nextIndex =
          currentIndex >= 0 ? (currentIndex - 1 + destinations.length) % destinations.length : destinations.length - 1;
      }

      if (nextIndex !== -1) {
        event.preventDefault(); // Prevent default browser action for Tab
        const nextDestination = destinations[nextIndex];
        setActiveDestination(nextDestination.id);
        setCameraTargetZ(nextDestination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);
      }
    },
    [destinations, activeDestination, setActiveDestination, setCameraTargetZ],
  );

  useEffect(() => {
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleKeyDown]);

  const handleDestinationClick = (destination: Destination) => {
    // Set the camera target to be slightly in front of the clicked destination
    setCameraTargetZ(destination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);
  };

  useFrame((state) => {
    // Smooth camera Z movement
    if (reducedMotion) {
      camera.position.z = cameraTargetZ;
    } else {
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraTargetZ, CAMERA_LERP_FACTOR);
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
      groupRef.current.rotation.y = t * GROUP_ROTATION_Y_FACTOR;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * GROUP_ROTATION_X_FACTOR;
    }

    // Camera breathing effect
    const breathingX = Math.sin(t * 0.2) * BREATHING_X_FACTOR;
    const breathingY = Math.cos(t * 0.2) * BREATHING_Y_FACTOR;

    // Mouse parallax
    const parallaxX = state.pointer.x * PARALLAX_X_FACTOR;
    const parallaxY = state.pointer.y * PARALLAX_Y_FACTOR;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, breathingX + parallaxX, CAMERA_LERP_FACTOR);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, breathingY + parallaxY, CAMERA_LERP_FACTOR);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, CAMERA_INITIAL_Z]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <group ref={groupRef}>
        {destinations.map((destination) => (
          <Float
            key={destination.id}
            speed={reducedMotion ? 0 : FLOAT_SPEED}
            rotationIntensity={reducedMotion ? 0 : FLOAT_ROTATION_INTENSITY}
            floatIntensity={reducedMotion ? 0 : FLOAT_INTENSITY}
          >
            <A11y
              role="button"
              description={`Destination: ${destination.name}`}
              actionCall={() => handleDestinationClick(destination)}
            >
              <mesh
                position={destination.coordinates}
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
            </A11y>
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
      <A11y
        role="application"
        description="An immersive 3D travel experience. Use arrow keys or scroll to navigate between destinations."
      >
        <AmbientScene />
      </A11y>
    </Canvas>
  );
};
