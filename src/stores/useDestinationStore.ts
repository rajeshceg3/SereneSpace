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
  activeDestinationDetails: Destination | null; // To hold the full object
  isUiVisible: boolean;
  isLoading: boolean;
  error: string | null;
  fetchDestinations: () => Promise<void>;
  setActiveDestination: (id: string | null) => void;
  setUiVisible: (visible: boolean) => void;
}

export const useDestinationStore = create<DestinationState>((set, get) => ({
  destinations: [],
  activeDestination: null,
  activeDestinationDetails: null,
  isUiVisible: false,
  isLoading: true,
  error: null,

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
}));

// Fetch destinations as soon as the store is initialized
useDestinationStore.getState().fetchDestinations();
