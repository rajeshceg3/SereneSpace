import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { EntrainmentField } from '../../components/EntrainmentField';
import { useEntrainmentStore } from '../../stores/useEntrainmentStore';
import * as THREE from 'three';

describe('EntrainmentField', () => {
  beforeEach(() => {
    useEntrainmentStore.getState().reset();
  });

  it('renders and attaches to the camera', async () => {
    const renderer = await ReactThreeTestRenderer.create(<EntrainmentField />);

    // We can find the mesh in the renderer's scene graph.
    const mesh = renderer.scene.children[0];
    expect(mesh.type).toBe('Mesh');

    // Verify geometry and material types
    expect((mesh.instance as THREE.Mesh).geometry.type).toBe('PlaneGeometry');
    expect((mesh.instance as THREE.Mesh).material.type).toBe('MeshBasicMaterial');
  });

  it('updates opacity based on pulse and intensity', async () => {
    const renderer = await ReactThreeTestRenderer.create(<EntrainmentField />);

    const mesh = renderer.scene.children[0].instance as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;

    // Set state
    useEntrainmentStore.getState().setIntensity(0.5);
    useEntrainmentStore.getState().updatePulse(1.0); // Full pulse
    useEntrainmentStore.getState().setActive(true);

    // Advance frame to trigger useFrame
    await renderer.advanceFrames(1, 0.1);

    // opacity should be pulse * intensity = 1.0 * 0.5 = 0.5
    expect(material.opacity).toBeCloseTo(0.5);

    // Change pulse
    useEntrainmentStore.getState().updatePulse(0.5);
    await renderer.advanceFrames(1, 0.1);

    // opacity should be 0.5 * 0.5 = 0.25
    expect(material.opacity).toBeCloseTo(0.25);
  });

  it('is invisible when inactive', async () => {
    const renderer = await ReactThreeTestRenderer.create(<EntrainmentField />);

    const mesh = renderer.scene.children[0].instance as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;

    useEntrainmentStore.getState().setActive(false);
    useEntrainmentStore.getState().updatePulse(1.0);
    useEntrainmentStore.getState().setIntensity(1.0);

    await renderer.advanceFrames(1, 0.1);

    expect(material.opacity).toBe(0);
  });
});
