import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { ResonanceSystem } from '../../components/ResonanceSystem';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { useBioLinkStore } from '../../stores/useBioLinkStore';

// Mock THREE to avoid issues in test renderer if needed,
// but @react-three/test-renderer usually handles basic THREE stuff.
// However, ResonanceSystem uses THREE.MathUtils directly.
// Since we run in node, we need to ensure THREE is available.
// 'three' package is installed.

describe('ResonanceSystem with BioLink', () => {
  beforeEach(() => {
    useResonanceStore.setState({ currentStress: 0.5, decayRate: 0.0 });
    useBioLinkStore.setState({ isConnected: false, hrv: 0 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('modulates stress based on HRV when connected', async () => {
    // Connect BioLink
    // HRV 100 => Target Stress 0.0
    useBioLinkStore.setState({ isConnected: true, hrv: 100 });

    const renderer = await ReactThreeTestRenderer.create(<ResonanceSystem />);

    // Advance frames
    // targetStress = 0.0
    // currentStress = 0.5
    // lerp(0.5, 0.0, delta * 2.0) -> moves towards 0

    await renderer.advanceFrames(5, 0.1);

    const stress = useResonanceStore.getState().currentStress;
    expect(stress).toBeLessThan(0.5);
    expect(stress).toBeGreaterThan(0.0);
  });

  it('increases stress for low HRV when connected', async () => {
    // Connect BioLink
    // HRV 0 => Target Stress 1.0
    useResonanceStore.setState({ currentStress: 0.2 });
    useBioLinkStore.setState({ isConnected: true, hrv: 0 });

    const renderer = await ReactThreeTestRenderer.create(<ResonanceSystem />);

    await renderer.advanceFrames(5, 0.1);

    const stress = useResonanceStore.getState().currentStress;
    expect(stress).toBeGreaterThan(0.2);
  });

  it('ignores HRV when disconnected', async () => {
    useBioLinkStore.setState({ isConnected: false, hrv: 100 });
    useResonanceStore.setState({ currentStress: 0.5, decayRate: 0.0 });

    const renderer = await ReactThreeTestRenderer.create(<ResonanceSystem />);

    await renderer.advanceFrames(5, 0.1);

    const stress = useResonanceStore.getState().currentStress;
    expect(stress).toBe(0.5); // Should not change (decay is 0)
  });
});
