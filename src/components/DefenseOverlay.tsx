import { useSentinelStore } from '../stores/useSentinelStore';
import { THREAT_LEVELS } from '../constants';

export const DefenseOverlay = () => {
  const threatLevel = useSentinelStore((state) => state.threatLevel);
  const config = THREAT_LEVELS[threatLevel];

  if (!config) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 5, // Below UI (typically z-index 10+) but above Canvas
    transition: 'all 2s ease-in-out', // Slow transition for atmospheric feel
    boxShadow: config.vignette > 0
        ? `inset 0 0 ${config.vignette * 30}vw ${config.color}`
        : 'none',
    backdropFilter: config.desaturation > 0
        ? `grayscale(${config.desaturation * 100}%) sepia(${config.desaturation * 30}%)`
        : 'none',
    // We don't use backgroundColor here because boxShadow handles the tint via the vignette color
    // but for CRITICAL we might want a full screen tint?
    // The vignette is usually enough.
  };

  return <div style={style} data-testid="defense-overlay" />;
};
