/**
 * Checks if the browser supports WebGL.
 * @returns {boolean} True if WebGL is supported, false otherwise.
 */
export const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
};
