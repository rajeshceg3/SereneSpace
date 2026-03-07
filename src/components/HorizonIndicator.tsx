// Feature 10: Cognitive Predictive Modeling - Visual Layer
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

  const getGlowColor = (velocity: number) => {
    if (Math.abs(velocity) < 0.01) return 'rgba(255, 255, 255, 0.3)';
    return velocity > 0 ? 'rgba(255, 100, 50, 0.6)' : 'rgba(50, 200, 255, 0.6)';
  };

  // Transform based on velocity magnitude
  // Max expected velocity might be around 0.2 per second?
  // Let's scale it.
  const intensity = Math.min(Math.abs(stressVelocity) * 10, 4);
  const scaleX = 1 + (intensity * 0.2);
  const color = getGlowColor(stressVelocity);
  const blurRadius = 20 + (intensity * 20);
  const spreadRadius = 5 + (intensity * 10);

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
          boxShadow: `0 0 ${blurRadius}px ${spreadRadius}px ${color}`,
          transform: `scaleX(${scaleX})`
        }}
      />
    </div>
  );
};
