import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTelemetryStore, SessionSummary } from '../stores/useTelemetryStore';

const Shard = ({ session, index, total }: { session: SessionSummary; index: number; total: number }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Procedural Geometry Parameters based on session data
  const basePosition = useMemo(() => {
    const angle = index * 0.8; // Golden angle approx
    const radius = 2 + (index * 0.2);
    const y = (index * 0.3) - (total * 0.15); // Center vertically roughly
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  }, [index, total]);

  const position = useMemo(() => [basePosition.x, basePosition.y, basePosition.z] as [number, number, number], [basePosition]);

  const color = useMemo(() => {
    const score = session.coherenceScore;
    const color = new THREE.Color();
    if (score >= 80) color.setHex(0xffd700); // Gold
    else if (score >= 50) color.setHex(0x00ffff); // Cyan
    else color.setHex(0x888888); // Grey
    return color;
  }, [session.coherenceScore]);

  const scale = useMemo(() => {
    const height = Math.max(0.2, Math.min(session.duration / 60, 3)); // Max 3 units tall
    return [0.2, height, 0.2] as [number, number, number];
  }, [session.duration]);

  // Gentle float animation per shard
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = basePosition.y + Math.sin(t + index) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <cylinderGeometry args={[0.05, 0.1, 1, 4]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        transparent
        opacity={0.8}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
};

export const MnemonicProjector = () => {
  const history = useTelemetryStore((state) => state.history);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  if (!history || history.length === 0) return null;

  // Limit visualization to last 50 sessions to preserve performance/aesthetics
  const visibleHistory = history.slice(-50);

  return (
    <group ref={groupRef}>
      {visibleHistory.map((session, i) => (
        <Shard
          key={session.id}
          session={session}
          index={i}
          total={visibleHistory.length}
        />
      ))}
    </group>
  );
};
