import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTelemetryStore } from '../stores/useTelemetryStore';

describe('useTelemetryStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useTelemetryStore.setState({
      sessionData: [],
      isRecording: true,
      isDebriefOpen: false,
    });
    vi.useFakeTimers();
  });

  it('should initialize with default state', () => {
    const state = useTelemetryStore.getState();
    expect(state.sessionData).toEqual([]);
    expect(state.isRecording).toBe(true);
    expect(state.isDebriefOpen).toBe(false);
  });

  it('should log a sample', () => {
    const value = 0.5;
    useTelemetryStore.getState().logSample(value);

    const state = useTelemetryStore.getState();
    expect(state.sessionData).toHaveLength(1);
    expect(state.sessionData[0].value).toBe(value);
    expect(state.sessionData[0].timestamp).toBeDefined();
  });

  it('should log an event', () => {
    const eventName = 'Test Event';
    const value = 0.8;
    useTelemetryStore.getState().logEvent(eventName, value);

    const state = useTelemetryStore.getState();
    expect(state.sessionData).toHaveLength(1);
    expect(state.sessionData[0].event).toBe(eventName);
    expect(state.sessionData[0].value).toBe(value);
  });

  it('should not log when recording is paused', () => {
    useTelemetryStore.getState().toggleRecording(); // Turn off
    useTelemetryStore.getState().logSample(0.5);

    const state = useTelemetryStore.getState();
    expect(state.sessionData).toHaveLength(0);
  });

  it('should reset session', () => {
    useTelemetryStore.getState().logSample(0.5);
    expect(useTelemetryStore.getState().sessionData).toHaveLength(1);

    useTelemetryStore.getState().resetSession();
    expect(useTelemetryStore.getState().sessionData).toHaveLength(0);
  });
});
