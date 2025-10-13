import { useState, useEffect, useCallback, useRef } from 'react';
import { auctionDataService, AuctionPageData } from '../services/auctionDataService';
import { apiClient } from '../lib/api';

export interface UseAuctionDataReturn {
  data: AuctionPageData | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refreshCurrentCar: (lotNumber: string) => Promise<void>;
  updateBidHistory: (auctionCarId: string) => Promise<void>;
  updateMinimumBid: (auctionCarId: string) => Promise<number>;
}

export const useAuctionData = (auctionId: string): UseAuctionDataReturn => {
  const [data, setData] = useState<AuctionPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      const result = await auctionDataService.initializeAuctionPage(auctionId);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setData(result);
    } catch (err) {
      // Don't update state if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load auction data');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [auctionId]);

  const refreshCurrentCar = useCallback(async (lotNumber: string) => {
    if (!data) return;

    try {
      const refreshedData = await auctionDataService.refreshCurrentCarData(lotNumber);
      
      setData(prev => prev ? {
        ...prev,
        currentCar: refreshedData.currentCar,
        carDetails: refreshedData.carDetails,
        highestBid: refreshedData.highestBid,
        bidHistory: refreshedData.bidHistory
      } : null);
    } catch (err) {
      console.error('Failed to refresh current car data:', err);
    }
  }, [data]);

  const updateBidHistory = useCallback(async (auctionCarId: string) => {
    try {
      const bidHistory = await apiClient.getBidHistory(auctionCarId, 50);
      
      setData(prev => prev ? {
        ...prev,
        bidHistory
      } : null);
    } catch (err) {
      console.error('Failed to update bid history:', err);
    }
  }, []);

  const updateMinimumBid = useCallback(async (auctionCarId: string): Promise<number> => {
    try {
      const minimumBid = await apiClient.getMinimumBid(auctionCarId);
      return minimumBid;
    } catch (err) {
      console.error('Failed to update minimum bid:', err);
      return 0;
    }
  }, []);

  useEffect(() => {
    loadData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  return {
    data,
    loading,
    error,
    reload: loadData,
    refreshCurrentCar,
    updateBidHistory,
    updateMinimumBid
  };
};
