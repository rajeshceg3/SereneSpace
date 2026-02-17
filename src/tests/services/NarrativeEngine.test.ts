import { describe, it, expect, beforeEach } from 'vitest';
import { NarrativeEngine } from '../../services/NarrativeEngine';

describe('NarrativeEngine', () => {
  let engine: NarrativeEngine;

  beforeEach(() => {
    engine = NarrativeEngine.getInstance();
  });

  it('should return INITIATION by default', () => {
    // sessionCoherence 50, breathCoherence 50 -> No Ascension
    const result = engine.determineArc('INITIATION', 0.5, 0, 50, 50);
    expect(result.arc).toBe('INITIATION');
    expect(result.intensity).toBe(0);
  });

  it('should trigger DESCENT on high stress velocity', () => {
    // stress 0.7, velocity 0.2 -> DESCENT (Bio overrides Coherence)
    const result = engine.determineArc('INITIATION', 0.7, 0.2, 50, 50);
    expect(result.arc).toBe('DESCENT');
    expect(result.intensity).toBeCloseTo(0.9); // 0.7 + 0.2
  });

  it('should trigger ASCENSION on high coherence and low stress', () => {
    // stress 0.1, velocity 0, session 80, breath 80 -> ASCENSION
    const result = engine.determineArc('INITIATION', 0.1, 0, 80, 80);
    expect(result.arc).toBe('ASCENSION');
    // Intensity = (80-70)/30 + (80-60)/40 * 0.2 = 0.33 + 0.5 * 0.2 = 0.433
    expect(result.intensity).toBeGreaterThan(0.3);
  });

  it('should NOT trigger ASCENSION if breath coherence is low', () => {
    // stress 0.1, velocity 0, session 80, breath 40 -> INITIATION
    const result = engine.determineArc('INITIATION', 0.1, 0, 80, 40);
    expect(result.arc).toBe('INITIATION');
  });

  it('should trigger STASIS on very low stress and stillness', () => {
    // stress 0.05, velocity 0 -> STASIS
    const result = engine.determineArc('INITIATION', 0.05, 0, 50, 50);
    expect(result.arc).toBe('STASIS');
    expect(result.intensity).toBeCloseTo(0.95); // 1 - 0.05
  });

  it('should implement hysteresis for ASCENSION', () => {
    // Currently ASCENSION, stress rises to 0.3 (below 0.4 threshold) -> Should stay ASCENSION
    let result = engine.determineArc('ASCENSION', 0.3, 0, 80, 80);
    expect(result.arc).toBe('ASCENSION');

    // Stress rises to 0.5 -> Should switch to INITIATION
    result = engine.determineArc('ASCENSION', 0.5, 0, 80, 80);
    expect(result.arc).toBe('INITIATION');

    // Breath drops to 30 -> Should switch to INITIATION
    result = engine.determineArc('ASCENSION', 0.1, 0, 80, 30);
    expect(result.arc).toBe('INITIATION');
  });

  it('should implement hysteresis for DESCENT', () => {
    // Currently DESCENT, stress drops to 0.4 (above 0.3 threshold) -> Should stay DESCENT
    let result = engine.determineArc('DESCENT', 0.4, 0, 50, 50);
    expect(result.arc).toBe('DESCENT');

    // Stress drops to 0.2 -> Should switch to INITIATION
    result = engine.determineArc('DESCENT', 0.2, 0, 50, 50);
    expect(result.arc).toBe('INITIATION');
  });
});
