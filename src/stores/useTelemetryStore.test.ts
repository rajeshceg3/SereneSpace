import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTelemetryStore } from './useTelemetryStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useTelemetryStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useTelemetryStore.setState({
      sessionData: [],
      history: [],
      isRecording: true,
      isDebriefOpen: false,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should calculate stats and archive session', () => {
    const { logSample, archiveSession } = useTelemetryStore.getState();

    // Simulate session
    const startTime = 1000;
    vi.setSystemTime(startTime);
    logSample(0.2); // Stress 0.2

    const midTime = 2000;
    vi.setSystemTime(midTime);
    logSample(0.8); // Stress 0.8

    const endTime = 4000; // Duration 3s
    vi.setSystemTime(endTime);
    logSample(0.5); // Stress 0.5

    // Average stress: (0.2 + 0.8 + 0.5) / 3 = 0.5
    // Coherence: (1 - 0.5) * 100 = 50

    archiveSession();

    const state = useTelemetryStore.getState();

    expect(state.sessionData).toHaveLength(0);
    expect(state.history).toHaveLength(1);

    const summary = state.history[0];
    expect(summary.duration).toBe(3); // 4000 - 1000 = 3000ms = 3s
    expect(summary.averageStress).toBeCloseTo(0.5);
    expect(summary.coherenceScore).toBe(50);
  });

  it('should persist history to localStorage', () => {
    const { logSample, archiveSession } = useTelemetryStore.getState();

    vi.setSystemTime(1000);
    logSample(0.5);
    archiveSession();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'telemetry_history',
      expect.stringContaining('"coherenceScore":50')
    );
  });

  it('should not archive empty sessions', () => {
    const { archiveSession } = useTelemetryStore.getState();
    archiveSession();
    const state = useTelemetryStore.getState();
    expect(state.history).toHaveLength(0);
  });
});
