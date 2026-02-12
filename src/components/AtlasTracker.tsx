import { useFrame, useThree } from '@react-three/fiber';
import { atlasService } from '../services/AtlasService';

export const AtlasTracker = () => {
  const { camera } = useThree();

  useFrame(() => {
    atlasService.trackPosition(camera.position.z);
  });

  return null;
};
