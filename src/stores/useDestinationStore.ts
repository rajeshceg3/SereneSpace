import { create } from 'zustand';

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
  isUiVisible: boolean;
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
  cameraTargetZ: 5, // Initial camera position
  isUiVisible: false,
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
    } catch (error) {
      console.error('Error loading destinations:', error);
      set({ error: 'Failed to load destination data.', isLoading: false });
    }
  },

  // Sets the active destination by ID and finds the corresponding object
  setActiveDestination: (id) => {
    const { destinations } = get();
    const details = destinations.find((d) => d.id === id) || null;
    set({ activeDestination: id, activeDestinationDetails: details, isUiVisible: !!details });
  },

  // Controls UI visibility
  setUiVisible: (visible) => {
    set({ isUiVisible: visible });
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

// Fetch destinations as soon as the store is initialized
useDestinationStore.getState().fetchDestinations();
