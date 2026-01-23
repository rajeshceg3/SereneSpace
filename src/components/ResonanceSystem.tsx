import { useFrame } from '@react-three/fiber';
import { useResonanceStore } from '../stores/useResonanceStore';

// Force-include
export const ResonanceSystem = () => {
  const decayStress = useResonanceStore((state) => state.decayStress);

  useFrame(() => {
    decayStress();
  });

  return null;
};
