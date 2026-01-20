import { useDestinationStore } from '../stores/useDestinationStore';
import './DestinationDetails.css';

export const DestinationDetails = () => {
  const { activeDestinationDetails, isUiVisible } = useDestinationStore();

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
