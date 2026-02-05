import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useRespirationStore } from '../stores/useRespirationStore';
import { RespirationController } from '../services/RespirationController';
import { NOISE_GLSL } from '../shaders/noise';

const INSTANCE_COUNT = 1500;
const TERRAIN_SIZE = 200;
const HALF_SIZE = TERRAIN_SIZE / 2;

export const VerdantFlora = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaderRef = useRef<any>(null!);
  const { camera } = useThree();

  // Track dummy objects for matrix updates using a ref to avoid recreating it
  const dummyRef = useRef(new THREE.Object3D());

  // Use a ref for the Float32Array to keep it mutable but persistent
  const positionsRef = useRef<Float32Array>(null!);

  const geometry = useMemo(() => {
    // 1. Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.02, 0.04, 0.5, 5);
    trunkGeo.translate(0, 0.25, 0); // Base at 0

    // 2. Foliage (Low poly cone)
    const foliageGeo = new THREE.ConeGeometry(0.2, 0.8, 5);
    foliageGeo.translate(0, 0.8, 0); // Sit on top of trunk roughly

    // 3. Merge
    const merged = BufferGeometryUtils.mergeGeometries([trunkGeo, foliageGeo]);

    // Cleanup
    trunkGeo.dispose();
    foliageGeo.dispose();

    return merged;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#2d5a27', // Dark green base
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uStress = { value: 0 };
      shader.uniforms.uBreath = { value: 0 };

      shaderRef.current = shader;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uStress;
        uniform float uBreath;
        ${NOISE_GLSL}
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Get Instance World Position (assuming mesh is at 0,0,0)
        // instanceMatrix column 3 is position
        vec3 instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

        float worldX = instPos.x;
        float worldZ = instPos.z;

        // --- Height Calculation (Must match FractalLandscape) ---
        float noiseScale = 0.05;
        float timeScale = 0.2;

        float elevation = snoise(vec3(worldX * noiseScale, worldZ * noiseScale, uTime * timeScale));

        float stressNoise = snoise(vec3(worldX * noiseScale * 4.0, worldZ * noiseScale * 4.0, uTime * timeScale * 2.0));
        float jaggedness = uStress * 3.0;

        elevation += stressNoise * jaggedness;
        elevation *= (1.0 + uBreath * 0.5);

        // Apply Height Offset to the entire instance
        // We modify 'transformed' which is local vertex position.
        // But we want to move the whole instance up/down.
        // Usually we'd add to transformed.y.
        // Since base is at y=0, this works.
        // We multiply by 3.0 because FractalLandscape does elevation * 3.0

        float finalY = elevation * 3.0;
        transformed.y += finalY;

        // --- Growth / Stress Reaction ---
        // High stress -> Shrink
        float growthFactor = 1.0 - (uStress * 0.9); // Never fully disappear, maybe 0.1 scale

        // Swaying in wind
        float wind = snoise(vec3(worldX * 0.1, worldZ * 0.1, uTime * 0.5));
        float swayAngle = wind * 0.1 * (1.0 + uStress);

        // Simple sway rotation around Z axis (approx)
        // x' = x cos - y sin
        // y' = x sin + y cos
        // We only apply to vertices above y=0 to anchor root?
        // Actually geometry is translated up, so y > 0.
        // Let's just rotate the whole thing slightly

        float c = cos(swayAngle);
        float s = sin(swayAngle);
        mat2 rot = mat2(c, -s, s, c);
        transformed.xy = rot * transformed.xy;

        // Scale
        transformed *= growthFactor;

        // Color variation based on position?
        // We can pass color via instanceColor but for now let's stick to material color
        `
      );
    };

    return mat;
  }, []);

  // Update loop
  useFrame(({ clock }) => {
    if (!meshRef.current || !shaderRef.current) return;

    // Initialize positions if not ready (inside the loop or via useEffect, doing here ensures order)
    if (!positionsRef.current) {
        // We can't use Math.random inside useFrame if we want strict purity in render,
        // but useFrame is an effect loop (subscription), so side effects like random generation are technically safe here
        // IF they only happen once.
        const pos = new Float32Array(INSTANCE_COUNT * 2);
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            pos[i * 2] = (Math.random() - 0.5) * TERRAIN_SIZE;
            pos[i * 2 + 1] = (Math.random() - 0.5) * TERRAIN_SIZE;
        }
        positionsRef.current = pos;
    }

    const stress = useResonanceStore.getState().currentStress;
    const isBreathActive = useRespirationStore.getState().isActive;
    const breathValue = RespirationController.getValue();
    const time = clock.getElapsedTime();

    shaderRef.current.uniforms.uTime.value = time;
    shaderRef.current.uniforms.uStress.value = stress;
    shaderRef.current.uniforms.uBreath.value = isBreathActive ? breathValue : 0;

    const camX = camera.position.x;
    const camZ = camera.position.z;
    const dummy = dummyRef.current;
    const pos = positionsRef.current;

    let needsUpdate = false;

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      let x = pos[i * 2];
      let z = pos[i * 2 + 1];

      const distX = x - camX;
      if (distX < -HALF_SIZE) {
         x += TERRAIN_SIZE;
         pos[i * 2] = x;
         needsUpdate = true;
      } else if (distX > HALF_SIZE) {
         x -= TERRAIN_SIZE;
         pos[i * 2] = x;
         needsUpdate = true;
      }

      const distZ = z - camZ;
      if (distZ < -HALF_SIZE) {
         z += TERRAIN_SIZE;
         pos[i * 2 + 1] = z;
         needsUpdate = true;
      } else if (distZ > HALF_SIZE) {
         z -= TERRAIN_SIZE;
         pos[i * 2 + 1] = z;
         needsUpdate = true;
      }

      if (needsUpdate) {
         dummy.position.set(x, 0, z);
         dummy.rotation.y = i;
         dummy.updateMatrix();
         meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (needsUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // Initial placement
  useEffect(() => {
    // If positionsRef is not yet initialized (e.g. useFrame hasn't run), initialize it here
    if (!positionsRef.current) {
        const pos = new Float32Array(INSTANCE_COUNT * 2);
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            pos[i * 2] = (Math.random() - 0.5) * TERRAIN_SIZE;
            pos[i * 2 + 1] = (Math.random() - 0.5) * TERRAIN_SIZE;
        }
        positionsRef.current = pos;
    }

    const dummy = dummyRef.current;
    const pos = positionsRef.current;
    for (let i = 0; i < INSTANCE_COUNT; i++) {
       dummy.position.set(pos[i*2], 0, pos[i*2+1]);
       dummy.rotation.y = i;
       const scale = 0.5 + Math.random() * 1.0;
       dummy.scale.set(scale, scale, scale);
       dummy.updateMatrix();
       meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, INSTANCE_COUNT]}
      position={[0, -3, 0]}
      frustumCulled={false}
    />
  );
};
