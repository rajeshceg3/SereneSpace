import { useEffect, useState } from 'react';
import { useAegisData } from './useAegisData';
import { AegisDisplay } from './AegisDisplay';
import { AegisAudio } from './AegisAudio';
import { useAtlasStore } from '../../stores/useAtlasStore';

export const AegisSystem = () => {
  const [isVisible, setIsVisible] = useState(false);
  const metrics = useAegisData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle HUD with 'H' key
      if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsVisible(prev => !prev);
      }

      // Toggle Atlas with 'M' key
      if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        useAtlasStore.getState().toggleAtlas();
      }
    };

    // Log instruction for the user (Mission Control style)
    console.log('[AEGIS] System Standby. Press "H" to toggle Tactical HUD, "M" for Neural Atlas.');

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <AegisDisplay metrics={metrics} />
      <AegisAudio />
    </>
  );
};
