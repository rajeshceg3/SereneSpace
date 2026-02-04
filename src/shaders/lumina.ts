// src/shaders/lumina.ts

export const luminaVertexShader = `
  uniform float uTime;
  uniform float uStress;
  uniform float uBreath;
  uniform float uPulse;

  attribute float aRandom;
  attribute float aSize;

  varying vec3 vColor;
  varying float vAlpha;

  // Simplex Noise (3D)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    // Permutations
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // Base position from instance matrix
    vec3 pos = (instanceMatrix * vec4(position, 1.0)).xyz;

    // Add Flow Movement
    float noiseScale = 0.5 + (uStress * 1.5); // Higher stress = tighter noise
    float timeScale = 0.1 + (uStress * 0.5); // Higher stress = faster flow

    float n = snoise(vec3(pos.x * noiseScale, pos.y * noiseScale, uTime * timeScale + aRandom));

    // Displacement
    // High stress: Chaotic vibration
    // Low stress: Gentle drift
    vec3 displacement = vec3(
        sin(uTime * 0.5 + aRandom * 6.28) * 0.2,
        cos(uTime * 0.3 + aRandom * 6.28) * 0.2,
        sin(uTime * 0.4 + aRandom * 6.28) * 0.2
    );

    // Apply Breath Expansion (Radial)
    float breathFactor = 1.0 + (uBreath * 0.2); // Expand by 20%
    pos = pos * breathFactor + (displacement * (1.0 + uStress * 2.0));

    // Apply noise
    pos += vec3(n) * (0.2 + uStress * 0.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation
    float pulseSize = 1.0 + (uPulse * 0.3);
    gl_PointSize = (aSize * pulseSize * (100.0 / -gl_Position.z));

    // Color Logic
    // Calm: Cyan (0.0, 1.0, 1.0) / Gold (1.0, 0.8, 0.0)
    // Stress: Red (1.0, 0.2, 0.2) / Grey (0.5, 0.5, 0.5)

    vec3 calmColor1 = vec3(0.0, 0.8, 1.0); // Cyan
    vec3 calmColor2 = vec3(1.0, 0.8, 0.4); // Gold

    vec3 stressColor1 = vec3(1.0, 0.2, 0.1); // Red/Orange
    vec3 stressColor2 = vec3(0.4, 0.4, 0.5); // Grey

    // Mix based on random
    vec3 baseCalm = mix(calmColor1, calmColor2, aRandom);
    vec3 baseStress = mix(stressColor1, stressColor2, aRandom);

    // Final mix based on Stress uniform
    vColor = mix(baseCalm, baseStress, uStress);

    // Alpha fade based on depth/stress
    vAlpha = 0.6 + (uPulse * 0.2) - (uStress * 0.2);
  }
`;

export const luminaFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft particle circle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) discard;

    // Soft edge
    float alpha = smoothstep(0.5, 0.3, dist) * vAlpha;

    gl_FragColor = vec4(vColor, alpha);
  }
`;
