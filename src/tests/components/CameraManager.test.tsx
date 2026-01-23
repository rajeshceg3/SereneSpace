import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { CameraManager } from '../../components/CameraManager';
import * as THREE from 'three';

// Define the mock store state
let mockState: any;

vi.mock('../../stores/useDestinationStore', () => ({
  useDestinationStore: () => mockState,
}));

describe('CameraManager Integration', () => {
  const setActiveDestination = vi.fn();
  const setCameraTargetZ = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      destinations: [
        { id: 'paris', name: 'Paris', coordinates: [0, 0, 0] },
        { id: 'kyoto', name: 'Kyoto', coordinates: [0, 0, -10] },
      ],
      activeDestination: 'paris',
      setActiveDestination,
      cameraTargetZ: 0,
      reducedMotion: false,
      setCameraTargetZ,
    };
  });

  it('moves camera and activates destination', async () => {
    const groupRef = React.createRef<THREE.Group>() as React.RefObject<THREE.Group>;
    const renderer = await ReactThreeTestRenderer.create(
      <CameraManager groupRef={groupRef} />
    );

    // Initial settle
    await renderer.advanceFrames(2, 0.1);

    // Change target to Kyoto
    mockState = {
        ...mockState,
        cameraTargetZ: -10
    };

    // Update component to pick up new state
    await renderer.update(<CameraManager groupRef={groupRef} />);

    // Advance frames to allow lerp to reach the target
    // Distance 10, lerp factor 0.1 (defaultish).
    // It takes some frames to get close enough (< FOCUS_THRESHOLD).
    await renderer.advanceFrames(60, 0.16); // 60 frames at ~60fps

    // Verify setActiveDestination was called with 'kyoto'
    expect(setActiveDestination).toHaveBeenCalledWith('kyoto');
  });

  it('does not active destination if not close enough', async () => {
    const groupRef = React.createRef<THREE.Group>() as React.RefObject<THREE.Group>;
    const renderer = await ReactThreeTestRenderer.create(
      <CameraManager groupRef={groupRef} />
    );

     // Change target to somewhere in between
    mockState = {
        ...mockState,
        cameraTargetZ: -5
    };
    await renderer.update(<CameraManager groupRef={groupRef} />);

    await renderer.advanceFrames(60, 0.16);

    // Should NOT have called setActiveDestination('kyoto') because -5 is not close to -10
    expect(setActiveDestination).not.toHaveBeenCalledWith('kyoto');
  });
});
