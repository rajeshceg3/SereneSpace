import { useFrame } from '@react-three/fiber';
import { RespirationController } from '../services/RespirationController';
import { audioEngine } from '../services/AudioEngine';

export const RespirationSystem = () => {
  useFrame((_, delta) => {
    RespirationController.update(delta);

    // Push breath value (0-1) to AudioEngine for Bio-Lock modulation
    // This runs every frame (60fps), ensuring smooth audio modulation
    audioEngine.updateBreath(RespirationController.getValue());
  });
  return null;
};
