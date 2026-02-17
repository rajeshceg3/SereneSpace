import { useEffect, useRef } from 'react';
import { useRespirationStore } from '../stores/useRespirationStore';
import { RespirationController } from '../services/RespirationController';

export const BioFeedbackOverlay = () => {
  const inputMode = useRespirationStore((state) => state.inputMode);
  const coherence = useRespirationStore((state) => state.coherence);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>(new Array(100).fill(0));

  useEffect(() => {
    if (inputMode !== 'MICROPHONE') return;

    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Update history
      const value = RespirationController.getValue(); // 0 to 1
      historyRef.current.push(value);
      if (historyRef.current.length > 100) historyRef.current.shift();

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw Wave
      ctx.beginPath();
      // Color shifts from Red (0) to Cyan (100)
      const hue = coherence * 1.8; // 0 -> 0, 100 -> 180 (Cyan)
      ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
      ctx.lineWidth = 2;

      const step = canvas.width / 100;
      historyRef.current.forEach((val, i) => {
        const x = i * step;
        // Invert Y because canvas origin is top-left
        const y = canvas.height - (val * canvas.height * 0.9) - 5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [inputMode, coherence]);

  if (inputMode !== 'MICROPHONE') return null;

  return (
    <div
      data-testid="bio-feedback-overlay"
      style={{
        position: 'absolute',
        bottom: '120px',
        right: '20px',
        width: '200px',
        height: '100px',
        background: 'rgba(10, 10, 20, 0.8)',
        backdropFilter: 'blur(4px)',
        borderRadius: '8px',
        padding: '10px',
        pointerEvents: 'none',
        zIndex: 100,
        border: `1px solid rgba(255, 255, 255, 0.2)`,
        boxShadow: `0 0 20px rgba(0, 255, 255, ${coherence / 500})`
      }}
    >
      <div style={{
          color: '#88ccff',
          fontFamily: 'monospace',
          fontSize: '10px',
          marginBottom: '5px',
          display: 'flex',
          justifyContent: 'space-between',
          textTransform: 'uppercase',
          letterSpacing: '1px'
      }}>
        <span>Bio-Link Active</span>
        <span style={{ color: `hsl(${coherence * 1.8}, 100%, 70%)` }}>
            {Math.round(coherence)}% Coh
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={70}
      />
    </div>
  );
};
