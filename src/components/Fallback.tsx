import React from 'react';
import './Fallback.css';

const Fallback: React.FC = () => {
  return (
    <div className="fallback-container">
      <div className="fallback-card">
        <h1>Welcome to Stillness</h1>
        <p>Your journey of calm exploration awaits.</p>
        <div className="fallback-message">
          <h2>WebGL Not Supported</h2>
          <p>
            It seems your browser does not support WebGL, which is required for the immersive 3D experience.
          </p>
          <p>
            Please try again with a modern browser like Chrome, Firefox, or Safari on a desktop computer.
          </p>
        </div>
        <p className="fallback-footer">
          We hope to see you soon.
        </p>
      </div>
    </div>
  );
};

export default Fallback;
