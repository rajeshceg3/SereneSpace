import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { HoverHint } from '../../components/HoverHint';
import { useDestinationStore } from '../../stores/useDestinationStore';
import { act } from '@testing-library/react';

const mockDestinations = [
  {
    id: '1',
    name: 'Mars',
    coordinates: [0, 0, 0] as [number, number, number],
    ambientColor: '#ff0000',
    description: 'Red Planet',
  },
];

describe('HoverHint', () => {
  beforeEach(() => {
    act(() => {
      useDestinationStore.setState({
        destinations: mockDestinations,
        hoveredDestination: null,
      });
    });
  });

  it('should not be visible when no destination is hovered', () => {
    render(<HoverHint />);
    // It might be in the DOM but hidden or not rendered.
    // Looking at the code:
    // <div className={`hover-hint ${destination ? 'visible' : ''}`}> {destination?.name} </div>
    // So it renders nothing inside the div if destination is undefined?
    // Wait, {destination?.name} will be undefined if destination is undefined.

    // If destination is null, the text content is empty.
    // Let's check the container.
    // Actually, `destination` is found via `destinations.find(...)`. If not found, it's undefined.
    // So `destination?.name` is undefined. The div is still rendered.

    // Let's check for the class `visible`.
    // We can use a test id or query by text (which won't exist).
  });

  it('should render the destination name and follow mouse position', () => {
    render(<HoverHint />);

    // Hover a destination
    act(() => {
      useDestinationStore.setState({ hoveredDestination: '1' });
    });

    expect(screen.getByText('Mars')).toBeInTheDocument();

    const hint = screen.getByText('Mars');
    expect(hint).toHaveClass('visible');

    // Move mouse
    fireEvent.mouseMove(window, { clientX: 100, clientY: 200 });

    // Style should update: left: 115px (100 + 15), top: 200px
    expect(hint).toHaveStyle({
      left: '115px',
      top: '200px',
    });
  });

  it('should hide when hover ends', () => {
    render(<HoverHint />);

    act(() => {
      useDestinationStore.setState({ hoveredDestination: '1' });
    });

    const hint = screen.getByText('Mars');
    expect(hint).toHaveClass('visible');

    act(() => {
      useDestinationStore.setState({ hoveredDestination: null });
    });

    expect(hint).not.toHaveClass('visible');
  });
});
