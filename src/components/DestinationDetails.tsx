import { useDestinationStore } from '../stores/useDestinationStore';
import './DestinationDetails.css';

export const DestinationDetails = () => {
  const { activeDestinationDetails } = useDestinationStore();

  return (
    <div className={`destination-details ${activeDestinationDetails ? 'visible' : ''}`}>
      {activeDestinationDetails && (
        <>
          <h2>{activeDestinationDetails.name}</h2>
          <p>{activeDestinationDetails.description}</p>
        </>
      )}
    </div>
  );
};
