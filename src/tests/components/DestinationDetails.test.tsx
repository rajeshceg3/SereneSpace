import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { DestinationDetails } from '../../components/DestinationDetails';
import { useDestinationStore } from '../../stores/useDestinationStore';
import { act } from '@testing-library/react';

const mockDestination = {
  id: '1',
  name: 'Test Destination',
  coordinates: [0, 0, 0] as [number, number, number],
  ambientColor: '#ffffff',
  description: 'Test Description',
};

describe('DestinationDetails', () => {
  beforeEach(() => {
    act(() => {
      useDestinationStore.setState({
        activeDestinationDetails: null,
        isNameVisible: false,
        isDetailsVisible: false,
      });
    });
  });

  it('should render nothing when there is no active destination', () => {
    const { container } = render(<DestinationDetails />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render name and description when active destination exists', () => {
    act(() => {
      useDestinationStore.setState({
        activeDestinationDetails: mockDestination,
        isNameVisible: true,
        isDetailsVisible: true,
      });
    });

    render(<DestinationDetails />);

    expect(screen.getByText('Test Destination')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should apply visibility classes based on store state', () => {
    act(() => {
      useDestinationStore.setState({
        activeDestinationDetails: mockDestination,
        isNameVisible: true,
        isDetailsVisible: false,
      });
    });

    render(<DestinationDetails />);

    const nameElement = screen.getByText('Test Destination');
    const descriptionElement = screen.getByText('Test Description').closest('.destination-details-box');

    expect(nameElement).toHaveClass('visible');
    expect(descriptionElement).not.toHaveClass('visible');

    // Update state to make details visible
    act(() => {
      useDestinationStore.setState({ isDetailsVisible: true });
    });

    expect(descriptionElement).toHaveClass('visible');
  });
});
