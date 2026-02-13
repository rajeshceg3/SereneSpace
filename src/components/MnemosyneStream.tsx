import { useMemo, useRef } from 'react';
import { useFrame, extend, ReactThreeFiber, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { useResonanceStore } from '../stores/useResonanceStore';
import { audioEngine } from '../services/AudioEngine';
import { STREAM_VERTEX_SHADER, STREAM_FRAGMENT_SHADER } from '../shaders/stream';

// Define the Shader Material Class
const StreamMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#4fd1c5'), // Cyan / Teal
    uOpacity: 0.6,
    uSpeed: 0.2,
  },
  STREAM_VERTEX_SHADER,
  STREAM_FRAGMENT_SHADER
);

extend({ StreamMaterial });

// Add type definition for the new JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      streamMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof StreamMaterial>;
    }
  }
}

export const MnemosyneStream = () => {
  const history = useTelemetryStore((state) => state.history);
  const decayStress = useResonanceStore((state) => state.decayStress);
  const { camera } = useThree();

  // We only want the last 5 sessions to avoid clutter
  const recentHistory = useMemo(() => history.slice(-5), [history]);

  const curves = useMemo(() => {
    return recentHistory
      .filter((session) => session.sessionPath && session.sessionPath.length > 2)
      .map((session) => {
        const points: THREE.Vector3[] = [];
        // session.sessionPath is checked above
        if (!session.sessionPath) return null;

        // Sampling logic: take every 5th point to reduce density
        // If path is short, ensure we have points
        const step = Math.max(1, Math.floor(session.sessionPath.length / 50));
        // Or fixed step 5? Fixed step is better for uniform density if recording rate is constant.

        for (let i = 0; i < session.sessionPath.length; i += 5) {
            const p = session.sessionPath[i];
            points.push(new THREE.Vector3(p.x, p.y, p.z));
        }

        if (points.length < 2) return null;
        return new THREE.CatmullRomCurve3(points);
      })
      .filter((curve): curve is THREE.CatmullRomCurve3 => curve !== null);
  }, [recentHistory]);

  const materialsRef = useRef<(THREE.ShaderMaterial | null)[]>([]);

  // Interaction Logic
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // 1. Update Uniforms
    materialsRef.current.forEach((mat) => {
        if (mat) {
            mat.uniforms.uTime.value = time;
        }
    });

    // 2. Proximity Check
    if (curves.length === 0) return;

    let minDistanceSq = Infinity;
    const camPos = camera.position;

    // Check distance to curve control points
    for (const curve of curves) {
        for (const point of curve.points) {
            const distSq = point.distanceToSquared(camPos);
            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
            }
        }
    }

    const minDistance = Math.sqrt(minDistanceSq);

    // 3. Audio Modulation
    // Max volume at distance 0, 0 volume at distance 20
    const maxDist = 20;
    let volume = 0;
    if (minDistance < maxDist) {
        volume = 1.0 - (minDistance / maxDist);
        // Exponential falloff for better feel
        volume = Math.pow(volume, 2);
    }
    // Update Audio Engine (max volume 0.4 for subtlety)
    audioEngine.setMnemosyneVolume(volume * 0.4);

    // 4. Stress Decay (Passive Calm)
    // If very close (< 5), accelerate calm
    if (minDistance < 5) {
        decayStress(0.01); // Extra decay per frame (~0.6 per second @ 60fps)
    }
  });

  if (curves.length === 0) return null;

  return (
    <group>
      {curves.map((curve, index) => (
        <mesh key={`stream-${index}`}>
          {/* Tube with radius 0.2, 64 segments along, 8 radial, not closed */}
          <tubeGeometry args={[curve, 64, 0.2, 8, false]} />
          <streamMaterial
            ref={(el) => (materialsRef.current[index] = el)}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};
