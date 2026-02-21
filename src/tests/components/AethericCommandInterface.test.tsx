import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AethericCommandInterface } from '../../components/AethericCommand/AethericCommandInterface';
import { useAetherStore } from '../../stores/useAetherStore';

// Mock child components to simplify test
vi.mock('../../components/AethericCommand/TacticalDashboard', () => ({
  TacticalDashboard: () => <div data-testid="dashboard">Dashboard</div>
}));
vi.mock('../../components/AethericCommand/AudioMixer', () => ({
  AudioMixer: () => <div data-testid="mixer">Mixer</div>
}));
vi.mock('../../components/AethericCommand/ProtocolEditor', () => ({
  ProtocolEditor: () => <div data-testid="editor">Editor</div>
}));

describe('AethericCommandInterface', () => {
  beforeEach(() => {
    useAetherStore.setState({ isVisible: false, activeTab: 'DASHBOARD' });
  });

  it('should not render when isVisible is false', () => {
    const { container } = render(<AethericCommandInterface />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render when isVisible is true', () => {
    useAetherStore.setState({ isVisible: true });
    render(<AethericCommandInterface />);
    expect(screen.getByText('AETHERIC COMMAND // INTERFACE')).toBeInTheDocument();
  });

  it('should toggle visibility on Shift+A', () => {
    render(<AethericCommandInterface />);

    // Initial: Hidden
    expect(screen.queryByText('AETHERIC COMMAND // INTERFACE')).not.toBeInTheDocument();

    // Press Shift+A
    fireEvent.keyDown(window, { key: 'A', code: 'KeyA', shiftKey: true });

    // Now Visible
    expect(screen.getByText('AETHERIC COMMAND // INTERFACE')).toBeInTheDocument();

    // Press Shift+A again
    fireEvent.keyDown(window, { key: 'A', code: 'KeyA', shiftKey: true });

    // Hidden again
    expect(screen.queryByText('AETHERIC COMMAND // INTERFACE')).not.toBeInTheDocument();
  });

  it('should switch tabs', () => {
    useAetherStore.setState({ isVisible: true });
    render(<AethericCommandInterface />);

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();

    fireEvent.click(screen.getByText('MIXER'));
    expect(screen.getByTestId('mixer')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });
});
