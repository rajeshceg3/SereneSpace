// src/stores/useDestinationStore.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDestinationStore } from './useDestinationStore';
import { act } from '@testing-library/react';

// Mock fetch
const mockDestinations = [
  { id: '1', name: 'Mars', coordinates: [1, 1, 1], description: 'Red Planet', ambientColor: '#ff0000' },
  { id: '2', name: 'Jupiter', coordinates: [2, 2, 2], description: 'Gas Giant', ambientColor: '#ff8800' },
];

global.fetch = vi.fn();

describe('useDestinationStore', () => {
  beforeEach(() => {
    // Reset the store's state before each test
    act(() => {
      useDestinationStore.setState({
        destinations: [],
        activeDestination: null,
        hoveredDestination: null,
        activeDestinationDetails: null,
        cameraTargetZ: 0,
        isUiVisible: false,
        uiVisibilityTimer: null,
        isLoading: true,
        error: null,
      });
    });
    vi.useFakeTimers();
    (global.fetch as vi.Mock).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch destinations and set the first one as active', async () => {
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDestinations),
    });

    await act(async () => {
      await useDestinationStore.getState().fetchDestinations();
    });

    const state = useDestinationStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.destinations).toEqual(mockDestinations);
    expect(state.activeDestination).toBe(mockDestinations[0].id);
    expect(state.activeDestinationDetails).toEqual(mockDestinations[0]);
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as vi.Mock).mockResolvedValue({ ok: false });

    await act(async () => {
      await useDestinationStore.getState().fetchDestinations();
    });

    const state = useDestinationStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed to load destination data.');
    expect(state.destinations).toEqual([]);
  });

  it('should set an active destination and manage UI visibility', () => {
    act(() => {
      useDestinationStore.setState({ destinations: mockDestinations });
      useDestinationStore.getState().setActiveDestination('2');
    });

    let state = useDestinationStore.getState();
    expect(state.activeDestination).toBe('2');
    expect(state.activeDestinationDetails).toEqual(mockDestinations[1]);
    expect(state.isUiVisible).toBe(false); // UI is not visible immediately

    // Fast-forward timers
    act(() => {
      vi.runAllTimers();
    });

    state = useDestinationStore.getState();
    expect(state.isUiVisible).toBe(true);
  });

  it('should clear the active destination', () => {
    act(() => {
      useDestinationStore.setState({ activeDestination: '1', activeDestinationDetails: mockDestinations[0] });
      useDestinationStore.getState().setActiveDestination(null);
    });

    const state = useDestinationStore.getState();
    expect(state.activeDestination).toBe(null);
    expect(state.activeDestinationDetails).toBe(null);
    expect(state.isUiVisible).toBe(false);
  });

  it('should respect reduced motion preference', () => {
    const state = useDestinationStore.getState();
    // Based on our mock, this should be true
    expect(state.reducedMotion).toBe(true);
  });
});
