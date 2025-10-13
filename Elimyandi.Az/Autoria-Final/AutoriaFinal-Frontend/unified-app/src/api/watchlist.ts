import { apiClient } from '../lib/api';

export interface WatchlistItem {
  id: string;
  auctionCarId: string;
  userId: string;
  addedAt: string;
}

export interface AddToWatchlistRequest {
  auctionCarId: string;
}

export interface AddToWatchlistResponse {
  success: boolean;
  message: string;
  watchlistItem?: WatchlistItem;
}

export const watchlistApi = {
  // Add item to watchlist
  addToWatchlist: async (data: AddToWatchlistRequest): Promise<AddToWatchlistResponse> => {
    return apiClient.request<AddToWatchlistResponse>('/watchlist', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Remove item from watchlist
  removeFromWatchlist: async (auctionCarId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.request<{ success: boolean; message: string }>(`/watchlist/${auctionCarId}`, {
      method: 'DELETE'
    });
  },

  // Get user's watchlist
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    return apiClient.request<WatchlistItem[]>('/watchlist');
  },

  // Check if item is in watchlist
  isInWatchlist: async (auctionCarId: string): Promise<{ isWatching: boolean }> => {
    return apiClient.request<{ isWatching: boolean }>(`/watchlist/check/${auctionCarId}`);
  }
};
