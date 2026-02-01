import { describe, it, expect, beforeEach } from 'vitest';
import { useRespirationStore, BreathPhase } from '../../stores/useRespirationStore';

describe('useRespirationStore', () => {
  beforeEach(() => {
    // Reset store
    useRespirationStore.setState({
      isActive: false,
      selectedPatternId: 'COHERENCE',
      currentPhase: BreathPhase.INHALE,
    });
  });

  it('should have correct initial state', () => {
    const state = useRespirationStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.selectedPatternId).toBe('COHERENCE');
    expect(state.currentPhase).toBe(BreathPhase.INHALE);
  });

  it('should toggle active state', () => {
    useRespirationStore.getState().toggleActive();
    expect(useRespirationStore.getState().isActive).toBe(true);

    useRespirationStore.getState().toggleActive();
    expect(useRespirationStore.getState().isActive).toBe(false);
  });

  it('should set pattern only if valid', () => {
    useRespirationStore.getState().setPattern('RELAX_478');
    expect(useRespirationStore.getState().selectedPatternId).toBe('RELAX_478');

    // Invalid pattern should be ignored (or handled, implementation currently ignores checks? No, let's check implementation)
    // Implementation: if (BREATH_PATTERNS[patternId]) set(...)
    useRespirationStore.getState().setPattern('INVALID_PATTERN');
    expect(useRespirationStore.getState().selectedPatternId).toBe('RELAX_478');
  });

  it('should set phase', () => {
    useRespirationStore.getState().setPhase(BreathPhase.EXHALE);
    expect(useRespirationStore.getState().currentPhase).toBe(BreathPhase.EXHALE);
  });
});
