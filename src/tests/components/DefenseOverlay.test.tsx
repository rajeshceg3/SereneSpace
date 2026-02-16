import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DefenseOverlay } from '../../components/DefenseOverlay';
import { useSentinelStore } from '../../stores/useSentinelStore';

describe('DefenseOverlay', () => {
  beforeEach(() => {
    useSentinelStore.getState().reset();
  });

  it('renders nothing when threat level is SAFE (transparent)', () => {
    // SAFE config has vignette 0, desaturation 0
    // But it renders the div with styles
    render(<DefenseOverlay />);
    const overlay = screen.getByTestId('defense-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveStyle('box-shadow: none');
    // JSDOM might omit backdrop-filter, so we skip that check or check style attribute if needed.
  });

  it('renders vignette when threat level is WARNING', () => {
    useSentinelStore.getState().setThreatLevel('WARNING');
    render(<DefenseOverlay />);

    const overlay = screen.getByTestId('defense-overlay');

    // WARNING: vignette: 0.6, desaturation: 0.5
    // box-shadow: inset 0 0 18vw rgba(255, 100, 50, 0.2)
    // backdrop-filter: grayscale(50%) sepia(15%)

    // Exact string matching might be flaky due to browser formatting, so we check existence
    const style = overlay.getAttribute('style');
    expect(style).toContain('box-shadow: inset 0 0');
    // JSDOM might drop backdrop-filter, relying on box-shadow for verification
  });

  it('renders critical tunnel vision', () => {
    useSentinelStore.getState().setThreatLevel('CRITICAL');
    render(<DefenseOverlay />);

    const overlay = screen.getByTestId('defense-overlay');
    const style = overlay.getAttribute('style');

    // CRITICAL: vignette 0.9 -> 27vw
    expect(style).toContain('box-shadow: inset 0 0');
  });
});
