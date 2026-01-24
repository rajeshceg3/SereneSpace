import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Destination } from '../../components/Destination';
import { useDestinationStore } from '../../stores/useDestinationStore';
import { useBloomStore } from '../../stores/useBloomStore';

// Mock stores
vi.mock('../../stores/useDestinationStore', () => ({
  useDestinationStore: vi.fn(),
}));
vi.mock('../../stores/useBloomStore', () => ({
  useBloomStore: vi.fn(),
}));

// Mock A11y
vi.mock('@react-three/a11y', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  A11y: ({ children }: any) => <group>{children}</group>,
  useA11y: () => ({ focus: false }),
}));

describe('Destination Component', () => {
  const mockDestination = {
    id: 'dest-1',
    name: 'Test Dest',
    coordinates: [0, 0, 0] as [number, number, number],
    ambientColor: 'red',
    description: 'Test Description',
  };

  const mockSetHovered = vi.fn();
  const mockSetActive = vi.fn();
  const mockSetCamera = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useDestinationStore as any).mockReturnValue({
      activeDestination: null,
      setActiveDestination: mockSetActive,
      setHoveredDestination: mockSetHovered,
      setCameraTargetZ: mockSetCamera,
    });
  });

  it('renders Icosahedron (standard) when not bloomed', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useBloomStore as any).mockReturnValue({
      bloomedDestinations: {},
    });

    const renderer = await ReactThreeTestRenderer.create(
      <Destination destination={mockDestination} />
    );

    const outerMesh = renderer.scene.children[0].children[0]; // group -> outer mesh
    const innerMesh = outerMesh.children[0]; // outer mesh -> Icosahedron (drei mesh)

    // Access the instance of the inner mesh
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geometry = (innerMesh.instance as any).geometry;
    expect(geometry.type).toBe('IcosahedronGeometry');
  });

  it('renders TorusKnot (bloomed) when bloomed', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useBloomStore as any).mockReturnValue({
      bloomedDestinations: { 'dest-1': true },
    });

    const renderer = await ReactThreeTestRenderer.create(
      <Destination destination={mockDestination} />
    );

    const outerMesh = renderer.scene.children[0].children[0]; // group -> outer mesh
    const innerMesh = outerMesh.children[0]; // outer mesh -> TorusKnot (drei mesh)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geometry = (innerMesh.instance as any).geometry;
    expect(geometry.type).toBe('TorusKnotGeometry');
  });
});
