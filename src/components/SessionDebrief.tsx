import { useTelemetryStore } from '../stores/useTelemetryStore';

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
  const width = 600;
  const height = 300;
  const padding = 40;

  const getPoints = () => {
    if (sessionData.length < 2) return '';

    const maxTime = durationMs || 1; // Avoid divide by zero

    return sessionData.map((pt, i) => {
      const x = padding + ((pt.timestamp - startTime) / maxTime) * (width - 2 * padding);
      const y = height - padding - (pt.value * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00ffcc',
        fontFamily: 'monospace',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ maxWidth: '800px', width: '90%', border: '1px solid #00ffcc', padding: '20px', borderRadius: '4px', boxShadow: '0 0 20px rgba(0, 255, 204, 0.2)' }}>
        <h2 style={{ borderBottom: '1px solid #004444', paddingBottom: '10px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Mission Debrief // Cognitive Telemetry
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ border: '1px solid #004444', padding: '10px' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>DURATION</div>
            <div style={{ fontSize: '24px' }}>{durationSec}s</div>
          </div>
          <div style={{ border: '1px solid #004444', padding: '10px' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>AVG STRESS</div>
            <div style={{ fontSize: '24px' }}>{(averageStress * 100).toFixed(1)}%</div>
          </div>
          <div style={{ border: '1px solid #004444', padding: '10px' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>COHERENCE</div>
            <div style={{ fontSize: '24px', color: coherenceScore > 80 ? '#00ffcc' : 'white' }}>{coherenceScore}</div>
          </div>
        </div>

        <div style={{ border: '1px solid #004444', padding: '20px', backgroundColor: '#050510', marginBottom: '20px', position: 'relative' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', position: 'absolute', top: '10px', left: '10px' }}>STRESS INTENSITY</div>
          <svg width="100%" height="300" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#004444" strokeWidth="1" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#004444" strokeWidth="1" />

            {/* 100% Stress Line */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#004444" strokeDasharray="4" strokeWidth="1" />

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

        <div style={{ textAlign: 'right' }}>
          <button
            onClick={() => setDebriefOpen(false)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #00ffcc',
              color: '#00ffcc',
              padding: '10px 30px',
              fontFamily: 'monospace',
              fontSize: '16px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 255, 204, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Resume Mission
          </button>
        </div>
      </div>
    </div>
  );
};
