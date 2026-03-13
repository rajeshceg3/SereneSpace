import { useEffect, useRef } from 'react';
import { Torus, Icosahedron, TorusKnot, Octahedron, Sphere } from '@react-three/drei';
import { A11y, useA11y } from '@react-three/a11y';
import { useFrame } from '@react-three/fiber';
import { useDestinationStore } from './../stores/useDestinationStore';
import { useResonanceStore } from './../stores/useResonanceStore';
import type { Destination as DestinationType } from '../types';
import { useBloomStore } from './../stores/useBloomStore';
import { CAMERA_POSITION_Z_OFFSET } from '../constants';
import { Mesh } from 'three';
import { audioEngine } from '../services/AudioEngine';

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
  const meshRef = useRef<Mesh>(null!);

  const hasBloomed = bloomedDestinations[destination.id];

  // Initialize Spatial Audio
  useEffect(() => {
    // Create positional audio source for this destination
    audioEngine.createPositionalSource(
      destination.id,
      destination.coordinates[0],
      destination.coordinates[1],
      destination.coordinates[2]
    );

    return () => {
      audioEngine.removePositionalSource(destination.id);
    };
  }, [destination.id, destination.coordinates]);

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

  // Feature 19: Biome-specific visualization properties
  const biome = destination.biome || 'ZENITH';
  const intensity = destination.intensity || 0.5;

  const getMaterialProps = () => {
    switch (biome) {
      case 'SANCTUARY': return { roughness: 0.2, metalness: 0.1 }; // Glassy, calm
      case 'NEXUS': return { roughness: 0.4, metalness: 0.9 }; // Metallic, shiny
      case 'VOID': return { roughness: 0.9, metalness: 0.0 }; // Matte, dark
      case 'ZENITH': return { roughness: 0.6, metalness: 0.3 }; // Balanced
      default: return { roughness: 0.8, metalness: 0.1 };
    }
  };

  const materialProps = getMaterialProps();

  useFrame(({ clock }) => {
    if (meshRef.current && isFocused) {
      const stress = useResonanceStore.getState().currentStress;
      // Pulse depends on intensity + stress
      // Slower for calm biomes, faster for intense ones
      const baseFreq = intensity < 0.3 ? 1.0 : 2.0;
      const pulseFrequency = baseFreq + (intensity * 0.5);
      const pulseAmplitude = 0.05 + (stress * 0.1) + (intensity * 0.05);

      const scale = 1 + Math.sin(clock.getElapsedTime() * pulseFrequency) * pulseAmplitude;
      meshRef.current.scale.set(scale, scale, scale);
    } else if (meshRef.current) {
      // Reset scale when not focused
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <A11y
      role="button"
      description={`Destination: ${destination.name}`}
      actionCall={() => handleDestinationClick(destination)}
    >
      <mesh
        ref={meshRef}
        position={destination.coordinates}
        onClick={() => handleDestinationClick(destination)}
        onPointerOver={() => setHoveredDestination(destination.id)}
        onPointerOut={() => setHoveredDestination(null)}
      >
        {hasBloomed ? (
          <TorusKnot args={[0.5, 0.1, 128, 16]}>
            <meshStandardMaterial color={destination.ambientColor} roughness={0.1} metalness={0.8} />
          </TorusKnot>
        ) : (
          <>
            {(!destination.shape || destination.shape === 'icosahedron') && (
              <Icosahedron args={[0.5, 0]}>
                <meshStandardMaterial color={destination.ambientColor} {...materialProps} />
              </Icosahedron>
            )}
            {destination.shape === 'octahedron' && (
              <Octahedron args={[0.5, 0]}>
                <meshStandardMaterial color={destination.ambientColor} {...materialProps} />
              </Octahedron>
            )}
            {destination.shape === 'sphere' && (
              <Sphere args={[0.5, 32, 32]}>
                <meshStandardMaterial color={destination.ambientColor} {...materialProps} />
              </Sphere>
            )}
            {destination.shape === 'torus' && (
              <Torus args={[0.4, 0.15, 16, 32]}>
                <meshStandardMaterial color={destination.ambientColor} {...materialProps} />
              </Torus>
            )}
          </>
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
