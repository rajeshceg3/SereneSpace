import { Canvas } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { PerspectiveCamera, Environment, Float, Torus } from '@react-three/drei';
import { A11y, useA11y } from '@react-three/a11y';
import * as THREE from 'three';
import { useDestinationStore, type Destination } from '../stores/useDestinationStore';
import {
  CAMERA_INITIAL_Z,
  CAMERA_POSITION_Z_OFFSET,
  FLOAT_INTENSITY,
  FLOAT_ROTATION_INTENSITY,
  FLOAT_SPEED,
} from '../constants';
import { UserInput } from '../components/UserInput';
import { CameraManager } from '../components/CameraManager';
import { FPSMonitor } from '../components/FPSMonitor';

// Component for a single destination object
const DestinationObject = ({ destination }: { destination: Destination }) => {
  const {
    activeDestination,
    setActiveDestination,
    setHoveredDestination,
    setCameraTargetZ,
  } = useDestinationStore();
  const { focus } = useA11y();

  useEffect(() => {
    if (focus) {
      setActiveDestination(destination.id);
      setCameraTargetZ(destination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);
    }
  }, [focus, destination.id, destination.coordinates, setActiveDestination, setCameraTargetZ]);

  const handleDestinationClick = (destination: Destination) => {
    // Set the camera target to be slightly in front of the clicked destination
    setCameraTargetZ(destination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);
  };

  const isFocused = focus || activeDestination === destination.id;

  return (
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
        <torusGeometry args={[0.5, 0.1, 16, 32]} />
        <meshStandardMaterial color={destination.ambientColor} roughness={0.1} metalness={0.1} />
        {isFocused && (
          <Torus args={[0.6, 0.02, 16, 32]} position={[0, 0, 0]}>
            <meshBasicMaterial color="white" />
          </Torus>
        )}
      </mesh>
    </A11y>
  );
};

const AmbientScene = () => {
  const groupRef = useRef<THREE.Group>(null!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { a11y } = useA11y() as any;

  const {
    destinations,
    activeDestination,
    reducedMotion,
  } = useDestinationStore();

  // Announce the active destination to screen readers
  useEffect(() => {
    if (!a11y) return;
    if (activeDestination) {
      const destination = destinations.find((d) => d.id === activeDestination);
      if (destination) {
        a11y.announce(`Now viewing: ${destination.name}. Press Enter to focus.`);
      }
    } else {
      a11y.announce('No destination in focus.');
    }
  }, [activeDestination, destinations, a11y]);

  return (
    <>
      <UserInput />
      <CameraManager groupRef={groupRef} />
      <PerspectiveCamera makeDefault position={[0, 0, CAMERA_INITIAL_Z]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <group ref={groupRef}>
        {destinations.map((destination) => {
          const isFloating = !reducedMotion && destination.id === activeDestination;
          return (
            <group key={destination.id}>
              {isFloating ? (
                <Float
                  speed={FLOAT_SPEED}
                  rotationIntensity={FLOAT_ROTATION_INTENSITY}
                  floatIntensity={FLOAT_INTENSITY}
                >
                  <DestinationObject destination={destination} />
                </Float>
              ) : (
                <DestinationObject destination={destination} />
              )}
            </group>
          );
        })}
      </group>

      <Environment preset="city" />
    </>
  );
};

export const Experience = () => {
  return (
    <Canvas>
      <FPSMonitor />
      <A11y
        role="content"
        description="An immersive 3D travel experience. Use arrow keys or scroll to navigate between destinations."
      >
        <AmbientScene />
      </A11y>
    </Canvas>
  );
};
