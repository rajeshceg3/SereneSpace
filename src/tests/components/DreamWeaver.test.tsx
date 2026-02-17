import { describe, it, expect, vi, beforeEach } from 'vitest';
// We don't need test-renderer if we mock useFrame directly for logic testing,
// but we still need to render the component to trigger the hook.
import { render } from '@testing-library/react';
import { DreamWeaver } from '../../components/DreamWeaver';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { usePredictionStore } from '../../stores/usePredictionStore';
import { useNarrativeStore } from '../../stores/useNarrativeStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useRespirationStore } from '../../stores/useRespirationStore';
import { narrativeEngine } from '../../services/NarrativeEngine';
import { audioEngine } from '../../services/AudioEngine';
import * as R3F from '@react-three/fiber';

// Mock R3F
vi.mock('@react-three/fiber', async () => {
  return {
    useFrame: vi.fn(),
  };
});

// Mock services
vi.mock('../../services/NarrativeEngine', () => ({
  narrativeEngine: {
    determineArc: vi.fn(),
  }
}));

vi.mock('../../services/AudioEngine', () => ({
  audioEngine: {
    updateNarrative: vi.fn(),
  }
}));

describe('DreamWeaver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useResonanceStore.setState({ currentStress: 0.5 });
    usePredictionStore.setState({ stressVelocity: 0.1, projectedStress: 0.6, confidence: 0.8 });
    useNarrativeStore.setState({ currentArc: 'INITIATION', intensity: 0 });
    useRespirationStore.setState({ coherence: 80 });

    // Mock Telemetry Store state since we access getState() directly
    useTelemetryStore.setState({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        history: [{ coherenceScore: 90 } as any], // Mock history
        isRecording: false,
        sessionData: [],
        sessionPath: [],
        isDebriefOpen: false,
        logSample: vi.fn(),
        logSpatialSample: vi.fn(),
        logEvent: vi.fn(),
        toggleRecording: vi.fn(),
        setDebriefOpen: vi.fn(),
        resetSession: vi.fn(),
        archiveSession: vi.fn(),
    });
  });

  it('should update narrative store based on engine result', () => {
    // Mock engine result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (narrativeEngine.determineArc as any).mockReturnValue({ arc: 'ASCENSION', intensity: 0.8 });

    // Render the component (headless, just to run hooks)
    render(<DreamWeaver />);

    // Get the registered useFrame callback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const useFrameMock = R3F.useFrame as any;
    expect(useFrameMock).toHaveBeenCalled();
    const frameCallback = useFrameMock.mock.calls[0][0];

    // Simulate frame at t=1.1 (initial lastUpdate=0)
    // DreamWeaver logic: if (now - lastUpdate > 1.0)
    frameCallback({ clock: { elapsedTime: 1.1 } });

    expect(narrativeEngine.determineArc).toHaveBeenCalled();

    // Verify arguments passed to engine (should use coherence from store = 90)
    // determineArc(currentArc, stress, velocity, sessionCoherence, breathCoherence)
    expect(narrativeEngine.determineArc).toHaveBeenCalledWith('INITIATION', 0.5, 0.1, 90, 80);

    expect(useNarrativeStore.getState().currentArc).toBe('ASCENSION');
    expect(useNarrativeStore.getState().intensity).toBe(0.8);

    expect(audioEngine.updateNarrative).toHaveBeenCalledWith('ASCENSION', 0.8);
  });
});
