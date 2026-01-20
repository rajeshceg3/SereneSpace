import { create } from 'zustand';
import {
  CAMERA_INITIAL_Z,
  NAME_REVEAL_DELAY,
  DETAILS_REVEAL_DELAY,
  AUTO_HIDE_DELAY,
} from '../constants';

// Matches the structure in public/destinations.json
export interface Destination {
  id: string;
  name: string;
  coordinates: [number, number, number];
  ambientColor: string;
  description: string;
}

interface DestinationState {
  destinations: Destination[];
  activeDestination: string | null;
  hoveredDestination: string | null;
  activeDestinationDetails: Destination | null; // To hold the full object
  cameraTargetZ: number;
  isUiVisible: boolean; // Deprecated, but keeping for compatibility if needed
  isNameVisible: boolean;
  isDetailsVisible: boolean;
  uiVisibilityTimer: NodeJS.Timeout | null;
  isLoading: boolean;
  error: string | null;
  reducedMotion: boolean;
  fetchDestinations: () => Promise<void>;
  setActiveDestination: (id: string | null) => void;
  setHoveredDestination: (id: string | null) => void;
  setCameraTargetZ: (z: number) => void;
  setUiVisible: (visible: boolean) => void;
}

export const useDestinationStore = create<DestinationState>((set, get) => ({
  destinations: [],
  activeDestination: null,
  hoveredDestination: null,
  activeDestinationDetails: null,
  cameraTargetZ: CAMERA_INITIAL_Z,
  isUiVisible: false,
  isNameVisible: false,
  isDetailsVisible: false,
  uiVisibilityTimer: null,
  isLoading: true,
  error: null,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  // Fetches destination data from the public JSON file
  fetchDestinations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}destinations.json`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: Destination[] = await response.json();
      set({ destinations: data, isLoading: false });

      // Set the first destination as active by default
      if (data.length > 0) {
        get().setActiveDestination(data[0].id);
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
      set({ error: 'Failed to load destination data.', isLoading: false });
    }
  },

  // Sets the active destination by ID and finds the corresponding object
  setActiveDestination: (id) => {
    const { destinations, uiVisibilityTimer } = get();

    // When a destination changes, always hide the UI first and clear any existing timer
    if (uiVisibilityTimer) {
      clearTimeout(uiVisibilityTimer);
    }
    set({ isUiVisible: false, isNameVisible: false, isDetailsVisible: false }); // Ensure UI is hidden initially

    const details = destinations.find((d) => d.id === id) || null;
    set({ activeDestination: id, activeDestinationDetails: details });

    // If there's a new active destination, start the timer logic
    if (details) {
      // 1. Reveal Name
      const nameTimer = setTimeout(() => {
        if (get().activeDestination !== id) return;
        set({ isNameVisible: true, isUiVisible: true }); // Sync old flag too

        // 2. Reveal Details
        const detailsTimer = setTimeout(() => {
          if (get().activeDestination !== id) return;
          set({ isDetailsVisible: true });

          // 3. Auto Hide
          const hideTimer = setTimeout(() => {
            if (get().activeDestination !== id) return;
            set({ isNameVisible: false, isDetailsVisible: false, isUiVisible: false });
          }, AUTO_HIDE_DELAY);

          set({ uiVisibilityTimer: hideTimer });
        }, DETAILS_REVEAL_DELAY - NAME_REVEAL_DELAY);

        set({ uiVisibilityTimer: detailsTimer });
      }, NAME_REVEAL_DELAY);

      set({ uiVisibilityTimer: nameTimer });
    }
  },

  // Controls UI visibility
  setUiVisible: (visible) => {
    const { uiVisibilityTimer } = get();
    if (uiVisibilityTimer) {
      clearTimeout(uiVisibilityTimer);
    }
    set({ isUiVisible: visible, uiVisibilityTimer: null });
  },

  // Sets the hovered destination by ID
  setHoveredDestination: (id) => {
    set({ hoveredDestination: id });
  },

  // Sets the camera's target Z position
  setCameraTargetZ: (z) => {
    set({ cameraTargetZ: z });
  },
}));
