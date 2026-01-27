import { describe, it, expect, vi, afterEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { MnemonicProjector } from '../../components/MnemonicProjector';

// Mock the store
const useTelemetryStoreMock = vi.fn();

vi.mock('../../stores/useTelemetryStore', () => ({
  useTelemetryStore: (selector: any) => useTelemetryStoreMock(selector),
}));

describe('MnemonicProjector', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when history is empty', async () => {
    // Mock empty history
    useTelemetryStoreMock.mockImplementation((selector) => selector({ history: [] }));

    const renderer = await ReactThreeTestRenderer.create(<MnemonicProjector />);

    // Should find no meshes
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(0);
  });

  it('renders shards corresponding to history items', async () => {
    const mockHistory = [
      { id: '1', timestamp: 1000, duration: 60, averageStress: 0.1, coherenceScore: 90 },
      { id: '2', timestamp: 2000, duration: 120, averageStress: 0.4, coherenceScore: 60 },
      { id: '3', timestamp: 3000, duration: 180, averageStress: 0.8, coherenceScore: 20 },
    ];

    useTelemetryStoreMock.mockImplementation((selector) => selector({ history: mockHistory }));

    const renderer = await ReactThreeTestRenderer.create(<MnemonicProjector />);

    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(3);
  });

  it('limits visualization to the last 50 sessions', async () => {
    // Generate 60 items
    const mockHistory = Array.from({ length: 60 }, (_, i) => ({
      id: `${i}`,
      timestamp: Date.now(),
      duration: 60,
      averageStress: 0.5,
      coherenceScore: 50,
    }));

    useTelemetryStoreMock.mockImplementation((selector) => selector({ history: mockHistory }));

    const renderer = await ReactThreeTestRenderer.create(<MnemonicProjector />);

    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(50);
  });
});
