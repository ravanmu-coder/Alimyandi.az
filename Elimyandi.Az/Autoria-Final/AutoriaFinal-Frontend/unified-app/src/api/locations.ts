import { apiClient } from '../lib/api';

export interface LocationDetails {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  hours?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  username?: string;
  auctionJoinDate?: string;
}

export const locationApi = {
  // Get location details
  getLocation: async (locationId: string): Promise<LocationDetails> => {
    return apiClient.getLocation(locationId);
  },

  // Get all locations
  getLocations: async (): Promise<LocationDetails[]> => {
    return apiClient.getLocations();
  }
};
