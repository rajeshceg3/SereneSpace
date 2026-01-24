import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Atmosphere } from '../../components/Atmosphere';
import * as THREE from 'three';

// Hoisted mocks for state control
const { mockResonanceState, updatePhaseMock } = vi.hoisted(() => ({
  mockResonanceState: { currentStress: 0 },
  updatePhaseMock: vi.fn(),
}));

vi.mock('../../stores/useTimeStore', () => ({
  useTimeStore: () => ({
    phase: 'DAY',
    updatePhase: updatePhaseMock,
  }),
}));

vi.mock('../../stores/useResonanceStore', () => ({
  useResonanceStore: {
    getState: () => mockResonanceState,
  },
}));

describe('Atmosphere', () => {
  beforeEach(() => {
    mockResonanceState.currentStress = 0;
    updatePhaseMock.mockClear();
  });

  it('adjusts light intensity based on stress', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Atmosphere />);

    // Get the light instance
    // renderer.scene is the root TestInstance
    // findAllByType is available on TestInstance
    const ambientLightNode = renderer.scene.children[0];
    const ambientLight = ambientLightNode.instance as THREE.AmbientLight;

    // Settle initial state (stress 0, Day phase -> intensity 1.0)
    // Lerp is slow (0.01), so advance many frames
    await renderer.advanceFrames(100, 0.016);

    // Initial check: Should be close to 1.0
    expect(ambientLight.intensity).toBeGreaterThan(0.9);

    // Increase stress to max
    mockResonanceState.currentStress = 1;

    // Advance frames to let it update
    // Target intensity = 1.0 * (1 - 1 * 0.3) = 0.7
    await renderer.advanceFrames(200, 0.016);

    // Check if intensity decreased
    expect(ambientLight.intensity).toBeLessThan(0.9);
    expect(ambientLight.intensity).toBeCloseTo(0.7, 1);
  });
});
