import { useDestinationStore } from '../stores/useDestinationStore';
import './DestinationDetails.css';
import content from '../content.json';
import { useMemo } from 'react';

// Define a type for our content structure for better type safety
type ContentData = {
  destinations: {
    [key: string]: {
      quotes?: string[];
      questions?: string[];
    };
  };
};

const typedContent: ContentData = content;

export const DestinationDetails = () => {
  const { activeDestinationDetails, isNameVisible, isDetailsVisible } = useDestinationStore();

  const thematicContent = useMemo(() => {
    if (!activeDestinationDetails) return null;

    const destinationContent = typedContent.destinations[activeDestinationDetails.name];
    if (!destinationContent) return null;

    const items = destinationContent.quotes || destinationContent.questions || [];
    if (items.length === 0) return null;

    // Select a random item
    return items[Math.floor(Math.random() * items.length)];
  }, [activeDestinationDetails]);

  if (!activeDestinationDetails) return null;

  return (
    <div className="destination-ui-container">
      <h2 className={`destination-name ${isNameVisible ? 'visible' : ''}`}>
        {activeDestinationDetails.name}
      </h2>
      <div className={`destination-details-box ${isDetailsVisible ? 'visible' : ''}`}>
        <p>{activeDestinationDetails.description}</p>
        {thematicContent && <p className="thematic-content">{thematicContent}</p>}
      </div>
    </div>
  );
};
