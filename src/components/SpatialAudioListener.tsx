import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { audioEngine } from '../services/AudioEngine';
import * as THREE from 'three';

export const SpatialAudioListener = () => {
  const { camera } = useThree();

  // Reuse vectors to avoid GC overhead in the render loop
  const vectors = useMemo(() => ({
      forward: new THREE.Vector3(),
      up: new THREE.Vector3()
  }), []);

  useFrame(() => {
    // Determine forward and up vectors relative to camera orientation
    vectors.forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    vectors.up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    audioEngine.setListenerPosition(
      camera.position.x, camera.position.y, camera.position.z,
      vectors.forward.x, vectors.forward.y, vectors.forward.z,
      vectors.up.x, vectors.up.y, vectors.up.z
    );
  });

  return null;
};
