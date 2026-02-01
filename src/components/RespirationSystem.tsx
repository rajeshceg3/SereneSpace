import { useFrame } from '@react-three/fiber';
import { RespirationController } from '../services/RespirationController';

export const RespirationSystem = () => {
  useFrame((_, delta) => {
    RespirationController.update(delta);
  });
  return null;
};
