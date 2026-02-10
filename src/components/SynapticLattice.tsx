import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { latticeOnBeforeCompile } from '../shaders/lattice';

const MAX_INSTANCES = 2000;
const MIN_DISTANCE = 4.0; // Minimum distance between crystals

export const SynapticLattice = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const sessionPath = useTelemetryStore((state) => state.sessionPath);

  // Use refs for mutable buffers to avoid React immutability warnings
  const stressBuffer = useRef(new Float32Array(MAX_INSTANCES));
  const coherenceBuffer = useRef(new Float32Array(MAX_INSTANCES));

  const lastPosition = useRef(new THREE.Vector3(0, 0, 0));
  const instanceCount = useRef(0);
  const lastProcessedLength = useRef(0);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;

    // Helper function inside effect to access closure variables freely
    const addCrystal = (x: number, y: number, z: number, stress: number, coherence: number) => {
        if (!meshRef.current) return;

        const idx = instanceCount.current;

        // Position
        tempObj.position.set(x, y, z);
        // Random rotation
        tempObj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        // Scale based on coherence (higher = larger)
        const scale = 0.5 + (coherence / 100) * 0.5;
        tempObj.scale.setScalar(scale);

        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(idx, tempObj.matrix);

        // Attributes
        stressBuffer.current[idx] = stress;
        coherenceBuffer.current[idx] = coherence || 50;

        // Mark updates
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.geometry.attributes.aStress) {
            (meshRef.current.geometry.attributes.aStress as THREE.InstancedBufferAttribute).needsUpdate = true;
        }
        if (meshRef.current.geometry.attributes.aCoherence) {
            (meshRef.current.geometry.attributes.aCoherence as THREE.InstancedBufferAttribute).needsUpdate = true;
        }

        instanceCount.current++;
        meshRef.current.count = instanceCount.current;
    };

    // Reset if path is empty (new session)
    if (sessionPath.length === 0) {
      instanceCount.current = 0;
      meshRef.current.count = 0;
      lastPosition.current.set(0, 0, 0);
      lastProcessedLength.current = 0;
      return;
    }

    // Iterate through new points only
    for (let i = lastProcessedLength.current; i < sessionPath.length; i++) {
      const p = sessionPath[i];
      const currentPos = new THREE.Vector3(p.x, p.y, p.z);

      if (instanceCount.current === 0) {
        // Always add first point
        addCrystal(p.x, p.y, p.z, p.stress, p.coherence);
        lastPosition.current.copy(currentPos);
      } else {
        const dist = lastPosition.current.distanceTo(currentPos);
        if (dist >= MIN_DISTANCE && instanceCount.current < MAX_INSTANCES) {
          addCrystal(p.x, p.y, p.z, p.stress, p.coherence);
          lastPosition.current.copy(currentPos);
        }
      }
    }

    lastProcessedLength.current = sessionPath.length;
  }, [sessionPath, tempObj]); // tempObj is stable from useMemo

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, MAX_INSTANCES]}
        frustumCulled={false} // Prevent culling issues with displacement
    >
      <dodecahedronGeometry args={[0.3, 0]}>
        <instancedBufferAttribute
            attach="attributes-aStress"
            args={[stressBuffer.current, 1]}
            usage={THREE.DynamicDrawUsage}
        />
        <instancedBufferAttribute
            attach="attributes-aCoherence"
            args={[coherenceBuffer.current, 1]}
            usage={THREE.DynamicDrawUsage}
        />
      </dodecahedronGeometry>
      <meshStandardMaterial
        ref={materialRef}
        transparent
        opacity={0.8}
        roughness={0.1}
        metalness={0.9}
        side={THREE.DoubleSide}
        onBeforeCompile={(shader) => {
            materialRef.current!.userData.shader = shader;
            latticeOnBeforeCompile(shader);
        }}
        customProgramCacheKey={() => 'lattice_v1'}
      />
    </instancedMesh>
  );
};
