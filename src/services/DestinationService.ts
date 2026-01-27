import { Destination } from '../types';

export class DestinationService {
  static async fetchDestinations(): Promise<Destination[]> {
    const response = await fetch(`${import.meta.env.BASE_URL}destinations.json`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: Destination[] = await response.json();
    return data;
  }
}
