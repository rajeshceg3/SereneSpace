import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { SentinelSystem } from '../components/SentinelSystem';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import { SENTINEL_PROTOCOLS } from '../constants';

const { act } = ReactThreeTestRenderer;

describe('SentinelSystem', () => {
  beforeEach(() => {
    act(() => {
      useResonanceStore.setState({ currentStress: 0, decayRate: SENTINEL_PROTOCOLS.OBSERVER.decayRate });
      useSentinelStore.setState({ activeProtocol: 'OBSERVER' });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with OBSERVER protocol', async () => {
    await ReactThreeTestRenderer.create(<SentinelSystem />);
    expect(useSentinelStore.getState().activeProtocol).toBe('OBSERVER');
  });

  it('switches to GUIDANCE after high stress sustained', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelSystem />);

    // Set high stress
    act(() => {
      useResonanceStore.setState({ currentStress: 0.9 });
    });

    // Advance frame by 2 seconds
    await act(async () => {
      await renderer.advanceFrames(1, 2.0);
    });
    expect(useSentinelStore.getState().activeProtocol).toBe('OBSERVER');

    // Advance more
    await act(async () => {
      await renderer.advanceFrames(1, 1.5);
    });
    expect(useSentinelStore.getState().activeProtocol).toBe('GUIDANCE');
    expect(useResonanceStore.getState().decayRate).toBe(SENTINEL_PROTOCOLS.GUIDANCE.decayRate);
  });

  it('switches to DEEP_DIVE after low stress sustained', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelSystem />);

    // Set low stress
    act(() => {
      useResonanceStore.setState({ currentStress: 0.1 });
    });

    // Advance frame
    await act(async () => {
      await renderer.advanceFrames(1, 4.0);
    });
    expect(useSentinelStore.getState().activeProtocol).toBe('OBSERVER');

    // Advance more
    await act(async () => {
      await renderer.advanceFrames(1, 2.0);
    });
    expect(useSentinelStore.getState().activeProtocol).toBe('DEEP_DIVE');
    expect(useResonanceStore.getState().decayRate).toBe(SENTINEL_PROTOCOLS.DEEP_DIVE.decayRate);
  });

  it('reverts to OBSERVER immediately when conditions broken', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SentinelSystem />);

    // Force GUIDANCE
    act(() => {
      useSentinelStore.setState({ activeProtocol: 'GUIDANCE' });
      useResonanceStore.setState({ currentStress: 0.9 });
    });

    // Confirm stable
    await act(async () => {
      await renderer.advanceFrames(1, 0.1);
    });
    expect(useSentinelStore.getState().activeProtocol).toBe('GUIDANCE');

    // Drop stress
    act(() => {
      useResonanceStore.setState({ currentStress: 0.5 });
    });

    await act(async () => {
      await renderer.advanceFrames(1, 0.1);
    });
    expect(useSentinelStore.getState().activeProtocol).toBe('OBSERVER');
  });
});
