import { describe, it, expect, beforeEach } from 'vitest';
import { NarrativeEngine } from '../../services/NarrativeEngine';

describe('NarrativeEngine', () => {
  let engine: NarrativeEngine;

  beforeEach(() => {
    engine = NarrativeEngine.getInstance();
  });

  it('should return INITIATION by default', () => {
    const result = engine.determineArc('INITIATION', 0.5, 0, 50);
    expect(result.arc).toBe('INITIATION');
    expect(result.intensity).toBe(0);
  });

  it('should trigger DESCENT on high stress velocity', () => {
    // stress 0.7, velocity 0.2 -> DESCENT
    const result = engine.determineArc('INITIATION', 0.7, 0.2, 50);
    expect(result.arc).toBe('DESCENT');
    expect(result.intensity).toBeCloseTo(0.9); // 0.7 + 0.2
  });

  it('should trigger ASCENSION on high coherence and low stress', () => {
    // stress 0.1, velocity 0, coherence 80 -> ASCENSION
    const result = engine.determineArc('INITIATION', 0.1, 0, 80);
    expect(result.arc).toBe('ASCENSION');
    expect(result.intensity).toBeCloseTo((80 - 70) / 30); // 0.33
  });

  it('should trigger STASIS on very low stress and stillness', () => {
    // stress 0.05, velocity 0 -> STASIS
    const result = engine.determineArc('INITIATION', 0.05, 0, 50);
    expect(result.arc).toBe('STASIS');
    expect(result.intensity).toBeCloseTo(0.95); // 1 - 0.05
  });

  it('should implement hysteresis for ASCENSION', () => {
    // Currently ASCENSION, stress rises to 0.3 (below 0.4 threshold) -> Should stay ASCENSION
    let result = engine.determineArc('ASCENSION', 0.3, 0, 80);
    expect(result.arc).toBe('ASCENSION');

    // Stress rises to 0.5 -> Should switch to INITIATION
    result = engine.determineArc('ASCENSION', 0.5, 0, 80);
    expect(result.arc).toBe('INITIATION');
  });

  it('should implement hysteresis for DESCENT', () => {
    // Currently DESCENT, stress drops to 0.4 (above 0.3 threshold) -> Should stay DESCENT
    let result = engine.determineArc('DESCENT', 0.4, 0, 50);
    expect(result.arc).toBe('DESCENT');

    // Stress drops to 0.2 -> Should switch to INITIATION
    result = engine.determineArc('DESCENT', 0.2, 0, 50);
    expect(result.arc).toBe('INITIATION');
  });
});
