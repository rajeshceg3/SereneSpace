import { describe, it, expect, beforeEach } from 'vitest';
import { ThreatAnalyzer } from '../../services/ThreatAnalyzer';

describe('ThreatAnalyzer', () => {
  let analyzer: ThreatAnalyzer;

  beforeEach(() => {
    analyzer = new ThreatAnalyzer();
  });

  it('should detect OPTIMAL state initially', () => {
    // Initial state with no data -> should be OPTIMAL or STABLE?
    // PredictiveModel returns 0 velocity, 0 projected if empty.
    // ThreatAnalyzer checks: projected < 0.3 && velocity < 0.05 -> OPTIMAL
    const signature = analyzer.detectSignature();
    expect(signature).toBe('OPTIMAL');
  });

  it('should detect ACUTE stress (Panic Spike)', () => {
    const now = Date.now();
    // Add rapid increase: 0.1 to 0.8 over 3s = 0.233/s > 0.2
    analyzer.addSample(0.1, now);
    analyzer.addSample(0.3, now + 1000);
    analyzer.addSample(0.5, now + 2000);
    analyzer.addSample(0.8, now + 3000);

    const signature = analyzer.detectSignature();
    expect(signature).toBe('ACUTE');

    const threat = analyzer.assessThreat(signature, 0.8);
    expect(threat).toBe('WARNING');
  });

  it('should detect CHRONIC stress (Sustained High)', () => {
    const now = Date.now();
    // Simulate 6 seconds of high stress
    for (let i = 0; i <= 6; i++) {
        analyzer.addSample(0.8, now + (i * 1000));
    }

    const signature = analyzer.detectSignature();
    expect(signature).toBe('CHRONIC');

    const threat = analyzer.assessThreat(signature, 0.8);
    expect(threat).toBe('WARNING');
  });

  it('should escalate to CRITICAL threat', () => {
    const now = Date.now();
    // Simulate very high ACUTE spike with enough samples (min 3)
    analyzer.addSample(0.5, now);
    analyzer.addSample(0.7, now + 500);
    analyzer.addSample(0.9, now + 1000);

    const signature = analyzer.detectSignature();
    expect(signature).toBe('ACUTE');

    const threat = analyzer.assessThreat(signature, 0.9);
    expect(threat).toBe('CRITICAL');
  });
});
