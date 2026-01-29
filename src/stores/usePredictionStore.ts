import { create } from 'zustand';

interface PredictionState {
  stressVelocity: number;
  projectedStress: number;
  confidence: number;

  setPrediction: (velocity: number, projected: number, confidence: number) => void;
}

export const usePredictionStore = create<PredictionState>((set) => ({
  stressVelocity: 0,
  projectedStress: 0,
  confidence: 0,

  setPrediction: (stressVelocity, projectedStress, confidence) =>
    set({ stressVelocity, projectedStress, confidence }),
}));
