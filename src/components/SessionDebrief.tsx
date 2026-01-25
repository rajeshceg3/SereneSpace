import { useTelemetryStore } from '../stores/useTelemetryStore';
import {
  TELEMETRY_GRAPH_WIDTH,
  TELEMETRY_GRAPH_HEIGHT,
  TELEMETRY_GRAPH_PADDING,
  TELEMETRY_COHERENCE_THRESHOLD,
} from '../constants';
import './SessionDebrief.css';

export const SessionDebrief = () => {
  const { sessionData, isDebriefOpen, setDebriefOpen } = useTelemetryStore();

  if (!isDebriefOpen) return null;

  // Metrics
  const startTime = sessionData.length > 0 ? sessionData[0].timestamp : Date.now();
  const endTime = sessionData.length > 0 ? sessionData[sessionData.length - 1].timestamp : Date.now();
  const durationMs = endTime - startTime;
  const durationSec = Math.floor(durationMs / 1000);

  const averageStress = sessionData.length > 0
    ? sessionData.reduce((acc, curr) => acc + curr.value, 0) / sessionData.length
    : 0;

  const coherenceScore = Math.round((1 - averageStress) * 100);

  // SVG Graph Config
  const width = TELEMETRY_GRAPH_WIDTH;
  const height = TELEMETRY_GRAPH_HEIGHT;
  const padding = TELEMETRY_GRAPH_PADDING;

  const getPoints = () => {
    if (sessionData.length < 2) return '';

    const maxTime = durationMs || 1; // Avoid divide by zero

    return sessionData.map((pt) => {
      const x = padding + ((pt.timestamp - startTime) / maxTime) * (width - 2 * padding);
      const y = height - padding - (pt.value * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="session-debrief-overlay">
      <div className="session-debrief-container">
        <h2 className="session-debrief-header">
          Mission Debrief // Cognitive Telemetry
        </h2>

        <div className="session-debrief-stats-grid">
          <div className="session-debrief-stat-item">
            <div className="session-debrief-label">DURATION</div>
            <div className="session-debrief-value">{durationSec}s</div>
          </div>
          <div className="session-debrief-stat-item">
            <div className="session-debrief-label">AVG STRESS</div>
            <div className="session-debrief-value">{(averageStress * 100).toFixed(1)}%</div>
          </div>
          <div className="session-debrief-stat-item">
            <div className="session-debrief-label">COHERENCE</div>
            <div
              className={`session-debrief-value ${
                coherenceScore > TELEMETRY_COHERENCE_THRESHOLD
                  ? 'session-debrief-value-high'
                  : 'session-debrief-value-normal'
              }`}
            >
              {coherenceScore}
            </div>
          </div>
        </div>

        <div className="session-debrief-graph-container">
          <div className="session-debrief-graph-label">STRESS INTENSITY</div>
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="session-debrief-svg"
          >
            {/* Grid Lines */}
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              stroke="#004444"
              strokeWidth="1"
            />
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="#004444"
              strokeWidth="1"
            />

            {/* 100% Stress Line */}
            <line
              x1={padding}
              y1={padding}
              x2={width - padding}
              y2={padding}
              stroke="#004444"
              strokeDasharray="4"
              strokeWidth="1"
            />

            {/* Data Path */}
            <polyline
              points={getPoints()}
              fill="none"
              stroke="#00ffcc"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 4px #00ffcc)' }}
            />
          </svg>
        </div>

        <div className="session-debrief-actions">
          <button
            onClick={() => setDebriefOpen(false)}
            className="session-debrief-button"
          >
            Resume Mission
          </button>
        </div>
      </div>
    </div>
  );
};
