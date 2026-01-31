// Feature 10: Cognitive Predictive Modeling - Visual Layer
import React from 'react';
import { usePredictionStore } from '../stores/usePredictionStore';
import './HorizonIndicator.css';

export const HorizonIndicator = () => {
  const { stressVelocity, confidence } = usePredictionStore();

  // If confidence is low, hide the indicator
  const opacity = confidence > 0.5 ? Math.max(0.2, confidence) : 0;

  // Velocity determines color and direction
  // Positive velocity (stress rising) -> Right / Warm color
  // Negative velocity (stress falling) -> Left / Cool color

  // Color interpolation
  // stress rising (bad) -> orange (#ffaa44)
  // stress falling (good) -> cyan (#44aaff)
  // neutral -> white

  const getColor = (velocity: number) => {
    if (Math.abs(velocity) < 0.01) return 'rgba(255, 255, 255, 0.5)';
    return velocity > 0 ? 'rgba(255, 170, 68, 0.8)' : 'rgba(68, 170, 255, 0.8)';
  };

  // Transform based on velocity magnitude
  // Max expected velocity might be around 0.2 per second?
  // Let's scale it.
  const scaleX = 1 + Math.min(Math.abs(stressVelocity) * 10, 4);
  const color = getColor(stressVelocity);

  return (
    <div
      className="horizon-indicator-container"
      style={{ opacity }}
      aria-label="Stress Prediction Indicator"
    >
      <div
        className="horizon-bar"
        style={{
          backgroundColor: color,
          transform: `scaleX(${scaleX})`
        }}
      />
    </div>
  );
};
