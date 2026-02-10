import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { create } from '@react-three/test-renderer';
import * as THREE from 'three';
import { SynapticLattice } from '../../components/SynapticLattice';
import { useTelemetryStore } from '../../stores/useTelemetryStore';

// Mock store
vi.mock('../../stores/useTelemetryStore', () => ({
  useTelemetryStore: vi.fn(),
}));

describe('SynapticLattice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTelemetryStore as unknown as Mock).mockImplementation((selector: (state: unknown) => unknown) => selector({
      sessionPath: []
    }));
  });

  it('renders an instancedMesh with correct max count', async () => {
    const renderer = await create(<SynapticLattice />);
    // Find the instancedMesh. It's usually the root or first child.
    // In our component: <instancedMesh ...> <geometry> <material> </instancedMesh>
    const mesh = renderer.scene.children[0];

    // Check args[2] which is max instances (2000)
    expect(mesh.props.args[2]).toBe(2000);
  });

  it('adds crystals when sessionPath grows', async () => {
    // Initial render with empty path
    const renderer = await create(<SynapticLattice />);
    const mesh = renderer.scene.children[0];
    const threeMesh = mesh.instance as THREE.InstancedMesh;

    expect(threeMesh.count).toBe(0);

    // Update store mock with points far enough apart
    (useTelemetryStore as unknown as Mock).mockImplementation((selector: (state: unknown) => unknown) => selector({
      sessionPath: [
          { x: 0, y: 0, z: 0, stress: 0.5, coherence: 80, timestamp: 1000 },
          { x: 10, y: 0, z: 0, stress: 0.6, coherence: 70, timestamp: 2000 } // Distance 10 > 4
      ]
    }));

    // Trigger update by re-rendering
    await renderer.update(<SynapticLattice />);

    // Count should be 2 (start + next point)
    expect(threeMesh.count).toBe(2);
  });

  it('injects shader code', async () => {
    const renderer = await create(<SynapticLattice />);
    const mesh = renderer.scene.children[0];
    const threeMesh = mesh.instance as THREE.InstancedMesh;
    const material = threeMesh.material as THREE.MeshStandardMaterial;

    expect(material.onBeforeCompile).toBeDefined();

    const mockShader = {
        vertexShader: 'void main() { #include <begin_vertex> }',
        fragmentShader: 'void main() { #include <color_fragment> }',
        uniforms: {}
    };

    // Trigger callback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    material.onBeforeCompile(mockShader as any, {} as THREE.WebGLRenderer);

    expect(mockShader.uniforms.uTime).toBeDefined();
    expect(mockShader.vertexShader).toContain('attribute float aStress');
    expect(mockShader.fragmentShader).toContain('varying float vStress');
  });
});
