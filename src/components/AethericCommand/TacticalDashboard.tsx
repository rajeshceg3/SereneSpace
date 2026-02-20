import React, { useEffect, useRef } from 'react';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { useBioLinkStore } from '../../stores/useBioLinkStore';
import { useRespirationStore } from '../../stores/useRespirationStore';
import { useSentinelStore } from '../../stores/useSentinelStore';

export const TacticalDashboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to stores
  const stress = useResonanceStore((state) => state.currentStress);
  const hrv = useBioLinkStore((state) => state.hrv);
  const coherence = useRespirationStore((state) => state.coherence);
  const threatLevel = useSentinelStore((state) => state.threatLevel);
  const activeProtocol = useSentinelStore((state) => state.activeProtocol);

  // History for graph
  const historyRef = useRef<{ stress: number; hrv: number; coherence: number }[]>([]);
  const maxHistory = 300; // 5 seconds at 60fps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Update data
      historyRef.current.push({
        stress,
        hrv: Math.min(100, hrv), // Cap for visualization
        coherence
      });
      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 4) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // Helper to map value to Y
      const mapY = (val: number, max: number) => {
        return canvas.height - (val / max) * canvas.height;
      };

      // Draw Stress (Red) - Range 0-1
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      historyRef.current.forEach((pt, i) => {
        const x = (i / maxHistory) * canvas.width;
        const y = mapY(pt.stress, 1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw HRV (Green) - Range 0-100 (Assumed)
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      historyRef.current.forEach((pt, i) => {
        const x = (i / maxHistory) * canvas.width;
        const y = mapY(pt.hrv, 150); // Scale 0-150ms
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw Coherence (Blue) - Range 0-100
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      historyRef.current.forEach((pt, i) => {
        const x = (i / maxHistory) * canvas.width;
        const y = mapY(pt.coherence, 100);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [stress, hrv, coherence]); // Re-start loop if static values change? No, better to read from refs or closure.
  // Actually, useEffect dependencies here restart the loop, which is fine but inefficient.
  // Better to use a ref for current values.

  // Optimization: use Ref for current values to avoid re-binding the loop
  const currentValues = useRef({ stress, hrv, coherence });
  useEffect(() => {
    currentValues.current = { stress, hrv, coherence };
  }, [stress, hrv, coherence]);

  // Revised Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resize
    const resize = () => {
        if (containerRef.current && canvas) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const { stress, hrv, coherence } = currentValues.current;

      historyRef.current.push({ stress, hrv, coherence });
      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      [0.25, 0.5, 0.75].forEach(p => {
          const y = canvas.height * p;
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
      });
      ctx.stroke();

      // Draw functions
      const drawLine = (color: string, getValue: (pt: any) => number, max: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        historyRef.current.forEach((pt, i) => {
            const x = (i / (maxHistory - 1)) * canvas.width;
            const y = canvas.height - (getValue(pt) / max) * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };

      drawLine('#ff5555', p => p.stress, 1.0);     // Stress (Red)
      drawLine('#55ff55', p => p.hrv, 150);        // HRV (Green)
      drawLine('#55aaff', p => p.coherence, 100);  // Coherence (Blue)

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
    };
  }, []); // Run once

  return (
    <div className="tactical-dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div className="status-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #333' }}>
        <div className="metric">
            <span style={{ color: '#888', fontSize: '0.8rem' }}>THREAT LEVEL</span>
            <div style={{
                color: threatLevel === 'SAFE' ? '#5f5' : threatLevel === 'CRITICAL' ? '#f55' : '#fb5',
                fontWeight: 'bold'
            }}>{threatLevel}</div>
        </div>
        <div className="metric">
            <span style={{ color: '#888', fontSize: '0.8rem' }}>PROTOCOL</span>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>{activeProtocol}</div>
        </div>
        <div className="metric">
            <span style={{ color: '#888', fontSize: '0.8rem' }}>COHERENCE</span>
            <div style={{ color: '#5af', fontWeight: 'bold' }}>{coherence.toFixed(0)}%</div>
        </div>
      </div>

      <div className="graph-container" ref={containerRef} style={{ flex: 1, minHeight: '200px', background: '#050505', border: '1px solid #333', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#ff5555' }}>■ STRESS</span>
            <span style={{ color: '#55ff55' }}>■ HRV</span>
            <span style={{ color: '#55aaff' }}>■ COHERENCE</span>
        </div>
      </div>
    </div>
  );
};
