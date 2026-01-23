import { useFrame } from '@react-three/fiber';
import { useResonanceStore } from '../stores/useResonanceStore';

export const ResonanceSystem = () => {
  const decayStress = useResonanceStore((state) => state.decayStress);

  useFrame(() => {
    decayStress();
  });

  return null;
};
