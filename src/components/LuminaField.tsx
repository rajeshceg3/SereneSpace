import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useEntrainmentStore } from '../stores/useEntrainmentStore';
import { RespirationController } from '../services/RespirationController';
import { luminaVertexShader, luminaFragmentShader } from '../shaders/lumina';

const PARTICLE_COUNT = 2000;

export const LuminaField = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Connect to stores
  const currentStress = useResonanceStore((state) => state.currentStress);
  const currentPulse = useEntrainmentStore((state) => state.currentPulse);

  // Uniforms ref to avoid recreation
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uStress: { value: 0 },
    uBreath: { value: 0 },
    uPulse: { value: 0 },
  }), []);

  // Initialize particles
  const [{ initialPositions, randoms, sizes }] = useState(() => {
    const tempPositions = new Float32Array(PARTICLE_COUNT * 3);
    const tempRandoms = new Float32Array(PARTICLE_COUNT);
    const tempSizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles in a cloud around the camera path
      // Range: X: -10 to 10, Y: -5 to 5, Z: -10 to 5
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 15 - 2; // Bias slightly forward/back

      tempPositions[i * 3] = x;
      tempPositions[i * 3 + 1] = y;
      tempPositions[i * 3 + 2] = z;

      tempRandoms[i] = Math.random();
      tempSizes[i] = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    }

    return { initialPositions: tempPositions, randoms: tempRandoms, sizes: tempSizes };
  });

  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      dummy.position.set(
        initialPositions[i * 3],
        initialPositions[i * 3 + 1],
        initialPositions[i * 3 + 2]
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [initialPositions]);

  useFrame((state) => {
    if (!materialRef.current) return;

    // Update Time
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Smoothly interpolate Stress (Store value might jump, but we want smooth visual)
    // Actually, store value changes gradually usually, but let's just pass it.
    // We can add a simple lerp here if needed, but the store handles decay/add.
    // Using a lerp for visual smoothness is safer.
    const targetStress = currentStress;
    materialRef.current.uniforms.uStress.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uStress.value,
      targetStress,
      0.05
    );

    // Update Breath from Controller
    const breathValue = RespirationController.getValue(); // 0 to 1
    materialRef.current.uniforms.uBreath.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uBreath.value,
      breathValue,
      0.1
    );

    // Update Pulse
    materialRef.current.uniforms.uPulse.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uPulse.value,
      currentPulse,
      0.1
    );
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false} // Always render as they are around us
    >
      <planeGeometry args={[0.1, 0.1]}>
        <instancedBufferAttribute
          attach="attributes-aRandom"
          args={[randoms, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={luminaVertexShader}
        fragmentShader={luminaFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};
