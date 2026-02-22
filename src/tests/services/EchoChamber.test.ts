import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { echoChamber } from '../../services/EchoChamber';
import { useEchoStore } from '../../stores/useEchoStore';
import { useRespirationStore } from '../../stores/useRespirationStore';
import { audioEngine } from '../../services/AudioEngine';

// Mock AudioEngine
vi.mock('../../services/AudioEngine', () => ({
  audioEngine: {
    nudgeDroneFrequency: vi.fn(),
    setNoiseTextureBalance: vi.fn(),
    getMixState: vi.fn().mockReturnValue({ pinkNoise: 0.5, brownNoise: 0.5 }),
    setManualFrequency: vi.fn(),
  }
}));

describe('EchoChamber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useEchoStore.setState({ mode: 'ADAPT', isEnabled: true });
    useRespirationStore.setState({ coherence: 50 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    echoChamber.stop();
  });

  it('should start and stop the optimization loop', () => {
    const optimizeSpy = vi.spyOn(echoChamber as any, 'optimize');
    echoChamber.start();

    vi.advanceTimersByTime(2000);
    expect(optimizeSpy).toHaveBeenCalled();

    echoChamber.stop();
    vi.advanceTimersByTime(2000);
    expect(optimizeSpy).toHaveBeenCalledTimes(1); // Should not increase
  });

  it('should modulate strategy when stress is rising', () => {
    // Simulate rising stress via calculateCombinedStress logic
    // We can't easily mock the private method, but we can influence the store values
    // stress = 1 - coherence/100.
    // coherence 50 -> stress 0.5.

    echoChamber.start();

    // Initial state: stress 0.5
    vi.advanceTimersByTime(2000);

    // Increase stress (lower coherence)
    useRespirationStore.setState({ coherence: 20 }); // Stress 0.8
    vi.advanceTimersByTime(2000); // Add sample

    // Increase stress more
    useRespirationStore.setState({ coherence: 10 }); // Stress 0.9
    vi.advanceTimersByTime(2000); // Add sample

    // Now velocity should be positive -> modulateStrategy
    // Default aggression is 0.5.

    // Check if AudioEngine methods were called
    // Note: PredictiveModel needs enough samples (minSamples=5 in EchoChamber config?)
    // In EchoChamber: this.model = new PredictiveModel(10000, 5);
    // We need 5 samples.

    useRespirationStore.setState({ coherence: 5 });
    vi.advanceTimersByTime(2000);
    useRespirationStore.setState({ coherence: 0 });
    vi.advanceTimersByTime(2000);

    expect(audioEngine.nudgeDroneFrequency).toHaveBeenCalled();
  });
});
