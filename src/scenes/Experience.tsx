import { Canvas } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { PerspectiveCamera, Environment, Float } from '@react-three/drei';
import { A11y, useA11y } from '@react-three/a11y';
import * as THREE from 'three';
import { useDestinationStore } from '../stores/useDestinationStore';
import {
  CAMERA_INITIAL_Z,
  FLOAT_INTENSITY,
  FLOAT_ROTATION_INTENSITY,
  FLOAT_SPEED,
} from '../constants';
import { UserInput } from '../components/UserInput';
import { ResonanceSystem } from '../components/ResonanceSystem';
import { SentinelSystem } from '../components/SentinelSystem';
import { CameraManager } from '../components/CameraManager';
import { FPSMonitor } from '../components/FPSMonitor';
import { Atmosphere } from '../components/Atmosphere';
import { BloomSystem } from '../components/BloomSystem';
import { Destination } from '../components/Destination';
import { MnemonicProjector } from '../components/MnemonicProjector';
import { EntrainmentSystem } from '../components/EntrainmentSystem';
import { EntrainmentField } from '../components/EntrainmentField';

const AmbientScene = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const { a11y } = useA11y() as unknown as { a11y: { announce: (msg: string) => void } };

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
      <ResonanceSystem />
      <SentinelSystem />
      <BloomSystem />
      <EntrainmentSystem />
      <EntrainmentField />
      <CameraManager groupRef={groupRef} />
      <PerspectiveCamera makeDefault position={[0, 0, CAMERA_INITIAL_Z]} />
      <Atmosphere />

      <group position={[0, -2, 0]}>
        <MnemonicProjector />
      </group>

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
                  <Destination destination={destination} />
                </Float>
              ) : (
                <Destination destination={destination} />
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
