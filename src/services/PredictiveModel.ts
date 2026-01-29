export class PredictiveModel {
  private buffer: { timestamp: number; value: number }[] = [];
  private readonly bufferSize: number;

  constructor(bufferSize = 50) {
    this.bufferSize = bufferSize;
  }

  addSample(value: number, timestamp: number = Date.now()): void {
    this.buffer.push({ timestamp, value });
    if (this.buffer.length > this.bufferSize) {
      // Remove oldest
      // Using shift is fine for small buffers, or could use a circular buffer for optimization if needed,
      // but shift is sufficient for size 50.
      this.buffer.shift();
    }
  }

  predict(horizonMs: number): number {
    const n = this.buffer.length;
    if (n < 2) {
      // Not enough data to predict
      return this.buffer.length > 0 ? this.buffer[n - 1].value : 0;
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    // Use relative time to keep numbers smaller and avoid precision issues
    const t0 = this.buffer[0].timestamp;

    for (let i = 0; i < n; i++) {
      const x = this.buffer[i].timestamp - t0;
      const y = this.buffer[i].value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) {
      // All x are the same (shouldn't happen with distinct timestamps)
      return this.buffer[n - 1].value;
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const currentTimestamp = this.buffer[n - 1].timestamp;
    const targetX = (currentTimestamp + horizonMs) - t0;

    let prediction = slope * targetX + intercept;

    // Clamp prediction to reasonable bounds [0, 1] as stress is 0-1
    return Math.max(0, Math.min(1, prediction));
  }

  clear(): void {
    this.buffer = [];
  }
}
