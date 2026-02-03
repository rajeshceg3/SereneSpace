import { describe, it, expect, beforeEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { EchoGenerator } from '../../components/EchoGenerator';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { useEchoStore } from '../../stores/useEchoStore';
import { useThree } from '@react-three/fiber';

// Helper to move camera
const CameraRig = ({ pos }: { pos: [number, number, number] }) => {
    const { camera } = useThree();
    camera.position.set(...pos);
    return null;
}

describe('EchoGenerator', () => {
  beforeEach(() => {
    useResonanceStore.setState({ currentStress: 1 });
    useEchoStore.getState().clearEchoes();
  });

  it('should add echo after low stress duration', async () => {
    useResonanceStore.setState({ currentStress: 0.1 });

    const renderer = await ReactThreeTestRenderer.create(
        <>
            <CameraRig pos={[0, 0, 0]} />
            <EchoGenerator />
        </>
    );

    // Advance 3.5s (35 frames * 0.1s)
    await renderer.advanceFrames(35, 0.1);

    expect(useEchoStore.getState().echoes).toHaveLength(1);
    // Y should be fixed at -2
    expect(useEchoStore.getState().echoes[0].position[1]).toBe(-2);
  });

  it('should not add echo if camera is too close to last echo', async () => {
     useResonanceStore.setState({ currentStress: 0.1 });

     const renderer = await ReactThreeTestRenderer.create(
        <>
            <CameraRig pos={[0, 0, 0]} />
            <EchoGenerator />
        </>
     );

     // Trigger first echo
     await renderer.advanceFrames(35, 0.1);
     expect(useEchoStore.getState().echoes).toHaveLength(1);

     // Advance more time (another 3.5s), camera still at 0,0,0
     await renderer.advanceFrames(35, 0.1);

     // Should still be 1
     expect(useEchoStore.getState().echoes).toHaveLength(1);
  });
});
