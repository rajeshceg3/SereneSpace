import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BioFeedbackOverlay } from '../../components/BioFeedbackOverlay';
import { useRespirationStore } from '../../stores/useRespirationStore';

// Mock Canvas context
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    shadowBlur: 0,
    shadowColor: '',
});

describe('BioFeedbackOverlay', () => {
    beforeEach(() => {
        useRespirationStore.setState({ inputMode: 'PROCEDURAL', coherence: 50 });
        vi.clearAllMocks();
    });

    it('should NOT render when inputMode is PROCEDURAL', () => {
        render(<BioFeedbackOverlay />);
        const overlay = screen.queryByTestId('bio-feedback-overlay');
        expect(overlay).toBeNull();
    });

    it('should render when inputMode is MICROPHONE', () => {
        useRespirationStore.setState({ inputMode: 'MICROPHONE', coherence: 75 });
        render(<BioFeedbackOverlay />);

        const overlay = screen.getByTestId('bio-feedback-overlay');
        expect(overlay).toBeInTheDocument();

        expect(screen.getByText(/Bio-Link Active/i)).toBeInTheDocument();
        expect(screen.getByText(/75% Coh/i)).toBeInTheDocument();
    });

    it('should update visualization on frame', () => {
        useRespirationStore.setState({ inputMode: 'MICROPHONE' });

        // Spy on requestAnimationFrame to prevent infinite loop
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {
            return 1;
        });

        render(<BioFeedbackOverlay />);

        // Check if canvas context was used (called by initial render())
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });
});
