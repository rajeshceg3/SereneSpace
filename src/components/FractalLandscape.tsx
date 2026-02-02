// Feature 12: Fractal Synthesis Engine - Infinite Terrain
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useRespirationStore } from '../stores/useRespirationStore';
import { RespirationController } from '../services/RespirationController';
import { NOISE_GLSL } from '../shaders/noise';

export const FractalLandscape = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaderRef = useRef<any>(null!);
  const { camera } = useThree();

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#444444',
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true, // Low-poly aesthetic
      side: THREE.DoubleSide
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uStress = { value: 0 };
      shader.uniforms.uOffsetZ = { value: 0 };
      shader.uniforms.uOffsetX = { value: 0 };
      shader.uniforms.uBreath = { value: 0 };

      shaderRef.current = shader;

      // Prepend Noise function
      shader.vertexShader = `
        uniform float uTime;
        uniform float uStress;
        uniform float uOffsetZ;
        uniform float uOffsetX;
        uniform float uBreath;
        ${NOISE_GLSL}
      ` + shader.vertexShader;

      // Inject displacement logic
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // Calculate world coordinates for noise (since mesh moves with camera)
        float worldX = position.x + uOffsetX;
        float worldZ = position.z + uOffsetZ;

        // Base Terrain (Rolling hills)
        float noiseScale = 0.05;
        float timeScale = 0.2;

        float elevation = snoise(vec3(worldX * noiseScale, worldZ * noiseScale, uTime * timeScale));

        // Stress Modulation (Jaggedness)
        // High stress adds high-frequency noise and amplitude
        float stressNoise = snoise(vec3(worldX * noiseScale * 4.0, worldZ * noiseScale * 4.0, uTime * timeScale * 2.0));

        // Blend based on stress
        // uStress is 0.0 to 1.0
        float jaggedness = uStress * 3.0;

        elevation += stressNoise * jaggedness;

        // Breath Modulation (The earth heaves)
        elevation *= (1.0 + uBreath * 0.5);

        // Apply elevation to Y
        transformed.y += elevation * 3.0;
        `
      );

      // Fix for shadows/lighting with displaced vertices
      // (Simple normal recomputation is hard in vertex shader without derivatives,
      // but flatShading + geometric normals handles it reasonably well for low-poly)
    };

    return mat;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current || !shaderRef.current) return;

    // 1. Sync Mesh Position with Camera (Infinite Scrolling)
    // We lock X and Z to the camera so the plane is always under the user.
    meshRef.current.position.z = camera.position.z;
    meshRef.current.position.x = camera.position.x;

    // 2. Update Uniforms
    const stress = useResonanceStore.getState().currentStress;
    const isBreathActive = useRespirationStore.getState().isActive;
    const breathValue = RespirationController.getValue();

    shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
    shaderRef.current.uniforms.uStress.value = stress;
    shaderRef.current.uniforms.uOffsetZ.value = camera.position.z;
    shaderRef.current.uniforms.uOffsetX.value = camera.position.x;
    shaderRef.current.uniforms.uBreath.value = isBreathActive ? breathValue : 0;
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, -3, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      {/* High segment count for smooth displacement */}
      <planeGeometry args={[200, 200, 128, 128]} />
    </mesh>
  );
};
