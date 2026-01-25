import { useTelemetryStore } from '../stores/useTelemetryStore';
import './TelemetryControls.css';

export const TelemetryControls = () => {
  const setDebriefOpen = useTelemetryStore((state) => state.setDebriefOpen);

  return (
    <button
      onClick={() => setDebriefOpen(true)}
      className="telemetry-controls-button"
    >
      Signal Telemetry
    </button>
  );
};
