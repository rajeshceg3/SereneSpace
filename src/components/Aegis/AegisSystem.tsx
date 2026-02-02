import { useEffect, useState } from 'react';
import { useAegisData } from './useAegisData';
import { AegisDisplay } from './AegisDisplay';

export const AegisSystem = () => {
  const [isVisible, setIsVisible] = useState(false);
  const metrics = useAegisData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle HUD with 'H' key
      if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsVisible(prev => !prev);
      }
    };

    // Log instruction for the user (Mission Control style)
    console.log('[AEGIS] System Standby. Press "H" to toggle Tactical HUD.');

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return <AegisDisplay metrics={metrics} />;
};
