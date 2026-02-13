// Stream Shader for Mnemosyne Feature

export const STREAM_VERTEX_SHADER = `
  varying vec2 vUv;
  varying float vProgress; // Along the path

  void main() {
    vUv = uv;
    vProgress = uv.x; // TubeGeometry maps x along length? Or y?
    // Usually:
    // x = u (0..1) around the tube
    // y = v (0..1) along the tube
    // Wait, Three.js TubeGeometry:
    // "The u coordinate is calculated along the tube, and v is calculated around the tube."
    // So u (x) is length, v (y) is circumference?
    // Let's assume standard UV mapping: x=u, y=v.

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const STREAM_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSpeed;

  varying vec2 vUv;

  // Simple 2D Noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // UV.x is along the tube (length)
    // UV.y is around the tube (circumference)

    float flowTime = uTime * uSpeed;

    // Create flowing noise pattern
    float noise = snoise(vec2(vUv.x * 10.0 - flowTime, vUv.y * 5.0));

    // Create streaks
    float streaks = smoothstep(0.3, 0.7, noise);

    // Pulse based on time
    float pulse = 0.8 + 0.2 * sin(uTime * 2.0);

    // Gradient along length (fades at ends)
    float startFade = smoothstep(0.0, 0.1, vUv.x);
    float endFade = smoothstep(1.0, 0.9, vUv.x);
    float lengthFade = startFade * endFade;

    // Edge glow (fades at circumference edges if using ribbon, but for tube it wraps)
    // If we want a "core" glow, we can use fresnel or just noise.

    vec3 finalColor = uColor + vec3(streaks * 0.5); // Add brightness for streaks

    gl_FragColor = vec4(finalColor, uOpacity * lengthFade * (0.5 + 0.5 * streaks) * pulse);
  }
`;
