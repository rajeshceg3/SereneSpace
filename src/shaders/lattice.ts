import * as THREE from 'three';

const NOISE_FUNC = `
  // Simple 3D noise function
  float hash(float n) { return fract(sin(n) * 1e4); }
  float noise(vec3 x) {
      const vec3 step = vec3(110, 241, 171);
      vec3 i = floor(x);
      vec3 f = fract(x);
      float n = dot(i, step);
      vec3 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                     mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
                 mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                     mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
  }
`;

export const latticeOnBeforeCompile = (shader: THREE.Shader) => {
  // Inject Uniforms & Attributes
  shader.vertexShader = `
    attribute float aStress;
    attribute float aCoherence;
    varying float vStress;
    varying float vCoherence;
    uniform float uTime;

    ${NOISE_FUNC}

    ${shader.vertexShader}
  `;

  // Inject Displacement Logic
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    vStress = aStress;
    vCoherence = aCoherence;

    // 1. Breathing Pulse (based on Coherence)
    // High coherence (100) = slow, deep pulse.
    float breathSpeed = 1.0 + (1.0 - (aCoherence / 100.0)) * 3.0;
    float breathDepth = 0.05 + (aCoherence / 100.0) * 0.1;
    float pulse = sin(uTime * breathSpeed) * breathDepth;
    transformed *= (1.0 + pulse);

    // 2. Stress Distortion (Jaggedness)
    if (aStress > 0.1) {
        float distortion = noise(transformed * 5.0 + uTime * 0.5) * aStress * 0.3;
        transformed += normal * distortion;
    }
    `
  );

  // Inject Fragment Uniforms & Varyings
  shader.fragmentShader = `
    varying float vStress;
    varying float vCoherence;
    uniform float uTime;
    ${shader.fragmentShader}
  `;

  // Inject Color Logic
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `
    #include <color_fragment>

    // Color Palette
    vec3 colorCalm = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 colorGold = vec3(1.0, 0.84, 0.0); // Gold
    vec3 colorStress = vec3(1.0, 0.2, 0.2); // Red

    // Base mix based on stress
    vec3 finalColor = mix(colorCalm, colorStress, vStress);

    // Add Gold hint for high coherence
    if (vCoherence > 80.0) {
        finalColor = mix(finalColor, colorGold, 0.4 * (vCoherence - 80.0) / 20.0);
    }

    // Inner Glow pulsing
    float glow = sin(uTime * 2.0) * 0.5 + 0.5;
    finalColor += glow * 0.1 * (vCoherence / 100.0);

    diffuseColor.rgb = finalColor;

    // Adjust opacity based on coherence (higher = more solid)
    diffuseColor.a = 0.5 + (vCoherence / 200.0);
    `
  );

  // Initialize Uniforms
  shader.uniforms.uTime = { value: 0 };
};
