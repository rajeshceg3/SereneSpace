import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { VerdantFlora } from '../../components/VerdantFlora';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { useRespirationStore } from '../../stores/useRespirationStore';

// Mock Stores
vi.mock('../../stores/useResonanceStore');
vi.mock('../../stores/useRespirationStore');

// Mock Dependencies
vi.mock('three/addons/utils/BufferGeometryUtils.js', () => ({
  mergeGeometries: vi.fn(() => new THREE.BufferGeometry()),
}));

describe('VerdantFlora Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Mock State
    (useResonanceStore.getState as unknown as Mock).mockReturnValue({
      currentStress: 0.5,
    });

    (useRespirationStore.getState as unknown as Mock).mockReturnValue({
      isActive: true,
    });
  });

  it('renders an instanced mesh with correct count', async () => {
    const renderer = await ReactThreeTestRenderer.create(<VerdantFlora />);

    // Test renderer seems to map instancedMesh to 'Mesh' type or similar in this environment
    const mesh = renderer.scene.children[0];
    expect(mesh).toBeDefined();
    // Check props to confirm it is the instanced mesh
    expect(mesh.props.args[2]).toBe(1500); // INSTANCE_COUNT
  });

  it('compiles material and injects shader code', async () => {
    const renderer = await ReactThreeTestRenderer.create(<VerdantFlora />);
    const mesh = renderer.scene.children[0];

    const material = mesh.props.args[1] as THREE.MeshStandardMaterial;
    expect(material).toBeDefined();
    expect(material.onBeforeCompile).toBeDefined();

    // Mock Shader object
    const mockShader = {
      uniforms: {
        uTime: { value: 0 },
        uStress: { value: 0 },
        uBreath: { value: 0 },
      },
      vertexShader: 'void main() { #include <begin_vertex> }',
      fragmentShader: '',
    };

    // Trigger compilation
    material.onBeforeCompile(mockShader as unknown as THREE.Shader, {} as THREE.WebGLRenderer);

    // Verify Uniforms were initialized
    expect(mockShader.uniforms.uTime).toBeDefined();
    expect(mockShader.uniforms.uStress).toBeDefined();

    // Verify Shader Injection
    expect(mockShader.vertexShader).toContain('uniform float uTime;');
    expect(mockShader.vertexShader).toContain('snoise(vec3(worldX'); // Check for noise call
  });

  // Note: testing useFrame logic requires advancing time or mocking the loop,
  // which R3F test renderer handles via .advanceFrames()
  it('updates uniforms on frame', async () => {
    const renderer = await ReactThreeTestRenderer.create(<VerdantFlora />);
    const mesh = renderer.scene.children[0];
    const material = mesh.props.args[1] as THREE.MeshStandardMaterial;

    const mockShader = {
        uniforms: {
          uTime: { value: -1 },
          uStress: { value: 0 },
          uBreath: { value: 0 },
        },
        vertexShader: '',
    };
    material.onBeforeCompile(mockShader as unknown as THREE.Shader, {} as THREE.WebGLRenderer);

    // Advance frame significantly
    await renderer.advanceFrames(10, 1.0);

    // Check if time updated (should be >= 0)
    // If it is still -1, useFrame didn't run.
    expect(mockShader.uniforms.uTime.value).toBeGreaterThanOrEqual(0);

    // Check if stress updated (mocked to 0.5)
    expect(mockShader.uniforms.uStress.value).toBe(0.5);
  });
});
