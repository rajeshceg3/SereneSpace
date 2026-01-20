import { useCallback, useEffect } from 'react';
import { useDestinationStore } from '../stores/useDestinationStore';
import { SCROLL_SENSITIVITY, CAMERA_TARGET_Z_MIN, CAMERA_TARGET_Z_MAX, CAMERA_POSITION_Z_OFFSET } from '../constants';

export const UserInput = () => {
  const {
    destinations,
    activeDestination,
    setActiveDestination,
    cameraTargetZ,
    setCameraTargetZ,
  } = useDestinationStore();

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      const newTargetZ = cameraTargetZ - event.deltaY * SCROLL_SENSITIVITY;
      setCameraTargetZ(Math.max(CAMERA_TARGET_Z_MIN, Math.min(CAMERA_TARGET_Z_MAX, newTargetZ)));
    },
    [cameraTargetZ, setCameraTargetZ],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (destinations.length === 0) return;

      const currentIndex = destinations.findIndex((d) => d.id === activeDestination);

      let nextIndex = -1;
      if (event.key === 'ArrowRight' || event.key === 'Tab') {
        nextIndex = currentIndex >= 0 ? (currentIndex + 1) % destinations.length : 0;
      } else if (event.key === 'ArrowLeft') {
        nextIndex =
          currentIndex >= 0 ? (currentIndex - 1 + destinations.length) % destinations.length : destinations.length - 1;
      }

      if (nextIndex !== -1) {
        event.preventDefault(); // Prevent default browser action for Tab
        const nextDestination = destinations[nextIndex];
        setActiveDestination(nextDestination.id);
        setCameraTargetZ(nextDestination.coordinates[2] + CAMERA_POSITION_Z_OFFSET);
      }
    },
    [destinations, activeDestination, setActiveDestination, setCameraTargetZ],
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
