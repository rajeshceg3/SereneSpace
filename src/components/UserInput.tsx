import { useCallback, useEffect } from 'react';
import { useDestinationStore } from '../stores/useDestinationStore';
import { useResonanceStore } from '../stores/useResonanceStore';
import {
  SCROLL_SENSITIVITY,
  CAMERA_TARGET_Z_MIN,
  CAMERA_TARGET_Z_MAX,
  CAMERA_POSITION_Z_OFFSET,
  RESONANCE_SCROLL_IMPACT,
  RESONANCE_KEY_IMPACT,
} from '../constants';

export const UserInput = () => {
  const {
    destinations,
    activeDestination,
    setActiveDestination,
    cameraTargetZ,
    setCameraTargetZ,
  } = useDestinationStore();

  const addStress = useResonanceStore((state) => state.addStress);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      const newTargetZ = cameraTargetZ - event.deltaY * SCROLL_SENSITIVITY;
      setCameraTargetZ(Math.max(CAMERA_TARGET_Z_MIN, Math.min(CAMERA_TARGET_Z_MAX, newTargetZ)));

      // Add stress based on scroll intensity (clamped to avoid massive spikes)
      const intensity = Math.min(Math.abs(event.deltaY) * 0.01, 1);
      addStress(intensity * RESONANCE_SCROLL_IMPACT);
    },
    [cameraTargetZ, setCameraTargetZ, addStress],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (destinations.length === 0) return;

      const currentIndex = destinations.findIndex((d) => d.id === activeDestination);

      let nextIndex = -1;
      if (event.key === 'ArrowRight') {
        nextIndex = currentIndex >= 0 ? (currentIndex + 1) % destinations.length : 0;
      } else if (event.key === 'ArrowLeft') {
        nextIndex =
          currentIndex >= 0 ? (currentIndex - 1 + destinations.length) % destinations.length : destinations.length - 1;
      }

      if (nextIndex !== -1) {
        // Prevent default browser action for Arrow keys to avoid page scroll (though canvas captures it usually)
        event.preventDefault();
        const nextDestination = destinations[nextIndex];
        setActiveDestination(nextDestination.id);
        setCameraTargetZ(nextDestination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);

        // Add stress on navigation
        addStress(RESONANCE_KEY_IMPACT);
      }
    },
    [destinations, activeDestination, setActiveDestination, setCameraTargetZ, addStress],
  );

  useEffect(() => {
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleWheel, handleKeyDown]);

  return null; // This component does not render anything
};
