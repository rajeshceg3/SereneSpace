import { useDestinationStore } from '../stores/useDestinationStore';
import './DestinationDetails.css';

export const DestinationDetails = () => {
  const { activeDestinationDetails, isNameVisible, isDetailsVisible } = useDestinationStore();

  if (!activeDestinationDetails) return null;

  return (
    <div className="destination-ui-container">
      <h2 className={`destination-name ${isNameVisible ? 'visible' : ''}`}>
        {activeDestinationDetails.name}
      </h2>
      <div className={`destination-details-box ${isDetailsVisible ? 'visible' : ''}`}>
        <p>{activeDestinationDetails.description}</p>
      </div>
    </div>
  );
};
