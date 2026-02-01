import { describe, it, expect, beforeEach } from 'vitest';
import { RespirationController } from '../../services/RespirationController';
import { useRespirationStore, BreathPhase } from '../../stores/useRespirationStore';

describe('RespirationController', () => {
  beforeEach(() => {
    // Reset Store
    useRespirationStore.setState({
      isActive: false,
      selectedPatternId: 'COHERENCE', // 5.5 in, 5.5 out
      currentPhase: BreathPhase.INHALE,
    });

    // Reset Controller (trickier since it's a singleton with private state)
    // We can reset it by calling update with a large delta while inactive,
    // or by toggling active off then on.
    // The code says: if (!active) { reset; return; }

    // Ensure it resets
    useRespirationStore.setState({ isActive: false });
    RespirationController.update(1.0);
  });

  it('should not update value if inactive', () => {
    useRespirationStore.setState({ isActive: false });
    RespirationController.update(1.0);
    expect(RespirationController.getValue()).toBe(0);
  });

  it('should advance phase correctly (Coherence: 5.5s)', () => {
    useRespirationStore.setState({ isActive: true });

    // Initially Inhale (0s elapsed)
    expect(useRespirationStore.getState().currentPhase).toBe(BreathPhase.INHALE);

    // Advance 5.4s
    RespirationController.update(5.4);
    expect(useRespirationStore.getState().currentPhase).toBe(BreathPhase.INHALE);

    // Advance 0.2s (Total 5.6s) -> Should switch to EXHALE (Coherence has 0 hold)
    RespirationController.update(0.2);
    expect(useRespirationStore.getState().currentPhase).toBe(BreathPhase.EXHALE);
  });

  it('should calculate value correctly during inhale', () => {
    useRespirationStore.setState({ isActive: true });
    // Inhale duration 5.5s

    // At 0s -> 0
    expect(RespirationController.getValue()).toBeCloseTo(0);

    // At 2.75s (Halfway) -> 0.5 (Sine wave: (1 - cos(0.5*PI))/2 = (1 - 0)/2 = 0.5)
    RespirationController.update(2.75);
    expect(RespirationController.getValue()).toBeCloseTo(0.5);

    // At 5.5s -> 1.0
    RespirationController.update(2.75);
    // Note: It might have switched phase exactly at 5.5, so value might be starting Exhale (1.0)
    // Let's check value is close to 1
    expect(RespirationController.getValue()).toBeGreaterThan(0.9);
  });

  it('should handle Hold phases (Relax 4-7-8)', () => {
    useRespirationStore.setState({ isActive: true, selectedPatternId: 'RELAX_478' });

    // Inhale 4s
    RespirationController.update(4.01);
    expect(useRespirationStore.getState().currentPhase).toBe(BreathPhase.HOLD_IN);
    expect(RespirationController.getValue()).toBe(1.0);

    // Hold 7s
    RespirationController.update(6.9);
    expect(useRespirationStore.getState().currentPhase).toBe(BreathPhase.HOLD_IN);

    RespirationController.update(0.2); // Total hold > 7s
    expect(useRespirationStore.getState().currentPhase).toBe(BreathPhase.EXHALE);
  });
});
