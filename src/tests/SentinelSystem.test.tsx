import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { SentinelSystem } from '../components/SentinelSystem';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import { RESONANCE_DECAY_RATE } from '../constants';

// We need to mock the stores?
// No, we want to test the actual integration between them.
// But we need to reset them.

describe('SentinelSystem Integration', () => {
  beforeEach(() => {
    useTelemetryStore.getState().resetSession();
    useSentinelStore.getState().resetSentinel();
    useResonanceStore.getState().setDecayRate(RESONANCE_DECAY_RATE);
  });

  it('should update resonance decay rate when high stress is detected', () => {
    render(<SentinelSystem />);

    // Initial state check
    expect(useResonanceStore.getState().decayRate).toBe(RESONANCE_DECAY_RATE);

    // Simulate high stress inputs
    const highStressValue = 0.9;

    // We need to add enough points to trigger evaluation (min 5 points, and mod 5 check)
    // The component checks on render and when sessionData changes.
    // We'll add 10 points.

    // We use act to ensure updates are flushed?
    // Zustand updates are synchronous usually, but effect hooks run after render.

    const { logSample } = useTelemetryStore.getState();

    // Adding points
    act(() => {
      for (let i = 0; i < 10; i++) {
          logSample(highStressValue);
      }
    });

    // Wait for effect to run?
    // Since we are using standard React render, useEffect runs asynchronously.
    // We might need to wait or use fake timers?
    // But Zustand is external.

    // Let's verify if the Sentinel evaluated.
    // The Sentinel store should be GUIDANCE.
    expect(useSentinelStore.getState().protocol).toBe('GUIDANCE');

    // The Resonance store should have the new decay rate.
    // GUIDANCE decay rate is base * 2.5
    expect(useResonanceStore.getState().decayRate).toBe(RESONANCE_DECAY_RATE * 2.5);
  });

  it('should update resonance decay rate when low stress is detected', () => {
    render(<SentinelSystem />);

    const lowStressValue = 0.1;
    const { logSample } = useTelemetryStore.getState();

    act(() => {
      for (let i = 0; i < 10; i++) {
          logSample(lowStressValue);
      }
    });

    expect(useSentinelStore.getState().protocol).toBe('DEEP_DIVE');
    expect(useResonanceStore.getState().decayRate).toBe(RESONANCE_DECAY_RATE * 0.8);
  });
});
