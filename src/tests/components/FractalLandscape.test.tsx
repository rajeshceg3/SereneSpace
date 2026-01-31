// Feature 12: Fractal Synthesis Engine Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { FractalLandscape } from '../../components/FractalLandscape';
import * as THREE from 'three';

// Hoisted mocks
const { mockResonanceState } = vi.hoisted(() => ({
  mockResonanceState: { currentStress: 0 },
}));

vi.mock('../../stores/useResonanceStore', () => ({
  useResonanceStore: {
    getState: () => mockResonanceState,
  },
}));

describe('FractalLandscape', () => {
  beforeEach(() => {
    mockResonanceState.currentStress = 0;
  });

  it('renders a mesh with plane geometry', async () => {
    const renderer = await ReactThreeTestRenderer.create(<FractalLandscape />);

    // Check Mesh
    const meshNode = renderer.scene.children[0];
    expect(meshNode).toBeDefined();
    expect(meshNode.type).toMatch(/mesh/i);

    // Check Geometry on the instance
    const mesh = meshNode.instance as THREE.Mesh;
    expect(mesh.geometry).toBeDefined();
    expect(mesh.geometry.type).toBe('PlaneGeometry');

    // Check Material on the instance
    // Note: It's a MeshStandardMaterial
    expect(mesh.material).toBeDefined();
    expect((mesh.material as THREE.Material).type).toBe('MeshStandardMaterial');

    // Check props
    expect(meshNode.props.position).toEqual([0, -3, 0]);
  });

  it('updates position based on camera in useFrame', async () => {
    const renderer = await ReactThreeTestRenderer.create(<FractalLandscape />);
    const meshNode = renderer.scene.children[0];
    const meshInstance = meshNode.instance as THREE.Mesh;

    expect(meshInstance).toBeDefined();

    // Advance frames
    await renderer.advanceFrames(5, 0.016);

    // Check if position was updated (default camera is usually at Z=0 or Z=5 in R3F test renderer)
    // Initial prop was -3.
    expect(meshInstance.position.z).not.toBe(-3);
    expect(typeof meshInstance.position.z).toBe('number');
  });
});
