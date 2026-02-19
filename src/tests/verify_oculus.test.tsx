import { describe, it, expect, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { OculusController } from '../components/Oculus/OculusController';
import { useOculusStore } from '../stores/useOculusStore';
import { useResonanceStore } from '../stores/useResonanceStore';

describe('Oculus System Verification', () => {
  beforeEach(() => {
    useOculusStore.setState({
      isReplaying: false,
      currentTime: 0,
      duration: 0,
      playbackSpeed: 1,
      sessionData: [],
      sessionPath: [],
    });
    useResonanceStore.setState({ currentStress: 0 });
  });

  it('should interpolate stress and time during replay', async () => {
    const now = 100000;
    const sessionPath = [
      { timestamp: now, x: 0, y: 0, z: 0, stress: 0, coherence: 0, qx: 0, qy: 0, qz: 0, qw: 1 },
      { timestamp: now + 1000, x: 10, y: 0, z: 0, stress: 1, coherence: 0, qx: 0, qy: 0, qz: 0, qw: 1 },
    ];
    const sessionData = [{ timestamp: now, value: 0 }];

    // Start Replay
    useOculusStore.getState().startReplay(sessionPath, sessionData);

    expect(useOculusStore.getState().isReplaying).toBe(true);
    expect(useOculusStore.getState().duration).toBe(1000);

    const renderer = await ReactThreeTestRenderer.create(<OculusController />);

    // Advance 0.5s (halfway)
    // advanceFrames(frames, delta)
    await renderer.advanceFrames(1, 0.5);

    // Check store time
    expect(useOculusStore.getState().currentTime).toBe(500);

    // Check stress (should be 0.5)
    const stress = useResonanceStore.getState().currentStress;
    expect(stress).toBeCloseTo(0.5);

    // Advance another 0.5s (to end)
    await renderer.advanceFrames(1, 0.5);

    expect(useOculusStore.getState().currentTime).toBe(1000);
    expect(useResonanceStore.getState().currentStress).toBeCloseTo(1.0);
  });
});
