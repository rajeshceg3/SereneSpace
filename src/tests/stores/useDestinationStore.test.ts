// src/tests/stores/useDestinationStore.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDestinationStore } from '../../stores/useDestinationStore';
import type { Destination } from '../../types';
import { DestinationService } from '../../services/DestinationService';
import { act } from '@testing-library/react';

// Mock DestinationService
vi.mock('../../services/DestinationService', () => ({
  DestinationService: {
    fetchDestinations: vi.fn(),
  },
}));

// Mock AnalyticsService
vi.mock('../../services/AnalyticsService', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

const mockDestinations = [
  { id: '1', name: 'Mars', coordinates: [1, 1, 1] as [number, number, number], description: 'Red Planet', ambientColor: '#ff0000' },
  { id: '2', name: 'Jupiter', coordinates: [2, 2, 2] as [number, number, number], description: 'Gas Giant', ambientColor: '#ff8800' },
] as Destination[];

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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch destinations and set the first one as active', async () => {
    (DestinationService.fetchDestinations as any).mockResolvedValue(mockDestinations);

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
    (DestinationService.fetchDestinations as any).mockRejectedValue(new Error('Failed to fetch'));

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

    // Fast-forward timers by 500ms (Name reveal)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    state = useDestinationStore.getState();
    expect(state.isNameVisible).toBe(true);
    expect(state.isUiVisible).toBe(true);
    expect(state.isDetailsVisible).toBe(false);

    // Fast-forward timers by another 1000ms (Details reveal: 1500ms total)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    state = useDestinationStore.getState();
    expect(state.isDetailsVisible).toBe(true);

    // Fast-forward timers by another 4000ms (Auto hide)
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    state = useDestinationStore.getState();
    expect(state.isNameVisible).toBe(false);
    expect(state.isDetailsVisible).toBe(false);
    expect(state.isUiVisible).toBe(false);
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
    // Based on our mock, this should be false (default mock value)
    expect(state.reducedMotion).toBe(false);
  });
});
