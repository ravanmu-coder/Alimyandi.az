import { apiClient } from '../lib/api';

export interface AuctionDetails {
  id: string;
  name: string;
  startTimeUtc: string;
  endTimeUtc: string;
  isLive: boolean;
  currentCarLotNumber?: string;
  minBidIncrement?: number;
  locationId?: string;
}

export interface AuctionCarListItem {
  id: string;
  lotNumber: string;
  itemNumber: number;
  carId: string;
  currentPrice: number;
  bidCount: number;
  isActive: boolean;
  isReserveMet: boolean;
  lastBidTime?: string;
  photoUrls: string[];
}

export interface AuctionCarDetails {
  id: string;
  lotNumber: string;
  itemNumber: number;
  carId: string;
  auctionId: string;
  currentPrice: number;
  bidCount: number;
  isActive: boolean;
  isReserveMet: boolean;
  reservePrice?: number;
  lastBidTime?: string;
  photoUrls: string[];
  videoUrls: string[];
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    odometer: number;
    damageType: string;
    estimatedValue: number;
    titleType: string;
    keysStatus: string;
    condition: string;
    color: string;
    engine: string;
    transmission: string;
    driveType: string;
    fuelType: string;
    cylinders: number;
    doors: number;
    bodyStyle: string;
  };
  bids: Bid[];
}

export interface Bid {
  id: string;
  auctionCarId: string;
  userId: string;
  amount: number;
  isProxy: boolean;
  placedAt: string;
  userName?: string;
}

export interface AuctionSearchResult {
  count: number;
  items: AuctionCarListItem[];
}

export const auctionApi = {
  // Get auction details
  getAuction: async (auctionId: string): Promise<AuctionDetails> => {
    return apiClient.request<AuctionDetails>(`/auctions/${auctionId}`);
  },

  // Get auction cars list
  getAuctionCars: async (auctionId: string, page = 1, pageSize = 50): Promise<AuctionCarListItem[]> => {
    return apiClient.request<AuctionCarListItem[]>(`/auctions/${auctionId}/cars?page=${page}&pageSize=${pageSize}`);
  },

  // Get specific auction car details
  getAuctionCar: async (auctionCarId: string): Promise<AuctionCarDetails> => {
    return apiClient.request<AuctionCarDetails>(`/auctioncars/${auctionCarId}`);
  },

  // Search auctions
  searchAuctions: async (query: string): Promise<AuctionSearchResult> => {
    return apiClient.request<AuctionSearchResult>(`/auctions?query=${encodeURIComponent(query)}`);
  },

  // Get today's auctions
  getTodaysAuctions: async (): Promise<AuctionSearchResult> => {
    return apiClient.request<AuctionSearchResult>('/auctions/today');
  },

  // Check watchlist status
  getWatchlistStatus: async (auctionId: string): Promise<{ isWatching: boolean }> => {
    return apiClient.request<{ isWatching: boolean }>(`/auction/${auctionId}/watchlist-status`);
  }
};
