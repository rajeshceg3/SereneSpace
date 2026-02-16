import { PredictiveModel } from './PredictiveModel';
import { THREAT_THRESHOLDS, THREAT_LEVELS } from '../constants';

export type StressSignature = 'ACUTE' | 'CHRONIC' | 'STABLE' | 'OPTIMAL';
export type ThreatLevel = keyof typeof THREAT_LEVELS;

export class ThreatAnalyzer {
  private model: PredictiveModel;
  private highStressDuration: number = 0;
  private lastAnalysisTime: number = 0;

  constructor(windowSizeMs: number = 5000, minSamples: number = 3) {
    this.model = new PredictiveModel(windowSizeMs, minSamples);
    this.lastAnalysisTime = Date.now();
  }

  public addSample(stress: number, timestamp: number = Date.now()) {
    this.model.addSample(stress, timestamp);

    // Update Chronic Stress Timer
    const delta = timestamp - this.lastAnalysisTime;
    if (stress > 0.6) {
        this.highStressDuration += delta;
    } else {
        // Decay the duration if stress drops, but not instantly
        this.highStressDuration = Math.max(0, this.highStressDuration - delta);
    }
    this.lastAnalysisTime = timestamp;
  }

  public detectSignature(): StressSignature {
    const { velocity, projected } = this.model.analyze(1); // Look 1 second ahead
    const currentStress = projected; // Approximate current trend

    // 1. Check for Acute Stress (Panic Spike)
    if (velocity > THREAT_THRESHOLDS.ACUTE_VELOCITY) {
        return 'ACUTE';
    }

    // 2. Check for Chronic Stress (Sustained High)
    if (this.highStressDuration > THREAT_THRESHOLDS.CHRONIC_DURATION) {
        return 'CHRONIC';
    }

    // 3. Check for Stability/Optimal
    if (currentStress < 0.3 && Math.abs(velocity) < 0.05) {
        return 'OPTIMAL';
    }

    return 'STABLE';
  }

  public assessThreat(signature: StressSignature, currentStress: number): ThreatLevel {
    // CRITICAL: Panic Attack or Extreme Sustained Stress
    if (signature === 'ACUTE' && currentStress > 0.8) return 'CRITICAL';
    if (signature === 'CHRONIC' && currentStress > 0.9) return 'CRITICAL';

    // WARNING: Rising fast or Sustained High
    if (signature === 'ACUTE') return 'WARNING';
    if (signature === 'CHRONIC') return 'WARNING';

    // CAUTION: Moderate Stress or slight rise
    if (currentStress > 0.5) return 'CAUTION';

    return 'SAFE';
  }
}
