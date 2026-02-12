import { describe, it, expect, beforeEach } from 'vitest';
import { atlasService } from '../../services/AtlasService';
import { useDestinationStore } from '../../stores/useDestinationStore';
import { useAtlasStore } from '../../stores/useAtlasStore';
import { useResonanceStore } from '../../stores/useResonanceStore';
import type { AtlasNode } from '../../types';

describe('AtlasService', () => {
  beforeEach(() => {
    // Reset stores
    useDestinationStore.setState({ destinations: [], activeDestination: null });
    useAtlasStore.setState({ nodes: [], isOpen: false });
    useResonanceStore.setState({ currentStress: 0.2 });

    // Reset singleton state if needed (lastTrackedId is private, so we can't easily,
    // but we can rely on creating distinct destinations)
    // Reset private state (using type assertion for test access)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (atlasService as any).lastTrackedId = null;
  });

  it('tracks a new node when close enough', () => {
    const mockDest = {
      id: 'test-1',
      name: 'Test',
      coordinates: [0, 0, -100] as [number, number, number],
      ambientColor: '#fff',
      description: 'Test dest'
    };

    useDestinationStore.setState({ destinations: [mockDest] });

    // Camera at -90 (distance 10)
    atlasService.trackPosition(-90);

    const nodes = useAtlasStore.getState().nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('test-1');
    expect(nodes[0].stressLevel).toBe(0.2);
    // Coherence = (1 - 0.2) * 100 = 80
    expect(nodes[0].coherenceScore).toBe(80);
  });

  it('does not track if too far', () => {
    const mockDest = {
      id: 'test-2',
      name: 'Test 2',
      coordinates: [0, 0, -100] as [number, number, number],
      ambientColor: '#fff',
      description: 'Test dest'
    };

    useDestinationStore.setState({ destinations: [mockDest] });

    // Camera at -50 (distance 50)
    atlasService.trackPosition(-50);

    const nodes = useAtlasStore.getState().nodes;
    expect(nodes).toHaveLength(0);
  });

  it('ignores duplicates (already tracked)', () => {
    const mockDest = {
      id: 'test-3',
      name: 'Test 3',
      coordinates: [0, 0, -100] as [number, number, number],
      ambientColor: '#fff',
      description: 'Test dest'
    };

    useDestinationStore.setState({ destinations: [mockDest] });

    // First track
    atlasService.trackPosition(-90);
    expect(useAtlasStore.getState().nodes).toHaveLength(1);

    // Second track (same pos)
    atlasService.trackPosition(-91);
    expect(useAtlasStore.getState().nodes).toHaveLength(1);
  });

  it('teleport resets destination store and returns target Z', () => {
    const node: AtlasNode = {
      id: 'teleport-1',
      name: 'Teleport',
      coordinates: [0, 0, -500],
      ambientColor: '#000',
      description: 'Teleport dest',
      visitedAt: 123456789,
      stressLevel: 0.5,
      coherenceScore: 50
    };

    const targetZ = atlasService.teleport(node);

    expect(targetZ).toBe(-500 + 5); // CAMERA_INITIAL_Z = 5

    const { destinations, activeDestination } = useDestinationStore.getState();
    expect(destinations).toHaveLength(1);
    expect(destinations[0].id).toBe('teleport-1');
    expect(activeDestination).toBe('teleport-1');
  });
});
