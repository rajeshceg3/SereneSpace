interface DataPoint {
  timestamp: number;
  value: number;
}

export class PredictiveModel {
  private buffer: DataPoint[] = [];
  private windowSizeMs: number;
  private minSamples: number;

  constructor(windowSizeMs: number = 3000, minSamples: number = 10) {
    this.windowSizeMs = windowSizeMs;
    this.minSamples = minSamples;
  }

  addSample(value: number, timestamp: number = Date.now()) {
    this.buffer.push({ timestamp, value });
    this.prune(timestamp);
  }

  private prune(currentTimestamp: number) {
    const cutoff = currentTimestamp - this.windowSizeMs;
    // Optimized pruning: Remove old samples from the front to avoid array reallocation
    while (this.buffer.length > 0 && this.buffer[0].timestamp < cutoff) {
      this.buffer.shift();
    }
  }

  analyze(secondsAhead: number = 5): { velocity: number; projected: number; confidence: number } {
    if (this.buffer.length < this.minSamples) {
      return { velocity: 0, projected: 0, confidence: 0 };
    }

    // Linear Regression: y = mx + c
    // x = time (normalized to 0 start for stability), y = stress value
    const n = this.buffer.length;
    const startTime = this.buffer[0].timestamp;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const point of this.buffer) {
      const x = (point.timestamp - startTime) / 1000; // convert ms to seconds
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) {
      return { velocity: 0, projected: this.buffer[n - 1].value, confidence: 0 };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // R-squared calculation for confidence
    const meanY = sumY / n;
    let ssTotal = 0;
    let ssRes = 0;
    for (const point of this.buffer) {
        const x = (point.timestamp - startTime) / 1000;
        const y = point.value;
        const yPred = slope * x + intercept;
        ssTotal += (y - meanY) ** 2;
        ssRes += (y - yPred) ** 2;
    }

    // If variance is 0 (flat line), confidence is high (1)
    const rSquared = ssTotal === 0 ? 1 : 1 - (ssRes / ssTotal);

    // Project future value
    // Current time relative to start
    const currentX = (this.buffer[n - 1].timestamp - startTime) / 1000;
    const futureX = currentX + secondsAhead;

    let projected = slope * futureX + intercept;

    // Clamp projection to realistic bounds (0-1)
    projected = Math.max(0, Math.min(1, projected));

    return {
      velocity: slope, // change per second
      projected,
      confidence: Math.max(0, rSquared) // Ensure non-negative
    };
  }
}
