import { describe, it, expect, beforeEach } from 'vitest';
import { PredictiveModel } from '../../services/PredictiveModel';

describe('PredictiveModel', () => {
  let model: PredictiveModel;

  beforeEach(() => {
    model = new PredictiveModel(3000, 3); // 3s window, min 3 samples
  });

  it('should initialize with empty state', () => {
    const analysis = model.analyze();
    expect(analysis.velocity).toBe(0);
    expect(analysis.projected).toBe(0);
    expect(analysis.confidence).toBe(0);
  });

  it('should detect rising stress (positive velocity)', () => {
    const now = 10000;
    model.addSample(0.1, now);
    model.addSample(0.2, now + 1000);
    model.addSample(0.3, now + 2000);

    const { velocity, projected, confidence } = model.analyze(5);

    // Slope should be 0.1 per second
    expect(velocity).toBeCloseTo(0.1);
    expect(confidence).toBeGreaterThan(0.9); // Perfect line
    // Current is 0.3. In 5 seconds, it should be 0.3 + 0.5 = 0.8
    expect(projected).toBeCloseTo(0.8);
  });

  it('should detect falling stress (negative velocity)', () => {
    const now = 10000;
    model.addSample(0.5, now);
    model.addSample(0.4, now + 1000);
    model.addSample(0.3, now + 2000);

    const { velocity, projected } = model.analyze(5);

    expect(velocity).toBeCloseTo(-0.1);
    // Current 0.3. In 5s, 0.3 - 0.5 = -0.2 -> clamped to 0
    expect(projected).toBe(0);
  });

  it('should prune old samples', () => {
    const now = 10000;
    model.addSample(0.1, now - 5000); // Should be pruned (window is 3000)
    model.addSample(0.2, now);
    model.addSample(0.2, now + 1000);
    model.addSample(0.2, now + 2000);

    // We can't easily check buffer size privately, but we can infer from results
    // If first point was there, slope would be different.
    // 0.2, 0.2, 0.2 -> slope 0.

    const { velocity } = model.analyze();
    expect(velocity).toBeCloseTo(0);
  });
});
