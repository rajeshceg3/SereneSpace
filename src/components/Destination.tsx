import { useEffect } from 'react';
import { Torus, Icosahedron, TorusKnot } from '@react-three/drei';
import { A11y, useA11y } from '@react-three/a11y';
import { useDestinationStore } from './../stores/useDestinationStore';
import type { Destination as DestinationType } from '../types';
import { useBloomStore } from './../stores/useBloomStore';
import { CAMERA_POSITION_Z_OFFSET } from '../constants';

// Component for a single destination object
// Displays the destination geometry, changing to a complex shape when bloomed.
export const Destination = ({ destination }: { destination: DestinationType }) => {
  const {
    activeDestination,
    setActiveDestination,
    setHoveredDestination,
    setCameraTargetZ,
  } = useDestinationStore();
  const { bloomedDestinations } = useBloomStore();
  const { focus } = useA11y();

  const hasBloomed = bloomedDestinations[destination.id];

  useEffect(() => {
    if (focus) {
      setActiveDestination(destination.id);
      setCameraTargetZ(destination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);
    }
  }, [focus, destination.id, destination.coordinates, setActiveDestination, setCameraTargetZ]);

  const handleDestinationClick = (destination: DestinationType) => {
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
        {hasBloomed ? (
          <TorusKnot args={[0.5, 0.1, 128, 16]}>
            <meshStandardMaterial color={destination.ambientColor} roughness={0.1} metalness={0.8} />
          </TorusKnot>
        ) : (
          <Icosahedron args={[0.5, 0]}>
            <meshStandardMaterial color={destination.ambientColor} roughness={0.8} metalness={0.1} />
          </Icosahedron>
        )}
        {isFocused && (
          <Torus args={[0.6, 0.02, 16, 32]} position={[0, 0, 0]}>
            <meshBasicMaterial color="white" />
          </Torus>
        )}
      </mesh>
    </A11y>
  );
};
