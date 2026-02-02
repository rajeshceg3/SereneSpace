import { useRespirationStore, BREATH_PATTERNS, BreathPhase } from '../stores/useRespirationStore';
import type { BreathPattern } from '../stores/useRespirationStore';

class RespirationControllerService {
  private elapsedInPhase: number = 0;
  private currentValue: number = 0; // 0.0 to 1.0 (Lung volume)
  private _lastPhase: BreathPhase = BreathPhase.INHALE;

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
      return;
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
