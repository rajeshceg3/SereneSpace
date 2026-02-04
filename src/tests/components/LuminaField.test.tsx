import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { LuminaField } from '../../components/LuminaField';
import * as THREE from 'three';

// --- Mocks ---

const mockResonanceState = {
  currentStress: 0.5,
};

const mockEntrainmentState = {
  currentPulse: 0.5,
};

const mockRespirationValue = 0.5;

vi.mock('../../stores/useResonanceStore', () => ({
  useResonanceStore: (selector: (state: typeof mockResonanceState) => unknown) => selector(mockResonanceState),
}));

vi.mock('../../stores/useEntrainmentStore', () => ({
  useEntrainmentStore: (selector: (state: typeof mockEntrainmentState) => unknown) => selector(mockEntrainmentState),
}));

vi.mock('../../services/RespirationController', () => ({
  RespirationController: {
    getValue: () => mockRespirationValue,
  },
}));

// Mock Shader Material to access uniforms easily if needed,
// though standard three.js ShaderMaterial works in test renderer too.

describe('LuminaField', () => {
  beforeEach(() => {
    mockResonanceState.currentStress = 0.5;
    mockEntrainmentState.currentPulse = 0.5;
  });

  it('renders an instancedMesh', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LuminaField />);

    // Find instancedMesh
    const meshNode = renderer.scene.children[0];
    // In R3F test renderer, the instance is available
    const mesh = meshNode.instance as THREE.InstancedMesh;

    expect(mesh).toBeDefined();
    // Use .type check as instanceof can be flaky in test env with multiple three instances
    // console.log('Mesh Type:', mesh.type);
    expect(mesh.isInstancedMesh).toBe(true);
    expect(mesh.count).toBe(2000);
  });

  it('initializes uniforms correctly', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LuminaField />);
    const meshNode = renderer.scene.children[0];
    const material = (meshNode.instance as THREE.InstancedMesh).material as THREE.ShaderMaterial;

    expect(material.uniforms.uTime).toBeDefined();
    expect(material.uniforms.uStress).toBeDefined();
    expect(material.uniforms.uBreath).toBeDefined();
    expect(material.uniforms.uPulse).toBeDefined();
  });

  it('updates uniforms on frame', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LuminaField />);
    const meshNode = renderer.scene.children[0];
    const material = (meshNode.instance as THREE.InstancedMesh).material as THREE.ShaderMaterial;

    // Initial value (0 in uniform definition)
    expect(material.uniforms.uStress.value).toBe(0);

    // Advance frames to trigger useFrame and lerp
    await renderer.advanceFrames(10, 0.1);

    // Should have lerped towards 0.5 (mock value)
    expect(material.uniforms.uStress.value).toBeGreaterThan(0);
    // Since we lerp, it won't be exactly 0.5 immediately, but it should increase
    expect(material.uniforms.uStress.value).toBeLessThanOrEqual(0.5);

    // Verify Breath (mocked to 0.5)
    expect(material.uniforms.uBreath.value).toBeGreaterThan(0);

    // Verify Pulse (mocked to 0.5)
    expect(material.uniforms.uPulse.value).toBeGreaterThan(0);
  });
});
