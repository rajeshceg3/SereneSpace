import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePredictionStore } from '../stores/usePredictionStore';
import { useResonanceStore } from '../stores/useResonanceStore';

const CONE_LENGTH = 30; // Visualizing 30 meters/seconds ahead

export const ForecastCone = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const { camera } = useThree();

  const prediction = usePredictionStore(); // velocity, confidence, projectedStress
  const currentStress = useResonanceStore((state) => state.currentStress);

  // Reusable objects
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const axisX = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const color = useMemo(() => new THREE.Color(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const rotation = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // 1. Follow Camera
    const offset = 2; // Start 2 units in front

    // Get camera forward direction
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);

    // Position: Camera + (Forward * (Offset + Length/2))
    targetPos.copy(camera.position).add(forward.multiplyScalar(offset + CONE_LENGTH / 2));

    meshRef.current.position.lerp(targetPos, delta * 5); // Smooth follow

    // Orientation: Match Camera, then rotate -90 deg around X to align Y-up cylinder to -Z forward
    targetQuat.copy(camera.quaternion);
    rotation.setFromAxisAngle(axisX, -Math.PI / 2);
    targetQuat.multiply(rotation);

    meshRef.current.quaternion.slerp(targetQuat, delta * 5); // Smooth rotation

    // 2. Visuals based on Prediction
    // Uncertainty determines opacity (Low confidence = very transparent/ghostly)
    // Stress determines Color (Blue -> Red)

    // Color
    // Calculate 30s projection
    const projected30s = Math.max(0, Math.min(1, currentStress + (prediction.stressVelocity * 30)));

    // 0.6 = Blue (Low Stress), 0.0 = Red (High Stress)
    const hue = 0.6 - (projected30s * 0.6);
    color.setHSL(hue, 1, 0.5);
    materialRef.current.color.lerp(color, delta * 2);

    // Opacity
    // Only show if confidence > 0.3
    // Max opacity 0.3 for subtlety
    const targetOpacity = prediction.confidence > 0.3 ? prediction.confidence * 0.3 : 0;
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, delta * 2);

    // Scale (Uncertainty Width)
    // Low confidence -> Wider cone
    const uncertainty = Math.max(0, 1 - prediction.confidence);
    const scale = 1 + (uncertainty * 2);
    meshRef.current.scale.set(scale, 1, scale); // Scale X and Z (width), keep Y (length) fixed
  });

  return (
    <mesh ref={meshRef}>
      {/* radiusTop=2 (far end), radiusBottom=0.1 (near camera), height=30 */}
      <cylinderGeometry args={[2, 0.1, CONE_LENGTH, 16, 1, true]} />
      <meshStandardMaterial
        ref={materialRef}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        roughness={0.4}
        metalness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
