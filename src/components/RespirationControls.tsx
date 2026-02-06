import { useRespirationStore, BREATH_PATTERNS } from '../stores/useRespirationStore';
import './RespirationControls.css';

export const RespirationControls = () => {
  const isActive = useRespirationStore((state) => state.isActive);
  const toggleActive = useRespirationStore((state) => state.toggleActive);
  const selectedPatternId = useRespirationStore((state) => state.selectedPatternId);
  const setPattern = useRespirationStore((state) => state.setPattern);
  const currentPhase = useRespirationStore((state) => state.currentPhase);
  const inputMode = useRespirationStore((state) => state.inputMode);
  const setInputMode = useRespirationStore((state) => state.setInputMode);

  return (
    <div className="respiration-controls">
      <div className="respiration-header">
        <span className="respiration-title">REA // PROTOCOL</span>
        <button
          className={`respiration-toggle ${isActive ? 'active' : ''}`}
          onClick={toggleActive}
        >
          {isActive ? 'ENGAGED' : 'STANDBY'}
        </button>
      </div>

      {isActive && (
        <div className="respiration-panel">
          <div className="respiration-phase">
            {inputMode === 'MICROPHONE' ? 'BIO-SYNC LINKED' : currentPhase.replace('_', ' ')}
          </div>

          <div className="respiration-modes">
            <button
                className={`mode-btn ${inputMode === 'PROCEDURAL' ? 'selected' : ''}`}
                onClick={() => setInputMode('PROCEDURAL')}
            >
                AUTO
            </button>
            <button
                className={`mode-btn ${inputMode === 'MICROPHONE' ? 'selected' : ''}`}
                onClick={() => setInputMode('MICROPHONE')}
            >
                MIC
            </button>
          </div>

          {inputMode === 'PROCEDURAL' && (
            <div className="respiration-patterns">
                {Object.values(BREATH_PATTERNS).map((pattern) => (
                <button
                    key={pattern.id}
                    className={`pattern-btn ${selectedPatternId === pattern.id ? 'selected' : ''}`}
                    onClick={() => setPattern(pattern.id)}
                    title={pattern.description}
                >
                    {pattern.name}
                </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
