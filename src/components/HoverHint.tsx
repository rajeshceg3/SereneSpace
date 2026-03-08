import { useDestinationStore } from '../stores/useDestinationStore';
import './HoverHint.css';
import { useEffect, useState } from 'react';

export const HoverHint = () => {
  const { hoveredDestination } = useDestinationStore();
  const destination = useDestinationStore((state) =>
    state.destinations.find((d) => d.id === hoveredDestination)
  );
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className="hover-hint-container"
      style={{
        transform: `translate(${position.x + 20}px, ${position.y}px)`,
      }}
    >
      <div className={`hover-hint-content ${destination ? 'visible' : ''}`}>
        <span className="hover-hint-text">{destination?.name}</span>
        <span className="hover-hint-pulse"></span>
      </div>
    </div>
  );
};
