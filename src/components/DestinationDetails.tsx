import { useEffect } from 'react';
import { useDestinationStore } from '../stores/useDestinationStore';
import './DestinationDetails.css';

export const DestinationDetails = () => {
  const { activeDestinationDetails, isUiVisible, setUiVisible } = useDestinationStore();

  useEffect(() => {
    let timeoutId: number;

    if (activeDestinationDetails) {
      // Set a timer to hide the UI after 2 seconds of inactivity
      timeoutId = window.setTimeout(() => {
        setUiVisible(false);
      }, 2000);
    }

    // Cleanup the timer if the component unmounts or the destination changes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeDestinationDetails, setUiVisible]);

  return (
    <div className={`destination-details ${activeDestinationDetails && isUiVisible ? 'visible' : ''}`}>
      {activeDestinationDetails && (
        <>
          <h2>{activeDestinationDetails.name}</h2>
          <p>{activeDestinationDetails.description}</p>
        </>
      )}
    </div>
  );
};
