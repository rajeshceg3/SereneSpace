import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3, Quaternion } from 'three';
import { audioEngine } from '../services/AudioEngine';

export const SpatialAudioListener = () => {
  const { camera } = useThree();

  // Refs for temp vectors to avoid GC
  const position = useRef(new Vector3());
  const forward = useRef(new Vector3());
  const up = useRef(new Vector3());
  const quaternion = useRef(new Quaternion());

  useFrame(() => {
    // Get World Position
    camera.getWorldPosition(position.current);

    // Get World Direction (Forward)
    camera.getWorldDirection(forward.current);

    // Get World Up
    // We apply the world rotation to the standard up vector (0,1,0)
    camera.getWorldQuaternion(quaternion.current);
    up.current.set(0, 1, 0).applyQuaternion(quaternion.current);

    audioEngine.updateListener(
      position.current.x, position.current.y, position.current.z,
      forward.current.x, forward.current.y, forward.current.z,
      up.current.x, up.current.y, up.current.z
    );
  });

  return null;
};
