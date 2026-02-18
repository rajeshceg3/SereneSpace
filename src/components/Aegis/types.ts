export interface AegisMetrics {
  protocol: string;
  protocolDuration: number; // Seconds in current protocol
  stressVelocity: number;
  projectedStress: number; // 0-1
  confidence: number; // 0-1
  currentStress: number; // 0-1
  coherence: number; // 0-100
  history: number[]; // Last N points for sparkline
  isRecording: boolean;
  isManualOverride: boolean;
  manualAudioMode: boolean;
  threatLevel: string;
}

export interface AegisState {
  isVisible: boolean;
  toggleVisibility: () => void;
  metrics: AegisMetrics;
}
