// src/constants.ts

// --- CAMERA ---
export const CAMERA_INITIAL_Z = 5;
export const CAMERA_TARGET_Z_MIN = -25;
export const CAMERA_TARGET_Z_MAX = 5;
export const CAMERA_LERP_FACTOR = 0.05;
export const CAMERA_POSITION_Z_OFFSET = 1.5;

// --- SCENE ---
export const FOCUS_THRESHOLD = 2.5;

// --- ANIMATION ---
export const FADE_IN_DURATION = 1000;
export const FADE_IN_DELAY = 100;
export const FLOAT_SPEED = 2;
export const FLOAT_ROTATION_INTENSITY = 0.5;
export const FLOAT_INTENSITY = 0.5;
export const GROUP_ROTATION_Y_FACTOR = 0.05;
export const GROUP_ROTATION_X_FACTOR = 0.05;
export const BREATHING_X_FACTOR = 0.2;
export const BREATHING_Y_FACTOR = 0.2;
export const PARALLAX_X_FACTOR = 0.5;
export const PARALLAX_Y_FACTOR = 0.5;

// --- INTERACTION ---
export const SCROLL_SENSITIVITY = 0.05;

// --- UI ---
export const UI_VISIBILITY_DELAY = 2000; // 2 seconds
export const NAME_REVEAL_DELAY = 500;
export const DETAILS_REVEAL_DELAY = 1500;
export const AUTO_HIDE_DELAY = 4000;
export const PROXIMITY_CHECK_THRESHOLD = 0.1;

// --- RESONANCE (BIOFEEDBACK) ---
export const RESONANCE_DECAY_RATE = 0.005; // Stress fades slowly per frame
export const RESONANCE_SCROLL_IMPACT = 0.01; // Scroll adds a bit of stress
export const RESONANCE_KEY_IMPACT = 0.05; // Keypress adds more stress
export const RESONANCE_FOG_MULTIPLIER = 1.5; // Max stress increases fog density by 50%
export const RESONANCE_LIGHT_DIMMER = 0.3; // Max stress dims light by 30%

// --- BLOOM (REWARD SYSTEM) ---
export const BLOOM_STRESS_THRESHOLD = 0.2; // Low stress required to bloom
export const FOCUS_TIME_TO_BLOOM = 3; // Seconds of focus required to bloom

// --- ATMOSPHERE (CHRONOS) ---
export const TIME_CHECK_INTERVAL = 60000; // 1 minute
export const ATMOSPHERE_LERP_FACTOR = 0.01; // Slow transition

export const TIME_PHASES = {
  DAWN: { start: 5, end: 8 },
  DAY: { start: 8, end: 17 },
  DUSK: { start: 17, end: 20 },
  NIGHT: { start: 20, end: 5 }, // Special handling for crossing midnight
};

export const ATMOSPHERE_CONFIG = {
  DAWN: {
    color: '#ffcc99', // Warm orange/pink
    intensity: 0.8,
    backgroundColor: '#ffaa88',
    fogDensity: 0.04,
  },
  DAY: {
    color: '#ffffff', // Bright white
    intensity: 1.0,
    backgroundColor: '#88ccff',
    fogDensity: 0.02,
  },
  DUSK: {
    color: '#cc88ff', // Purple/orange
    intensity: 0.6,
    backgroundColor: '#442266',
    fogDensity: 0.05,
  },
  NIGHT: {
    color: '#4444ff', // Cool blue
    intensity: 0.3,
    backgroundColor: '#000022',
    fogDensity: 0.08,
  },
};

// --- TELEMETRY (CCTS) ---
export const TELEMETRY_GRAPH_WIDTH = 600;
export const TELEMETRY_GRAPH_HEIGHT = 300;
export const TELEMETRY_GRAPH_PADDING = 40;
export const TELEMETRY_COHERENCE_THRESHOLD = 80;

// --- SENTINEL (ADAPTIVE PROTOCOLS) ---
export const SENTINEL_HYSTERESIS_MS = 3000; // Time to sustain stress before switch
export const SENTINEL_DEEP_DIVE_DELAY_MS = 5000; // Time to sustain calm before deep dive

export const SENTINEL_PROTOCOLS = {
  OBSERVER: {
    name: 'OBSERVER',
    decayRate: RESONANCE_DECAY_RATE,
    fogDensityOffset: 0,
    lightIntensityMultiplier: 1.0,
  },
  GUIDANCE: {
    name: 'GUIDANCE',
    decayRate: 0.02, // Fast decay to restore calm
    fogDensityOffset: 0.1, // Thicker fog
    lightIntensityMultiplier: 0.6, // Dimmer light
  },
  DEEP_DIVE: {
    name: 'DEEP_DIVE',
    decayRate: 0.001, // Very slow decay (sustain flow)
    fogDensityOffset: -0.01, // Clearer
    lightIntensityMultiplier: 1.2, // Brighter
  },
} as const;
