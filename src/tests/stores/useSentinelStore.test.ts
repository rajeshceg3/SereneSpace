import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useSentinelStore } from '../../stores/useSentinelStore';

describe('useSentinelStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSentinelStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with OBSERVER protocol', () => {
    const state = useSentinelStore.getState();
    expect(state.activeProtocol).toBe('OBSERVER');
  });

  it('should update protocol and timestamp', () => {
    const initialTime = new Date(2024, 1, 1, 12, 0, 0).getTime();
    vi.setSystemTime(initialTime);
    useSentinelStore.getState().reset(); // Reset to set initial time

    const newTime = new Date(2024, 1, 1, 12, 1, 0).getTime();
    vi.setSystemTime(newTime);

    useSentinelStore.getState().setProtocol('GUIDANCE');

    const state = useSentinelStore.getState();
    expect(state.activeProtocol).toBe('GUIDANCE');
    expect(state.lastSwitchTime).toBe(newTime);
  });

  it('should not update if protocol is same', () => {
    const initialTime = new Date(2024, 1, 1, 12, 0, 0).getTime();
    vi.setSystemTime(initialTime);
    useSentinelStore.getState().reset();

    const newTime = new Date(2024, 1, 1, 12, 1, 0).getTime();
    vi.setSystemTime(newTime);

    // Set to same protocol
    useSentinelStore.getState().setProtocol('OBSERVER');

    const state = useSentinelStore.getState();
    expect(state.activeProtocol).toBe('OBSERVER');
    expect(state.lastSwitchTime).toBe(initialTime); // Time should NOT change
  });

  it('should reset to OBSERVER', () => {
    useSentinelStore.getState().setProtocol('DEEP_DIVE');
    useSentinelStore.getState().reset();

    const state = useSentinelStore.getState();
    expect(state.activeProtocol).toBe('OBSERVER');
  });
});
