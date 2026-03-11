import { useDestinationStore } from '../stores/useDestinationStore';
import './HoverHint.css';
import { useEffect, useRef } from 'react';

export const HoverHint = () => {
  const { hoveredDestination } = useDestinationStore();
  const destination = useDestinationStore((state) =>
    state.destinations.find((d) => d.id === hoveredDestination)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Target position from mouse
  const targetPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  // Current position for smooth interpolation
  const currentPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      targetPos.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const animate = () => {
      // Lerp (linear interpolation) for smooth spring physics feel
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.15;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.15;

      if (containerRef.current) {
        containerRef.current.style.transform = `translate(${currentPos.current.x + 20}px, ${currentPos.current.y}px)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="hover-hint-container"
    >
      <div className={`hover-hint-content ${destination ? 'visible' : ''}`}>
        <span className="hover-hint-text">{destination?.name}</span>
        <span className="hover-hint-pulse"></span>
      </div>
    </div>
  );
};
