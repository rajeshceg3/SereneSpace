import { useRespirationStore, BreathPhase, BREATH_PATTERNS, type BreathPattern } from '../stores/useRespirationStore';
import { audioEngine } from './AudioEngine';

class RespirationControllerService {
  private elapsedInPhase: number = 0;
  private currentValue: number = 0; // 0.0 to 1.0 (Lung volume)
  private _lastPhase: BreathPhase = BreathPhase.INHALE;

  // Microphone State
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micBuffer: Uint8Array | null = null;
  private isInitializingMic: boolean = false;

  // Coherence State
  private lastBreathTime: number = 0;
  private breathIntervals: number[] = [];
  private readonly MAX_HISTORY = 10;
  private isBreathing: boolean = false;
  private breathThresholdHigh = 0.05; // Trigger ON
  private breathThresholdLow = 0.02;  // Trigger OFF

  public update(deltaTime: number): void {
    const state = useRespirationStore.getState();

    // If not active, reset to neutral state
    if (!state.isActive) {
      this.currentValue = 0;
      this.elapsedInPhase = 0;
      if (this._lastPhase !== BreathPhase.INHALE) {
         this._lastPhase = BreathPhase.INHALE;
         state.setPhase(BreathPhase.INHALE);
      }
      this.stopMicrophone();
      return;
    }

    // Handle Input Modes
    if (state.inputMode === 'MICROPHONE') {
        if (!this.micStream && !this.isInitializingMic) {
            this.initMicrophone();
        }
        this.updateFromMicrophone();
        return; // Skip procedural update
    } else {
        if (this.micStream) {
            this.stopMicrophone();
        }
    }

    const pattern = BREATH_PATTERNS[state.selectedPatternId];
    if (!pattern) return;

    this.elapsedInPhase += deltaTime;

    let currentPhase = state.currentPhase;
    let duration = this.getDuration(pattern, currentPhase);

    // Phase Transition
    if (this.elapsedInPhase >= duration) {
      this.elapsedInPhase = Math.max(0, this.elapsedInPhase - duration); // Carry over extra time?
      // Actually, simple reset is safer for now, but carry over is more accurate.
      // Let's stick to reset to avoid multiple transitions in one frame loop (though unlikely with 60fps).
      this.elapsedInPhase = 0;

      const nextPhase = this.getNextPhase(currentPhase, pattern);

      // Update Store
      state.setPhase(nextPhase);
      this._lastPhase = nextPhase;
      currentPhase = nextPhase;

      // Update duration for new phase
      duration = this.getDuration(pattern, currentPhase);
    }

    // Calculate Value (0.0 to 1.0)
    this.calculateValue(currentPhase, duration);
  }

  private async initMicrophone() {
    this.isInitializingMic = true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.micStream = stream;

        const ctx = audioEngine.getContext();
        if (ctx) {
            this.micSource = ctx.createMediaStreamSource(stream);
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.5;
            this.micSource.connect(this.analyser);
            this.micBuffer = new Uint8Array(this.analyser.frequencyBinCount);
        }
    } catch (err) {
        console.error('Microphone access denied:', err);
        // Fallback to procedural
        useRespirationStore.getState().setInputMode('PROCEDURAL');
    } finally {
        this.isInitializingMic = false;
    }
  }

  private stopMicrophone() {
    if (this.micStream) {
        this.micStream.getTracks().forEach(track => track.stop());
        this.micStream = null;
    }
    if (this.micSource) {
        this.micSource.disconnect();
        this.micSource = null;
    }
    // Don't disconnect analyser as we might reuse context? Actually node creation is cheap.
    this.analyser = null;

    // Reset Coherence State
    this.breathIntervals = [];
    this.lastBreathTime = 0;
    this.isBreathing = false;
  }

  private updateFromMicrophone() {
    if (!this.analyser || !this.micBuffer) return;

    // Use time domain data for waveform amplitude
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyser.getByteTimeDomainData(this.micBuffer as any);

    let sum = 0;
    // Calculate RMS
    for (let i = 0; i < this.micBuffer.length; i++) {
        const val = (this.micBuffer[i] - 128) / 128.0; // Normalize -1 to 1
        sum += val * val;
    }
    const rms = Math.sqrt(sum / this.micBuffer.length);

    // Map RMS to Breath Value (0 to 1) with some gain
    // Sensitivity factor: 5.0
    const target = Math.min(rms * 5.0, 1.0);

    // Smooth transition
    this.currentValue += (target - this.currentValue) * 0.1;

    // --- Breath Detection Logic ---
    const now = performance.now();

    if (!this.isBreathing && this.currentValue > this.breathThresholdHigh) {
        // Breath Start (Inhale/Exhale Pulse)
        this.isBreathing = true;

        if (this.lastBreathTime > 0) {
            const interval = (now - this.lastBreathTime) / 1000; // Seconds
            // Filter noise: Breaths are rarely faster than 1s (60bpm) or slower than 15s (4bpm)
            if (interval > 1.0 && interval < 15.0) {
                this.addBreathInterval(interval);
            }
        }
        this.lastBreathTime = now;
    } else if (this.isBreathing && this.currentValue < this.breathThresholdLow) {
        // Breath End
        this.isBreathing = false;
    }
  }

  private addBreathInterval(interval: number) {
      this.breathIntervals.push(interval);
      if (this.breathIntervals.length > this.MAX_HISTORY) {
          this.breathIntervals.shift();
      }
      this.calculateCoherence();
  }

  private calculateCoherence() {
      if (this.breathIntervals.length < 2) return;

      // Calculate Mean Interval
      const mean = this.breathIntervals.reduce((a, b) => a + b, 0) / this.breathIntervals.length;

      // Calculate Variance
      const variance = this.breathIntervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.breathIntervals.length;
      const stdDev = Math.sqrt(variance);

      // Coherence Score: Consistency of rhythm
      // CV = stdDev / mean
      const cv = stdDev / mean;
      // Formula: 100 * (1 - cv*2) clamped. (CV of 0.5 -> 0 score)
      const score = Math.max(0, Math.min(100, 100 * (1 - cv * 2)));

      // Breath Rate (BPM) estimation
      // Assuming intervals are "Half-Cycles" (Inhale... Exhale...), Full Cycle = 2 * Mean
      // BPM = 60 / (Mean * 2) = 30 / Mean
      // If intervals are Full Cycles (continuous breathing), BPM = 60 / Mean.
      // Given the microphone gap logic, it's safer to assume pulses.
      // Let's assume 30 / Mean for now as a conservative estimate.
      const bpm = Math.round(30 / mean);

      useRespirationStore.getState().setCoherence(score);
      useRespirationStore.getState().setBreathRate(bpm);
  }

  private getDuration(pattern: BreathPattern, phase: BreathPhase): number {
    switch (phase) {
      case BreathPhase.INHALE: return pattern.durations.inhale;
      case BreathPhase.HOLD_IN: return pattern.durations.holdIn;
      case BreathPhase.EXHALE: return pattern.durations.exhale;
      case BreathPhase.HOLD_OUT: return pattern.durations.holdOut;
    }
    return 1;
  }

  private getNextPhase(current: BreathPhase, pattern: BreathPattern): BreathPhase {
    switch (current) {
      case BreathPhase.INHALE:
        return pattern.durations.holdIn > 0 ? BreathPhase.HOLD_IN : BreathPhase.EXHALE;
      case BreathPhase.HOLD_IN:
        return BreathPhase.EXHALE;
      case BreathPhase.EXHALE:
        return pattern.durations.holdOut > 0 ? BreathPhase.HOLD_OUT : BreathPhase.INHALE;
      case BreathPhase.HOLD_OUT:
        return BreathPhase.INHALE;
    }
    return BreathPhase.INHALE;
  }

  private calculateValue(phase: BreathPhase, duration: number) {
    // Prevent divide by zero if duration is 0 (shouldn't happen with valid phase logic but good safety)
    if (duration <= 0) {
        // If duration is 0, we shouldn't remain in this phase, but if we are here:
        // Assume completed state of that phase
        if (phase === BreathPhase.INHALE || phase === BreathPhase.HOLD_IN) this.currentValue = 1;
        else this.currentValue = 0;
        return;
    }

    const progress = Math.min(this.elapsedInPhase / duration, 1.0);

    // Sine Easing: (1 - cos(t * PI)) / 2 for 0->1
    const eased = (1 - Math.cos(progress * Math.PI)) / 2;

    switch (phase) {
      case BreathPhase.INHALE:
        this.currentValue = eased;
        break;
      case BreathPhase.HOLD_IN:
        this.currentValue = 1.0;
        break;
      case BreathPhase.EXHALE:
        this.currentValue = 1.0 - eased;
        break;
      case BreathPhase.HOLD_OUT:
        this.currentValue = 0.0;
        break;
    }
  }

  public getValue(): number {
    return this.currentValue;
  }
}

export const RespirationController = new RespirationControllerService();
