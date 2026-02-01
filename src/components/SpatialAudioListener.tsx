import { useFrame, useThree } from '@react-three/fiber';
import { audioEngine } from '../services/AudioEngine';

export const SpatialAudioListener = () => {
  const { camera } = useThree();

  useFrame(() => {
    audioEngine.updateListener(camera.position, camera.quaternion);
  });

  return null;
};
