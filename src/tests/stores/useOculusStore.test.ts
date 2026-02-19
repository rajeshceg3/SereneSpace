import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOculusStore } from '../../stores/useOculusStore';

describe('useOculusStore', () => {
  beforeEach(() => {
    useOculusStore.setState({
      isReplaying: false,
      currentTime: 0,
      duration: 0,
      playbackSpeed: 1,
      sessionData: [],
      sessionPath: [],
    });
  });

  it('should initialize with default state', () => {
    const state = useOculusStore.getState();
    expect(state.isReplaying).toBe(false);
    expect(state.currentTime).toBe(0);
  });

  it('should start replay correctly', () => {
    const now = Date.now();
    const sessionPath = [
      { timestamp: now, x: 0, y: 0, z: 0, stress: 0, coherence: 0 },
      { timestamp: now + 5000, x: 1, y: 1, z: 1, stress: 0.5, coherence: 50 },
    ];
    const sessionData = [{ timestamp: now, value: 0 }];

    useOculusStore.getState().startReplay(sessionPath, sessionData);

    const state = useOculusStore.getState();
    expect(state.isReplaying).toBe(true);
    expect(state.duration).toBe(5000);
    expect(state.sessionPath).toBe(sessionPath);
  });

  it('should tick and advance time', () => {
    const now = Date.now();
    const sessionPath = [
      { timestamp: now, x: 0, y: 0, z: 0, stress: 0, coherence: 0 },
      { timestamp: now + 5000, x: 1, y: 1, z: 1, stress: 0.5, coherence: 50 },
    ];
    useOculusStore.getState().startReplay(sessionPath, []);

    useOculusStore.getState().tick(1); // Advance 1 second

    expect(useOculusStore.getState().currentTime).toBe(1000);
  });

  it('should respect playback speed', () => {
    const now = Date.now();
    const sessionPath = [
      { timestamp: now, x: 0, y: 0, z: 0, stress: 0, coherence: 0 },
      { timestamp: now + 5000, x: 1, y: 1, z: 1, stress: 0.5, coherence: 50 },
    ];
    useOculusStore.getState().startReplay(sessionPath, []);
    useOculusStore.getState().setSpeed(2);

    useOculusStore.getState().tick(1); // Advance 1 second at 2x speed

    expect(useOculusStore.getState().currentTime).toBe(2000);
  });

  it('should stop replay when reaching duration', () => {
    const now = Date.now();
    const sessionPath = [
      { timestamp: now, x: 0, y: 0, z: 0, stress: 0, coherence: 0 },
      { timestamp: now + 1000, x: 1, y: 1, z: 1, stress: 0.5, coherence: 50 },
    ];
    useOculusStore.getState().startReplay(sessionPath, []);

    useOculusStore.getState().tick(1.1); // Advance past duration

    expect(useOculusStore.getState().isReplaying).toBe(false);
    expect(useOculusStore.getState().currentTime).toBe(1000);
  });
});
