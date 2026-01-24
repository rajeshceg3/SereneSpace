import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { ResonanceSystem } from '../../components/ResonanceSystem';

const decayStressMock = vi.fn();

vi.mock('../../stores/useResonanceStore', () => ({
  useResonanceStore: (selector: (state: any) => any) => {
    const state = {
      decayStress: decayStressMock,
    };
    return selector(state);
  },
}));

describe('ResonanceSystem', () => {
  beforeEach(() => {
    decayStressMock.mockClear();
  });

  it('calls decayStress on every frame', async () => {
    const renderer = await ReactThreeTestRenderer.create(<ResonanceSystem />);

    // Initial render shouldn't necessarily call it, but useFrame runs on frame loop
    // Advance frames
    await renderer.advanceFrames(5, 0.1);

    expect(decayStressMock).toHaveBeenCalled();
    expect(decayStressMock.mock.calls.length).toBeGreaterThanOrEqual(5);
  });
});
