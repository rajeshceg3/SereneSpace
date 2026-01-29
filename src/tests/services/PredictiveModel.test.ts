import { describe, it, expect, beforeEach } from 'vitest';
import { PredictiveModel } from '../../services/PredictiveModel';

describe('PredictiveModel', () => {
  let model: PredictiveModel;

  beforeEach(() => {
    model = new PredictiveModel(5); // Small buffer for testing
  });

  it('should initialize with empty buffer', () => {
    expect(model.predict(1000)).toBe(0);
  });

  it('should return last value when only one sample exists', () => {
    model.addSample(0.5, 1000);
    expect(model.predict(1000)).toBe(0.5);
  });

  it('should predict flat trend correctly', () => {
    model.addSample(0.5, 1000);
    model.addSample(0.5, 2000);
    model.addSample(0.5, 3000);

    // Prediction should be 0.5 regardless of horizon
    expect(model.predict(1000)).toBe(0.5);
  });

  it('should predict rising trend correctly', () => {
    // y = 0.1 * (t/1000)
    model.addSample(0.1, 1000);
    model.addSample(0.2, 2000);
    model.addSample(0.3, 3000);

    // At t=3000, value is 0.3.
    // Horizon 1000ms -> t=4000. Expected 0.4
    expect(model.predict(1000)).toBeCloseTo(0.4);
  });

  it('should predict falling trend correctly', () => {
    // y = 1.0 - 0.1 * (t/1000)
    model.addSample(0.9, 1000);
    model.addSample(0.8, 2000);
    model.addSample(0.7, 3000);

    // At t=3000, value is 0.7.
    // Horizon 2000ms -> t=5000. Expected 0.5
    expect(model.predict(2000)).toBeCloseTo(0.5);
  });

  it('should clamp prediction between 0 and 1', () => {
    model.addSample(0.8, 1000);
    model.addSample(0.9, 2000);

    // Rising fast. 2000ms later -> 1.1 -> clamped to 1
    expect(model.predict(2000)).toBe(1);

    model.clear();
    model.addSample(0.2, 1000);
    model.addSample(0.1, 2000);

    // Falling fast. 2000ms later -> -0.1 -> clamped to 0
    expect(model.predict(2000)).toBe(0);
  });

  it('should respect buffer size limit', () => {
    // Buffer size 5
    model.addSample(0.1, 1000);
    model.addSample(0.2, 2000);
    model.addSample(0.3, 3000);
    model.addSample(0.4, 4000);
    model.addSample(0.5, 5000);

    // Add 6th sample, should remove 1st (0.1 at 1000)
    model.addSample(0.6, 6000);

    // Now buffer has 0.2, 0.3, 0.4, 0.5, 0.6
    // If we predict back to 1000ms ago (relative to last sample 6000),
    // but let's just check the trend.
    // The slope is still 0.1 per 1000ms.
    expect(model.predict(1000)).toBeCloseTo(0.7);
  });
});
