import './NoWebGLFallback.css';

export const NoWebGLFallback = () => {
  return (
    <div className="no-webgl-container">
      <div className="no-webgl-message">
        <p>Your device does not support WebGL. Please try a different device.</p>
      </div>
    </div>
  );
};
