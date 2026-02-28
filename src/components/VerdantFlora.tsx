import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useRespirationStore } from '../stores/useRespirationStore';
import { useNarrativeStore } from '../stores/useNarrativeStore'; // Added import
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

  // Move positions initialization out of the hot path loop.
  // We use useState with a lazy initializer to hold the mutable array directly,
  // bypassing the need to mutate a ref during render which trips the linter.
  const [positions] = useState(() => {
    const pos = new Float32Array(INSTANCE_COUNT * 2);
    for (let i = 0; i < INSTANCE_COUNT; i++) {
        pos[i * 2] = (Math.random() - 0.5) * TERRAIN_SIZE;
        pos[i * 2 + 1] = (Math.random() - 0.5) * TERRAIN_SIZE;
    }
    return pos;
  });

  // Keep the ref pattern internally for useFrame to align with previous logic if needed,
  // or just use the positions array directly since it's a mutable reference.
  const positionsRef = useRef<Float32Array>(positions);

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
      shader.uniforms.uNarrative = { value: 0 }; // Added
      shader.uniforms.uNarrativeIntensity = { value: 0 }; // Added
      shader.uniforms.uOffsetX = { value: 0 }; // Added for GPU Wrapping
      shader.uniforms.uOffsetZ = { value: 0 }; // Added for GPU Wrapping

      shaderRef.current = shader;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uStress;
        uniform float uBreath;
        uniform float uNarrative; // Added
        uniform float uNarrativeIntensity; // Added
        uniform float uOffsetX;
        uniform float uOffsetZ;
        ${NOISE_GLSL}
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Get Instance World Position (assuming mesh is at 0,0,0)
        // instanceMatrix column 3 is position
        vec3 instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

        // Wrap logic on GPU
        float halfSize = ${HALF_SIZE.toFixed(1)};
        float terrainSize = ${TERRAIN_SIZE.toFixed(1)};

        float worldX = mod(instPos.x - uOffsetX + halfSize, terrainSize) - halfSize + uOffsetX;
        float worldZ = mod(instPos.z - uOffsetZ + halfSize, terrainSize) - halfSize + uOffsetZ;

        // Update transformed to the new wrapped position relative to the local mesh
        transformed.x += (worldX - instPos.x);
        transformed.z += (worldZ - instPos.z);

        // --- Height Calculation (Must match FractalLandscape) ---
        float noiseScale = 0.05;
        float timeScale = 0.2;

        float elevation = snoise(vec3(worldX * noiseScale, worldZ * noiseScale, uTime * timeScale));

        // Narrative Modulation (MATCHING FRACTAL LANDSCAPE)
        float narrativeMod = 0.0;

        if (uNarrative > 0.5 && uNarrative < 1.5) {
            float spiky = snoise(vec3(worldX * 0.1, worldZ * 0.1, uTime * 0.5));
            spiky = pow(abs(spiky), 3.0) * sign(spiky);
            narrativeMod = spiky * 5.0 * uNarrativeIntensity;
        }
        else if (uNarrative > 1.5 && uNarrative < 2.5) {
            float deep = snoise(vec3(worldX * 0.02, worldZ * 0.02, uTime * 0.1));
            narrativeMod = deep * 4.0 * uNarrativeIntensity;
            elevation *= (1.0 - uNarrativeIntensity * 0.5);
        }
        else if (uNarrative > 2.5) {
            float stepped = floor(elevation * 5.0) / 5.0;
            elevation = mix(elevation, stepped, uNarrativeIntensity);
            float lattice = step(0.9, sin(worldX * 0.5) * sin(worldZ * 0.5));
            narrativeMod += lattice * uNarrativeIntensity * 2.0;
        }

        elevation += narrativeMod;

        float stressNoise = snoise(vec3(worldX * noiseScale * 4.0, worldZ * noiseScale * 4.0, uTime * timeScale * 2.0));
        float jaggedness = uStress * 3.0;

        elevation += stressNoise * jaggedness;
        elevation *= (1.0 + uBreath * 0.5);

        // Apply Height Offset to the entire instance
        float finalY = elevation * 3.0;

        // Narrative Flora Adjustment (Specific to plants)
        if (uNarrative > 0.5 && uNarrative < 1.5) {
             // ASCENSION: Taller
             finalY += 0.5 * uNarrativeIntensity;
        } else if (uNarrative > 1.5 && uNarrative < 2.5) {
             // DESCENT: Lower (roots deep)
             finalY -= 0.2 * uNarrativeIntensity;
        }

        transformed.y += finalY;

        // --- Growth / Stress Reaction ---
        // High stress -> Shrink
        float growthFactor = 1.0 - (uStress * 0.9); // Never fully disappear, maybe 0.1 scale

        // Swaying in wind
        float wind = snoise(vec3(worldX * 0.1, worldZ * 0.1, uTime * 0.5));
        float swayAngle = wind * 0.1 * (1.0 + uStress);

        // Narrative Flora Shape/Sway Adjustment
        if (uNarrative > 0.5 && uNarrative < 1.5) {
             // ASCENSION: Taller, Thinner
             growthFactor *= (1.0 + uNarrativeIntensity * 0.5);
             transformed.xz *= (1.0 - uNarrativeIntensity * 0.3);
        } else if (uNarrative > 1.5 && uNarrative < 2.5) {
             // DESCENT: Shorter, Wider
             growthFactor *= (1.0 - uNarrativeIntensity * 0.2);
             transformed.xz *= (1.0 + uNarrativeIntensity * 0.5);
        } else if (uNarrative > 2.5) {
             // STASIS: Rigid
             swayAngle *= (1.0 - uNarrativeIntensity);
        }

        // Simple sway rotation around Z axis (approx)
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

    const stress = useResonanceStore.getState().currentStress;
    const isBreathActive = useRespirationStore.getState().isActive;
    const breathValue = RespirationController.getValue();

    // Get Narrative State
    const { currentArc, intensity } = useNarrativeStore.getState();
    let narrativeIndex = 0.0;
    if (currentArc === 'ASCENSION') narrativeIndex = 1.0;
    else if (currentArc === 'DESCENT') narrativeIndex = 2.0;
    else if (currentArc === 'STASIS') narrativeIndex = 3.0;

    const time = clock.getElapsedTime();

    shaderRef.current.uniforms.uTime.value = time;
    shaderRef.current.uniforms.uStress.value = stress;
    shaderRef.current.uniforms.uBreath.value = isBreathActive ? breathValue : 0;
    shaderRef.current.uniforms.uNarrative.value = narrativeIndex;
    shaderRef.current.uniforms.uNarrativeIntensity.value = intensity;
    shaderRef.current.uniforms.uOffsetX.value = camera.position.x;
    shaderRef.current.uniforms.uOffsetZ.value = camera.position.z;

    // GPU wrapping completely handles positions now, no need to update matrices on the CPU.
  });

  // Initial placement
  useEffect(() => {
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
