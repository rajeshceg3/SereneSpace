import { describe, it, expect, beforeEach } from 'vitest';
import { useSentinelStore } from '../stores/useSentinelStore';

describe('useSentinelStore', () => {
  beforeEach(() => {
    useSentinelStore.getState().resetSentinel();
  });

  it('should initialize with OBSERVER protocol', () => {
    const state = useSentinelStore.getState();
    expect(state.protocol).toBe('OBSERVER');
    expect(state.coherence).toBe(50);
  });

  it('should switch to GUIDANCE when stress is high (> 0.6)', () => {
    const highStressData = Array(10).fill({ timestamp: Date.now(), value: 0.8 });

    useSentinelStore.getState().evaluate(highStressData);

    const state = useSentinelStore.getState();
    expect(state.protocol).toBe('GUIDANCE');
    expect(state.activeParameters.decayRate).toBeGreaterThan(0.005); // Should be higher than default
  });

  it('should switch to DEEP_DIVE when stress is low (< 0.2)', () => {
    const lowStressData = Array(10).fill({ timestamp: Date.now(), value: 0.1 });

    useSentinelStore.getState().evaluate(lowStressData);

    const state = useSentinelStore.getState();
    expect(state.protocol).toBe('DEEP_DIVE');
    expect(state.activeParameters.decayRate).toBeLessThan(0.005); // Should be lower than default
  });

  it('should return to OBSERVER for moderate stress', () => {
    const moderateStressData = Array(10).fill({ timestamp: Date.now(), value: 0.4 });

    useSentinelStore.getState().setProtocol('GUIDANCE'); // Force different state
    useSentinelStore.getState().evaluate(moderateStressData);

    const state = useSentinelStore.getState();
    expect(state.protocol).toBe('OBSERVER');
  });

  it('should ignore evaluation if not enough data points', () => {
    const sparseData = Array(2).fill({ timestamp: Date.now(), value: 0.9 });

    useSentinelStore.getState().evaluate(sparseData);

    const state = useSentinelStore.getState();
    expect(state.protocol).toBe('OBSERVER'); // Should not switch despite high stress
  });
});
