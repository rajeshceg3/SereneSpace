import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { TelemetryRecorder } from '../../components/TelemetryRecorder';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { useDestinationStore } from '../../stores/useDestinationStore';

describe('TelemetryRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTelemetryStore.setState({ sessionData: [], isRecording: true });
    useResonanceStore.setState({ currentStress: 0 });
    useDestinationStore.setState({ activeDestination: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should log samples every second', () => {
    render(<TelemetryRecorder />);

    // Set stress
    useResonanceStore.setState({ currentStress: 0.5 });

    // Advance time 1.1s
    vi.advanceTimersByTime(1100);

    const data = useTelemetryStore.getState().sessionData;
    expect(data).toHaveLength(1);
    expect(data[0].value).toBe(0.5);

    // Advance another 1s
    useResonanceStore.setState({ currentStress: 0.2 });
    vi.advanceTimersByTime(1000);

    const data2 = useTelemetryStore.getState().sessionData;
    expect(data2).toHaveLength(2);
    expect(data2[1].value).toBe(0.2);
  });

  it('should log an event when destination changes', async () => {
    render(<TelemetryRecorder />);

    // Trigger destination change inside act to flush effects
    // We need to import act from @testing-library/react
    const { act } = await import('@testing-library/react');

    act(() => {
      useDestinationStore.setState({ activeDestination: 'mars' });
    });

    const data = useTelemetryStore.getState().sessionData;
    expect(data.find(d => d.event?.includes('Arrived: mars'))).toBeDefined();
  });
});
