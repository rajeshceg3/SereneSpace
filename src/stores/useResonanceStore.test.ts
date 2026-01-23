import { describe, it, expect, beforeEach } from 'vitest';
import { useResonanceStore } from './useResonanceStore';
import { RESONANCE_DECAY_RATE } from '../constants';

describe('useResonanceStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useResonanceStore.setState({ currentStress: 0 });
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
});
