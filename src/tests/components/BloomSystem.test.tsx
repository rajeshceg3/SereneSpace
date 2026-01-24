import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BloomSystem } from '../../components/BloomSystem';
import { useDestinationStore } from '../../stores/useDestinationStore';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { useBloomStore } from '../../stores/useBloomStore';

// Mock useFrame
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__useFrameCallback = callback;
  },
}));

describe('BloomSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDestinationStore.setState({ activeDestination: null });
    useResonanceStore.setState({ currentStress: 0 });
    useBloomStore.setState({ bloomedDestinations: {} });
  });

  const runFrame = (delta: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callback = (globalThis as any).__useFrameCallback;
    if (callback) {
      callback({}, delta);
    }
  };

  it('should bloom a destination after sufficient calm focus time', () => {
    render(<BloomSystem />);
    const setBloomed = vi.spyOn(useBloomStore.getState(), 'setBloomed');

    // Set active destination
    useDestinationStore.setState({ activeDestination: 'dest-1' });

    // Advance time (less than threshold - 3s)
    runFrame(1.0);
    expect(setBloomed).not.toHaveBeenCalled();

    // Advance time (more than threshold - total > 3s)
    runFrame(2.1);
    expect(setBloomed).toHaveBeenCalledWith('dest-1');
  });

  it('should not bloom if stress is high', () => {
    render(<BloomSystem />);
    const setBloomed = vi.spyOn(useBloomStore.getState(), 'setBloomed');

    useDestinationStore.setState({ activeDestination: 'dest-1' });
    useResonanceStore.setState({ currentStress: 0.5 }); // High stress (> 0.2)

    runFrame(1.0);
    runFrame(2.5); // Total 3.5s
    expect(setBloomed).not.toHaveBeenCalled();
  });

  it('should reset timer if active destination changes', () => {
    render(<BloomSystem />);
    const setBloomed = vi.spyOn(useBloomStore.getState(), 'setBloomed');

    useDestinationStore.setState({ activeDestination: 'dest-1' });
    runFrame(2.0);

    useDestinationStore.setState({ activeDestination: 'dest-2' });
    runFrame(1.5); // 1.5s on new destination

    expect(setBloomed).not.toHaveBeenCalled();

    runFrame(2.0); // Total 3.5s on dest-2
    expect(setBloomed).toHaveBeenCalledWith('dest-2');
  });
});
