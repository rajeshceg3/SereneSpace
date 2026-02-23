import { audioEngine } from './AudioEngine';
import { useEchoStore, type EchoSnapshot } from '../stores/useEchoStore';
import { useRespirationStore } from '../stores/useRespirationStore';
import { useBioLinkStore } from '../stores/useBioLinkStore';
import { PredictiveModel } from './PredictiveModel';

class EchoChamber {
  private static instance: EchoChamber;
  private intervalId: number | null = null;
  private model: PredictiveModel;

  // Strategy State
  private lastActionTime: number = 0;
  private actionCooldown: number = 5000; // 5 seconds
  private adaptationAggression: number = 0.5; // 0-1

  private constructor() {
    this.model = new PredictiveModel(10000, 5); // 10s window
  }

  public static getInstance(): EchoChamber {
    if (!EchoChamber.instance) {
      EchoChamber.instance = new EchoChamber();
    }
    return EchoChamber.instance;
  }

  public start() {
    if (this.intervalId) return;
    console.log('[ECHO] Starting Cognitive Echo Optimization Loop');
    this.intervalId = window.setInterval(() => this.optimize(), 2000); // Check every 2s
  }

  public stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public setAggression(value: number) {
    this.adaptationAggression = Math.max(0, Math.min(1, value));
  }

  private optimize() {
    const echoStore = useEchoStore.getState();
    if (!echoStore.isEnabled || echoStore.mode === 'LOCKED' || echoStore.mode === 'MANUAL') return;

    const stress = this.calculateCombinedStress();
    const coherence = this.calculateCoherence();

    // Feed the model
    const now = Date.now();
    this.model.addSample(stress, now);

    // Analyze Trend
    const analysis = this.model.analyze(5); // Project 5s ahead

    // Calculate Resonance Score (Correlation of Audio Stability to Stress Reduction)
    // Simple heuristic: 100 - (Stress * 100)
    const resonance = Math.round((1 - stress) * 100);
    echoStore.updateMetrics(stress, coherence, resonance);

    // Decision Logic
    if (now - this.lastActionTime < this.actionCooldown) return;

    if (echoStore.mode === 'MONITOR') {
        // Just observing, maybe auto-switch to ADAPT if stress is high
        if (stress > 0.6 && analysis.velocity > 0) {
            echoStore.setMode('ADAPT');
        }
        return;
    }

    if (echoStore.mode === 'ADAPT') {
        if (analysis.velocity > 0.02) {
            // Stress is rising -> Change Strategy
            this.modulateStrategy(analysis.velocity);
            this.lastActionTime = now;
        } else if (analysis.velocity < -0.01) {
            // Stress is falling -> Reinforce Strategy
            this.reinforceStrategy(resonance);
            this.lastActionTime = now;
        }
    }
  }

  private calculateCombinedStress(): number {
    const respStore = useRespirationStore.getState();
    const bioStore = useBioLinkStore.getState();

    // Base stress from breath coherence (inverted: 100 coherence = 0 stress)
    let stress = 1 - (respStore.coherence / 100);

    // If BioLink connected, mix in HRV (inverted: high HRV = low stress)
    if (bioStore.isConnected && bioStore.hrv > 0) {
        // Normalize HRV (typical range 20-100ms)
        const hrvScore = Math.min(1, Math.max(0, (bioStore.hrv - 20) / 80));
        const hrvStress = 1 - hrvScore;

        stress = (stress * 0.6) + (hrvStress * 0.4);
    }

    return Math.max(0, Math.min(1, stress));
  }

  private calculateCoherence(): number {
      return useRespirationStore.getState().coherence;
  }

  private modulateStrategy(velocity: number) {
    // Stress is rising. We need to ground the user.
    // 1. Lower Drone Frequency (Grounding)
    // 2. Increase Brown Noise (Masking/Womb-like)
    // 3. Decrease Pink Noise (Reduce high-freq energy)

    const intensity = Math.min(1, velocity * 10 * this.adaptationAggression);

    // Nudge Drone down
    audioEngine.nudgeDroneFrequency(-2 * intensity);

    // Adjust Noise: More Brown, Less Pink
    const currentMix = audioEngine.getMixState();
    audioEngine.setNoiseTextureBalance(
        Math.max(0, currentMix.pinkNoise - (0.1 * intensity)),
        Math.min(1, currentMix.brownNoise + (0.1 * intensity))
    );

    // Update Store
    this.syncAudioState();
  }

  private reinforceStrategy(resonance: number) {
    // Current state is working.
    // Take a snapshot
    const mix = audioEngine.getMixState();
    const snapshot: EchoSnapshot = {
        timestamp: Date.now(),
        stress: this.calculateCombinedStress(),
        coherence: this.calculateCoherence(),
        audioState: {
            droneFreq: 110, // Placeholder, need accessor in AudioEngine or track it here
            binauralFreq: 10,
            pinkNoise: mix.pinkNoise,
            brownNoise: mix.brownNoise
        },
        resonanceScore: resonance
    };

    useEchoStore.getState().addSnapshot(snapshot);
  }

  private syncAudioState() {
      // Pull latest state from AudioEngine and update UI store
      const mix = audioEngine.getMixState();
      // Note: AudioEngine doesn't expose current freq via getter easily without refactor.
      // For now, we trust the nudge logic.
      useEchoStore.getState().updateAudioState(
          110, // TODO: Get actual freq
          10,  // TODO: Get actual freq
          mix.pinkNoise,
          mix.brownNoise
      );
  }
}

export const echoChamber = EchoChamber.getInstance();
