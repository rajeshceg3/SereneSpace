import { useDestinationStore } from '../stores/useDestinationStore';
import './DestinationDetails.css';
import content from '../content.json';
import { useState, useEffect } from 'react';

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
  const [thematicContent, setThematicContent] = useState<string | null>(null);

  useEffect(() => {
    if (activeDestinationDetails) {
      const destinationContent = typedContent.destinations[activeDestinationDetails.name];
      if (destinationContent) {
        const items = destinationContent.quotes || destinationContent.questions || [];
        if (items.length > 0) {
          const randomContent = items[Math.floor(Math.random() * items.length)];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setThematicContent(randomContent);
        } else {
          setThematicContent(null);
        }
      } else {
        setThematicContent(null);
      }
    } else {
      setThematicContent(null);
    }
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
