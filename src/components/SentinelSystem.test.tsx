import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SentinelSystem } from './SentinelSystem';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import {
  SENTINEL_PROTOCOLS,
  SENTINEL_GUIDANCE_THRESHOLD,
  SENTINEL_GUIDANCE_DURATION,
  SENTINEL_DEEP_DIVE_THRESHOLD,
  SENTINEL_DEEP_DIVE_DURATION,
} from '../constants';

// Mock useFrame
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: any) => {
    (global as any).mockUseFrameCallback = callback;
  },
}));

describe('SentinelSystem', () => {
  beforeEach(() => {
    useResonanceStore.setState({ currentStress: 0, decayRate: 0.005 });
    useSentinelStore.setState({ activeProtocol: SENTINEL_PROTOCOLS.OBSERVER });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  it('should switch to GUIDANCE when stress is high for enough time', () => {
    render(<SentinelSystem />);
    const useFrameCallback = (global as any).mockUseFrameCallback;

    // Set high stress
    useResonanceStore.setState({ currentStress: SENTINEL_GUIDANCE_THRESHOLD + 0.1 });

    // Simulate frames
    const delta = 0.1;
    const steps = (SENTINEL_GUIDANCE_DURATION / delta) + 2;

    for (let i = 0; i < steps; i++) {
        useFrameCallback({}, delta);
    }

    expect(useSentinelStore.getState().activeProtocol).toBe(SENTINEL_PROTOCOLS.GUIDANCE);
    expect(useResonanceStore.getState().decayRate).toBe(0.01);
  });

  it('should switch to DEEP_DIVE when stress is low for enough time', () => {
    render(<SentinelSystem />);
    const useFrameCallback = (global as any).mockUseFrameCallback;

    // Set low stress
    useResonanceStore.setState({ currentStress: SENTINEL_DEEP_DIVE_THRESHOLD - 0.1 });

    const delta = 0.1;
    const steps = (SENTINEL_DEEP_DIVE_DURATION / delta) + 2;

    for (let i = 0; i < steps; i++) {
        useFrameCallback({}, delta);
    }

    expect(useSentinelStore.getState().activeProtocol).toBe(SENTINEL_PROTOCOLS.DEEP_DIVE);
    expect(useResonanceStore.getState().decayRate).toBe(0.0025);
  });

  it('should revert to OBSERVER if conditions are not met', () => {
     render(<SentinelSystem />);
     const useFrameCallback = (global as any).mockUseFrameCallback;

     // Start in GUIDANCE
     useSentinelStore.setState({ activeProtocol: SENTINEL_PROTOCOLS.GUIDANCE });
     useResonanceStore.setState({ decayRate: 0.01 });

     // Drop stress below threshold
     useResonanceStore.setState({ currentStress: SENTINEL_GUIDANCE_THRESHOLD - 0.1 });

     useFrameCallback({}, 0.1);

     expect(useSentinelStore.getState().activeProtocol).toBe(SENTINEL_PROTOCOLS.OBSERVER);
     expect(useResonanceStore.getState().decayRate).toBe(0.005);
  });
});
