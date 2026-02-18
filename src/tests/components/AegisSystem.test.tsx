import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AegisSystem } from '../../components/Aegis/AegisSystem';
import * as useAegisDataHook from '../../components/Aegis/useAegisData';

// Mock the CSS module
vi.mock('../../components/Aegis/Aegis.module.css', () => ({
  default: {
    container: 'container',
    panel: 'panel',
    critical: 'critical',
    warning: 'warning',
    label: 'label',
    value: 'value',
    topSector: 'topSector',
    bottomSector: 'bottomSector',
  },
}));

// Mock the hook
const mockMetrics = {
  protocol: 'OBSERVER',
  protocolDuration: 120,
  stressVelocity: 0.01,
  projectedStress: 0.2,
  confidence: 0.8,
  currentStress: 0.3,
  coherence: 85,
  history: [0.3, 0.35, 0.3],
  isRecording: true,
  isManualOverride: false,
  manualAudioMode: false,
  threatLevel: 'SAFE',
};

vi.spyOn(useAegisDataHook, 'useAegisData').mockReturnValue(mockMetrics);

describe('AegisSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is hidden by default', () => {
    render(<AegisSystem />);
    const text = screen.queryByText('SENTINEL COMMAND INTERFACE');
    expect(text).toBeNull();
  });

  it('appears when H key is pressed', () => {
    render(<AegisSystem />);

    act(() => {
        fireEvent.keyDown(window, { code: 'KeyH' });
    });

    // Check for a known text element from AegisCommandCenter
    expect(screen.getByText('SENTINEL COMMAND INTERFACE')).toBeInTheDocument();
    // Use getAllByText because "OBSERVER" appears in both Status and Protocol Lock sections
    expect(screen.getAllByText('OBSERVER').length).toBeGreaterThan(0);
  });

  it('toggles off when H is pressed again', () => {
    render(<AegisSystem />);

    act(() => {
        fireEvent.keyDown(window, { code: 'KeyH' });
    });
    expect(screen.getByText('SENTINEL COMMAND INTERFACE')).toBeInTheDocument();

    act(() => {
        fireEvent.keyDown(window, { code: 'KeyH' });
    });
    expect(screen.queryByText('SENTINEL COMMAND INTERFACE')).toBeNull();
  });
});
