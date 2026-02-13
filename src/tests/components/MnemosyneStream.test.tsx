import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { MnemosyneStream } from '../../components/MnemosyneStream';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { audioEngine } from '../../services/AudioEngine';

// Mocks
vi.mock('../../stores/useTelemetryStore', () => ({
  useTelemetryStore: vi.fn(),
}));
vi.mock('../../stores/useResonanceStore', () => ({
  useResonanceStore: vi.fn(),
}));
vi.mock('../../services/AudioEngine', () => ({
  audioEngine: {
    setMnemosyneVolume: vi.fn(),
  },
}));

// Mock shader material extension
vi.mock('@react-three/drei', async () => {
    const actual = await vi.importActual('@react-three/drei');
    return {
        ...actual,
        shaderMaterial: () => class MockMaterial extends THREE.ShaderMaterial {
            constructor() {
                super();
                this.uniforms = { uTime: { value: 0 } };
            }
        },
    };
});


describe('MnemosyneStream Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Empty history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useTelemetryStore as any).mockImplementation((selector: any) => selector({
      history: []
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useResonanceStore as any).mockImplementation((selector: any) => selector({
        decayStress: vi.fn(),
    }));
  });

  it('renders nothing if history is empty', async () => {
    const renderer = await ReactThreeTestRenderer.create(<MnemosyneStream />);
    const scene = renderer.scene;
    expect(scene.children.length).toBe(0);
  });

  it('renders streams if history exists', async () => {
    // Mock History with 1 session
    const mockHistory = [{
        sessionPath: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: -10 },
            { x: 0, y: 0, z: -20 },
            { x: 0, y: 0, z: -30 },
            { x: 0, y: 0, z: -40 },
            { x: 0, y: 0, z: -50 },
        ]
    }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useTelemetryStore as any).mockImplementation((selector: any) => selector({
      history: mockHistory
    }));

    const renderer = await ReactThreeTestRenderer.create(<MnemosyneStream />);
    const scene = renderer.scene;

    // Should render a group
    expect(scene.children.length).toBe(1);
    // The group contains meshes (one per curve)
    // children[0] is the group from <group>
    // children[0].children[0] is the <mesh>
    expect(scene.children[0].type).toBe('Group');
    expect(scene.children[0].children.length).toBe(1);
    expect(scene.children[0].children[0].type).toBe('Mesh');
  });

  it('updates uniforms and checks proximity on frame', async () => {
     // Default camera in R3F test renderer is usually at [0, 0, 5] looking at [0, 0, 0]
     // So we place a point at [0, 0, 5] to ensure distance is 0.
     const mockHistory = [{
        sessionPath: [
            { x: 0, y: 0, z: 5 }, // Close to camera
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: -5 },
            { x: 0, y: 0, z: -10 },
            { x: 0, y: 0, z: -20 },
            { x: 0, y: 0, z: -25 },
        ]
    }];

    const decayStressMock = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useTelemetryStore as any).mockImplementation((selector: any) => selector({
      history: mockHistory
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useResonanceStore as any).mockImplementation((selector: any) => selector({
        decayStress: decayStressMock,
    }));

    const renderer = await ReactThreeTestRenderer.create(<MnemosyneStream />);

    // Simulate camera at 0,0,0 (very close to start of stream)
    await renderer.advanceFrames(2, 0.1);

    // Verify Audio Volume
    expect(audioEngine.setMnemosyneVolume).toHaveBeenCalled();

    // Verify Stress Decay (Distance < 5)
    expect(decayStressMock).toHaveBeenCalledWith(0.01);
  });
});
