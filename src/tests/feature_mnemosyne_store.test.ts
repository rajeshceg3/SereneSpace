import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTelemetryStore } from '../stores/useTelemetryStore';

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
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', { localStorage: localStorageMock });

describe('useTelemetryStore - Mnemosyne Feature', () => {
  beforeEach(() => {
    useTelemetryStore.setState({
      sessionData: [],
      sessionPath: [],
      history: [],
      isRecording: true,
    });
    localStorageMock.clear();
  });

  it('should log spatial samples', () => {
    const store = useTelemetryStore.getState();
    store.logSpatialSample(1, 2, 3, 0.5, 80);

    const state = useTelemetryStore.getState();
    expect(state.sessionPath).toHaveLength(1);
    expect(state.sessionPath[0]).toMatchObject({
      x: 1, y: 2, z: 3, stress: 0.5, coherence: 80
    });
  });

  it('should archive session path to history', () => {
    const store = useTelemetryStore.getState();

    // Add some data
    store.logSample(0.5); // Need at least one sample to archive
    store.logSpatialSample(1, 1, 1, 0.1, 90);
    store.logSpatialSample(2, 2, 2, 0.2, 85);

    store.archiveSession();

    const state = useTelemetryStore.getState();

    // Session should be cleared
    expect(state.sessionPath).toHaveLength(0);
    expect(state.sessionData).toHaveLength(0);

    // History should have 1 entry
    expect(state.history).toHaveLength(1);
    expect(state.history[0].sessionPath).toHaveLength(2);
    expect(state.history[0].sessionPath?.[0].x).toBe(1);
    expect(state.history[0].sessionPath?.[1].x).toBe(2);
  });

  it('should persist history to localStorage', () => {
    const store = useTelemetryStore.getState();
    store.logSample(0.5);
    store.logSpatialSample(10, 20, 30, 0.5, 50);
    store.archiveSession();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'telemetry_history',
      expect.stringContaining('"x":10')
    );
  });
});
