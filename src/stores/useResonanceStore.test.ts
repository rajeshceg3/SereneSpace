import { describe, it, expect, beforeEach } from 'vitest';
import { useResonanceStore } from './useResonanceStore';
import { RESONANCE_DECAY_RATE } from '../constants';

describe('useResonanceStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useResonanceStore.setState({
      currentStress: 0,
      decayRate: RESONANCE_DECAY_RATE
    });
  });

  it('should initialize with 0 stress', () => {
    expect(useResonanceStore.getState().currentStress).toBe(0);
  });

  it('should add stress correctly', () => {
    useResonanceStore.getState().addStress(0.5);
    expect(useResonanceStore.getState().currentStress).toBe(0.5);
  });

  it('should cap stress at 1', () => {
    useResonanceStore.getState().addStress(1.5);
    expect(useResonanceStore.getState().currentStress).toBe(1);
  });

  it('should decay stress correctly', () => {
    useResonanceStore.getState().addStress(0.5);
    useResonanceStore.getState().decayStress();
    expect(useResonanceStore.getState().currentStress).toBe(0.5 - RESONANCE_DECAY_RATE);
  });

  it('should not decay below 0', () => {
    useResonanceStore.getState().decayStress();
    expect(useResonanceStore.getState().currentStress).toBe(0);
  });

  it('should allow updating decay rate', () => {
    const newRate = 0.05;
    useResonanceStore.getState().setDecayRate(newRate);
    expect(useResonanceStore.getState().decayRate).toBe(newRate);
  });

  it('should use updated decay rate when decaying', () => {
    const newRate = 0.1;
    useResonanceStore.getState().setDecayRate(newRate);
    useResonanceStore.getState().addStress(0.5);
    useResonanceStore.getState().decayStress();
    // 0.5 - 0.1 = 0.4
    // Float precision might vary, so using closeTo if needed, but simple subtraction usually safe for this range
    expect(useResonanceStore.getState().currentStress).toBeCloseTo(0.4);
  });
});
