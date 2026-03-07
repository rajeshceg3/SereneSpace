import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HorizonIndicator } from '../../components/HorizonIndicator';
import { usePredictionStore } from '../../stores/usePredictionStore';

// Mock the store
vi.mock('../../stores/usePredictionStore', () => ({
  usePredictionStore: vi.fn(),
}));

describe('HorizonIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (usePredictionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stressVelocity: 0,
      confidence: 0,
    });
  });

  it('renders with zero opacity when confidence is low (0)', () => {
    (usePredictionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        stressVelocity: 0,
        confidence: 0,
      });

    render(<HorizonIndicator />);

    const container = screen.getByLabelText('Stress Prediction Indicator');
    // opacity should be 0 because confidence <= 0.5 -> 0
    expect(container.style.opacity).toBe('0');
  });

  it('renders with opacity when confidence is high', () => {
    (usePredictionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stressVelocity: 0.1,
      confidence: 0.8,
    });

    render(<HorizonIndicator />);

    const container = screen.getByLabelText('Stress Prediction Indicator');
    // opacity should be confidence (0.8)
    expect(container.style.opacity).toBe('0.8');
  });

  it('shows warm color (orange) for positive velocity (stress rising)', () => {
    (usePredictionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stressVelocity: 0.05, // Positive > 0.01
      confidence: 0.9,
    });

    render(<HorizonIndicator />);

    // We need to inspect the inner bar
    // The component structure is: container -> bar
    const container = screen.getByLabelText('Stress Prediction Indicator');
    const bar = container.firstChild as HTMLElement;

    // Orange: rgba(255, 100, 50, 0.6)
    expect(bar.style.backgroundColor).toBe('rgba(255, 100, 50, 0.6)');
  });

  it('shows cool color (cyan) for negative velocity (stress falling)', () => {
    (usePredictionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stressVelocity: -0.05, // Negative < -0.01
      confidence: 0.9,
    });

    render(<HorizonIndicator />);

    const container = screen.getByLabelText('Stress Prediction Indicator');
    const bar = container.firstChild as HTMLElement;

    // Cyan: rgba(50, 200, 255, 0.6)
    expect(bar.style.backgroundColor).toBe('rgba(50, 200, 255, 0.6)');
  });

  it('shows neutral color for near-zero velocity', () => {
    (usePredictionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stressVelocity: 0.005, // < 0.01
      confidence: 0.9,
    });

    render(<HorizonIndicator />);

    const container = screen.getByLabelText('Stress Prediction Indicator');
    const bar = container.firstChild as HTMLElement;

    // Neutral: rgba(255, 255, 255, 0.3)
    expect(bar.style.backgroundColor).toBe('rgba(255, 255, 255, 0.3)');
  });

  it('scales based on velocity magnitude', () => {
    (usePredictionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      stressVelocity: 0.2,
      confidence: 0.9,
    });

    render(<HorizonIndicator />);

    const container = screen.getByLabelText('Stress Prediction Indicator');
    const bar = container.firstChild as HTMLElement;

    // Formula: intensity = Math.min(Math.abs(velocity) * 10, 4) = 2
    // scaleX = 1 + (intensity * 0.2) = 1 + 0.4 = 1.4
    expect(bar.style.transform).toBe('scaleX(1.4)');
  });
});
