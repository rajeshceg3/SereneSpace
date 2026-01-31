import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { EntrainmentField } from '../../components/EntrainmentField';
import * as THREE from 'three';

// Hoisted mock
const { mockEntrainmentState } = vi.hoisted(() => ({
  mockEntrainmentState: {
    currentPulse: 0,
    intensity: 1,
    isActive: true,
  },
}));

vi.mock('../../stores/useEntrainmentStore', () => ({
  useEntrainmentStore: {
    getState: () => mockEntrainmentState,
  },
}));

describe('EntrainmentField', () => {
  beforeEach(() => {
    mockEntrainmentState.currentPulse = 0;
    mockEntrainmentState.intensity = 1;
    mockEntrainmentState.isActive = true;
  });

  it('renders a mesh with plane geometry', async () => {
    const renderer = await ReactThreeTestRenderer.create(<EntrainmentField />);
    const meshNode = renderer.scene.children[0];
    const mesh = meshNode.instance as THREE.Mesh;

    expect(mesh).toBeDefined();
    // Use matching for geometry type as different three versions might behave differently or return different strings
    // But PlaneGeometry is standard.
    expect(mesh.geometry.type).toBe('PlaneGeometry');
  });

  it('updates opacity based on pulse and intensity', async () => {
    mockEntrainmentState.currentPulse = 0.5;
    mockEntrainmentState.intensity = 0.8;

    const renderer = await ReactThreeTestRenderer.create(<EntrainmentField />);
    const meshNode = renderer.scene.children[0];
    const mesh = meshNode.instance as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;

    // Advance frame to trigger useFrame
    await renderer.advanceFrames(2, 0.1);

    // Opacity should be pulse * intensity = 0.5 * 0.8 = 0.4
    expect(material.opacity).toBeCloseTo(0.4);
  });

  it('sets opacity to 0 when inactive', async () => {
    mockEntrainmentState.isActive = false;
    mockEntrainmentState.currentPulse = 1;
    mockEntrainmentState.intensity = 1;

    const renderer = await ReactThreeTestRenderer.create(<EntrainmentField />);
    const meshNode = renderer.scene.children[0];
    const mesh = meshNode.instance as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;

    await renderer.advanceFrames(2, 0.1);

    expect(material.opacity).toBe(0);
  });
});
