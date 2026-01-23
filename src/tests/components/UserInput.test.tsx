import { render, act } from '@testing-library/react';
import { UserInput } from '../../components/UserInput';
import { useDestinationStore } from '../../stores/useDestinationStore';
import { CAMERA_POSITION_Z_OFFSET } from '../../constants';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('UserInput', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
        useDestinationStore.setState({
            destinations: [
                { id: '1', name: 'D1', coordinates: [0, 0, 0], ambientColor: 'red', description: 'Desc 1' },
                { id: '2', name: 'D2', coordinates: [10, 0, 10], ambientColor: 'blue', description: 'Desc 2' },
            ],
            activeDestination: '1',
            cameraTargetZ: 0,
        });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should switch to next destination on ArrowRight', () => {
    render(<UserInput />);

    act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        window.dispatchEvent(event);
    });

    const { activeDestination, cameraTargetZ } = useDestinationStore.getState();
    expect(activeDestination).toBe('2');
    expect(cameraTargetZ).toBe(10 + CAMERA_POSITION_Z_OFFSET);
  });

  it('should switch to previous destination on ArrowLeft', () => {
    render(<UserInput />);

    // Set start state to D2
    act(() => {
        useDestinationStore.setState({ activeDestination: '2' });
    });

    // Fire event
    act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        window.dispatchEvent(event);
    });

    const { activeDestination, cameraTargetZ } = useDestinationStore.getState();
    expect(activeDestination).toBe('1');
    expect(cameraTargetZ).toBe(0 + CAMERA_POSITION_Z_OFFSET);
  });

  it('should ignore Tab key (letting native behavior happen)', () => {
     render(<UserInput />);

     act(() => {
         const event = new KeyboardEvent('keydown', { key: 'Tab' });
         window.dispatchEvent(event);
     });

     const { activeDestination } = useDestinationStore.getState();
     // Should stay on 1
     expect(activeDestination).toBe('1');
  });
});
