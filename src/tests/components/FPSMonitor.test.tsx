import { render, screen, act } from '@testing-library/react';
import { FPSMonitor } from '../../components/FPSMonitor';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

const { mockUseFrame } = vi.hoisted(() => ({
  mockUseFrame: vi.fn(),
}));

vi.mock('@react-three/fiber', () => ({
  useFrame: mockUseFrame,
}));

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('FPSMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render FPS', () => {
    // Mock performance.now
    const mockNow = vi.fn();
    Object.defineProperty(window, 'performance', {
        writable: true,
        value: { now: mockNow }
    });

    mockNow.mockReturnValue(0);

    render(<FPSMonitor />);

    // Verify useFrame was called
    expect(mockUseFrame).toHaveBeenCalled();
    const frameCallback = mockUseFrame.mock.calls[0][0];

    // Simulate 60 frames
    // Frames 1-59: time < 1000
    mockNow.mockReturnValue(100);
    for(let i=0; i<59; i++) {
        frameCallback();
    }

    // Frame 60: time = 1000
    mockNow.mockReturnValue(1000);
    act(() => {
        frameCallback();
    });

    // FPS = 60 frames / 1s = 60
    expect(screen.getByText('FPS: 60')).toBeInTheDocument();
  });
});
