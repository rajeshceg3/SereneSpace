import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { InfiniteHorizon } from '../../components/InfiniteHorizon';
import { useDestinationStore } from '../../stores/useDestinationStore';
import { useThree } from '@react-three/fiber';
import type { Destination } from '../../types';

// Mock SynapticCartographer
vi.mock('../../services/SynapticCartographer', () => ({
  SynapticCartographer: {
    generateNextDestination: (prev: Destination) => ({
      id: 'gen-' + Math.random(),
      coordinates: [0, 0, prev.coordinates[2] - 20],
      name: 'Generated',
      ambientColor: '#fff',
      description: 'Test',
      shape: 'sphere',
      biome: 'ZENITH',
      intensity: 0.5
    })
  }
}));

const CameraRig = ({ pos }: { pos: [number, number, number] }) => {
    const { camera } = useThree();
    camera.position.set(...pos);
    camera.updateMatrixWorld();
    return null;
}

describe('InfiniteHorizon', () => {
  beforeEach(() => {
    useDestinationStore.setState({
      destinations: [
        { id: '1', name: 'First', coordinates: [0, 0, 0], ambientColor: '#fff', description: 'Start' },
        { id: '2', name: 'Last', coordinates: [0, 0, -20], ambientColor: '#fff', description: 'End' }
      ]
    });
  });

  it('triggers generation when approaching the end', async () => {
    // Camera at 0. Last dest at -20. Distance = 20. Threshold = 40.
    // Should generate.

    const renderer = await ReactThreeTestRenderer.create(
        <>
            <CameraRig pos={[0, 0, 0]} />
            <InfiniteHorizon />
        </>
    );

    // Advance time to bypass throttle (0.5s)
    await renderer.advanceFrames(10, 0.1);

    const state = useDestinationStore.getState();
    // Should have added batch (3) -> 2 + 3 = 5
    expect(state.destinations.length).toBeGreaterThan(2);
  });

  it('culls destinations behind camera', async () => {
    // Camera at -60. Cull Threshold 50. Cull Z = -10.
    // Dest '1' is at 0. 0 > -10 -> Cull.
    // Dest '2' is at -20. -20 > -10 -> Keep.

    const renderer = await ReactThreeTestRenderer.create(
        <>
            <CameraRig pos={[0, 0, -60]} />
            <InfiniteHorizon />
        </>
    );

    await renderer.advanceFrames(10, 0.1);

    const state = useDestinationStore.getState();
    expect(state.destinations.find(d => d.id === '1')).toBeUndefined();
    expect(state.destinations.find(d => d.id === '2')).toBeDefined();
  });
});
