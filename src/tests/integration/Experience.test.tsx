import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Experience } from '../../scenes/Experience';

// Mock the useStore to avoid issues with Zustand in tests
vi.mock('../../stores/useDestinationStore', () => ({
  useDestinationStore: vi.fn(() => ({
    destinations: [],
    fetchDestinations: vi.fn(),
  })),
}));

describe('Experience', () => {
  it('should render the scene without crashing', () => {
    const { container } = render(<Experience />);
    expect(container).toBeDefined();
  });
});
