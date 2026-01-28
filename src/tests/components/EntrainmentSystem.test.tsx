import { describe, it, expect, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { EntrainmentSystem } from '../../components/EntrainmentSystem';
import { useEntrainmentStore } from '../../stores/useEntrainmentStore';
import { ENTRAINMENT_FREQUENCIES } from '../../constants';

describe('EntrainmentSystem', () => {
  beforeEach(() => {
    useEntrainmentStore.getState().reset();
  });

  it('updates pulse value (system is active)', async () => {
    const renderer = await ReactThreeTestRenderer.create(<EntrainmentSystem />);

    // Initial state check
    expect(useEntrainmentStore.getState().currentPulse).toBe(0);

    // Advance time. Even if clock is stuck at 0 in test-renderer,
    // the logic sin(0) -> 0. sin(0)+1 / 2 = 0.5.
    // So pulse should become 0.5.
    // If clock works, it will be something else.
    // In either case, it should not be 0.
    await renderer.advanceFrames(5, 0.1);

    const pulse = useEntrainmentStore.getState().currentPulse;
    expect(pulse).not.toBe(0);
    expect(pulse).toBeGreaterThan(0);
  });

  it('interpolates frequency smoothly', async () => {
     const renderer = await ReactThreeTestRenderer.create(<EntrainmentSystem />);

     // Set new target
     useEntrainmentStore.getState().setTargetFreq(ENTRAINMENT_FREQUENCIES.BETA); // 20

     // Advance frames
     await renderer.advanceFrames(5, 0.016);

     const { currentFreq } = useEntrainmentStore.getState();
     // Should have moved from 10 towards 20
     expect(currentFreq).toBeGreaterThan(ENTRAINMENT_FREQUENCIES.ALPHA);
     expect(currentFreq).toBeLessThan(ENTRAINMENT_FREQUENCIES.BETA + 1);
  });

  it('stops pulsing when inactive', async () => {
    const renderer = await ReactThreeTestRenderer.create(<EntrainmentSystem />);

    useEntrainmentStore.getState().setActive(false);

    await renderer.advanceFrames(10, 0.1);

    expect(useEntrainmentStore.getState().currentPulse).toBe(0);
  });
});
