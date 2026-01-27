export interface Destination {
  id: string;
  name: string;
  coordinates: [number, number, number];
  ambientColor: string;
  description: string;
}

export interface TelemetryPoint {
  timestamp: number;
  value: number; // 0 to 1 (stress level)
  event?: string; // Optional label for specific events (e.g., "Destination Arrived")
}
