import { useDestinationStore } from '../stores/useDestinationStore';
import './ReducedMotionToggle.css';

export const ReducedMotionToggle = () => {
  const { reducedMotion, toggleReducedMotion } = useDestinationStore();

  return (
    <button
      className={`reduced-motion-toggle ${reducedMotion ? 'active' : ''}`}
      onClick={toggleReducedMotion}
      aria-pressed={reducedMotion}
      title={reducedMotion ? 'Enable Motion' : 'Reduce Motion'}
    >
      <span className="icon">
        {reducedMotion ? '⏸' : '▶'}
      </span>
      <span className="label">{reducedMotion ? 'Still' : 'Motion'}</span>
    </button>
  );
};
