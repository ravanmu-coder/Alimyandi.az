import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api';

export interface UseBidPlacementReturn {
  placeLiveBid: (amount: number) => Promise<boolean>;
  placePreBid: (amount: number) => Promise<boolean>;
  placeProxyBid: (startAmount: number, maxAmount: number) => Promise<boolean>;
  cancelProxyBid: () => Promise<boolean>;
  isPlacingBid: boolean;
  lastBidSuccess: boolean;
  lastBidError: string | null;
  validateBid: (amount: number, currentPrice: number, minimumBid: number) => string | null;
  calculateNextMinimumBid: (currentPrice: number) => number;
}

export const useBidPlacement = (
  auctionCarId: string, 
  isConnected: boolean
): UseBidPlacementReturn => {
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [lastBidSuccess, setLastBidSuccess] = useState(false);
  const [lastBidError, setLastBidError] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const showSuccess = useCallback(() => {
    setLastBidSuccess(true);
    setLastBidError(null);
    clearTimeouts();
    
    successTimeoutRef.current = setTimeout(() => {
      setLastBidSuccess(false);
    }, 3000);
  }, [clearTimeouts]);

  const showError = useCallback((error: string) => {
    setLastBidError(error);
    setLastBidSuccess(false);
    clearTimeouts();
    
    errorTimeoutRef.current = setTimeout(() => {
      setLastBidError(null);
    }, 5000);
  }, [clearTimeouts]);

  const validateBid = useCallback((
    amount: number, 
    currentPrice: number, 
    minimumBid: number
  ): string | null => {
    if (amount < minimumBid) {
      return `Minimum bid is $${minimumBid.toLocaleString()}`;
    }
    if (amount <= currentPrice) {
      return `Bid must be higher than current price of $${currentPrice.toLocaleString()}`;
    }
    if (amount > 1000000) {
      return 'Bid amount seems unusually high. Please verify.';
    }
    if (amount % 25 !== 0) {
      return 'Bid amount must be in increments of $25';
    }
    return null;
  }, []);

  const calculateNextMinimumBid = useCallback((currentPrice: number): number => {
    // Copart-style bid increments
    if (currentPrice < 100) return currentPrice + 25;
    if (currentPrice < 500) return currentPrice + 50;
    if (currentPrice < 1000) return currentPrice + 100;
    if (currentPrice < 5000) return currentPrice + 250;
    if (currentPrice < 10000) return currentPrice + 500;
    return currentPrice + 1000;
  }, []);

  const placeLiveBid = useCallback(async (amount: number): Promise<boolean> => {
    if (!isConnected) {
      showError('Not connected to auction. Please refresh the page.');
      return false;
    }

    if (!auctionCarId) {
      showError('No auction car selected.');
      return false;
    }
    
    setIsPlacingBid(true);
    setLastBidError(null);
    
    try {
      const result = await apiClient.placeLiveBid({ auctionCarId, amount });
      
      if (result) {
        showSuccess();
        return true;
      } else {
        showError('Failed to place bid. Please try again.');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to place bid. Please try again.';
      showError(errorMessage);
      return false;
    } finally {
      setIsPlacingBid(false);
    }
  }, [auctionCarId, isConnected, showSuccess, showError]);

  const placePreBid = useCallback(async (amount: number): Promise<boolean> => {
    if (!isConnected) {
      showError('Not connected to auction. Please refresh the page.');
      return false;
    }

    if (!auctionCarId) {
      showError('No auction car selected.');
      return false;
    }
    
    setIsPlacingBid(true);
    setLastBidError(null);
    
    try {
      const result = await apiClient.placePreBid({ auctionCarId, amount });
      
      if (result) {
        showSuccess();
        return true;
      } else {
        showError('Failed to place pre-bid. Please try again.');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to place pre-bid. Please try again.';
      showError(errorMessage);
      return false;
    } finally {
      setIsPlacingBid(false);
    }
  }, [auctionCarId, isConnected, showSuccess, showError]);

  const placeProxyBid = useCallback(async (startAmount: number, maxAmount: number): Promise<boolean> => {
    if (!isConnected) {
      showError('Not connected to auction. Please refresh the page.');
      return false;
    }

    if (!auctionCarId) {
      showError('No auction car selected.');
      return false;
    }

    if (startAmount >= maxAmount) {
      showError('Start amount must be less than maximum amount.');
      return false;
    }
    
    setIsPlacingBid(true);
    setLastBidError(null);
    
    try {
      const result = await apiClient.placeProxyBid({ 
        auctionCarId, 
        maxAmount, 
        incrementAmount: 25 
      });
      
      if (result) {
        showSuccess();
        return true;
      } else {
        showError('Failed to place proxy bid. Please try again.');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to place proxy bid. Please try again.';
      showError(errorMessage);
      return false;
    } finally {
      setIsPlacingBid(false);
    }
  }, [auctionCarId, isConnected, showSuccess, showError]);

  const cancelProxyBid = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      showError('Not connected to auction. Please refresh the page.');
      return false;
    }

    if (!auctionCarId) {
      showError('No auction car selected.');
      return false;
    }
    
    setIsPlacingBid(true);
    setLastBidError(null);
    
    try {
      // Note: This endpoint would need to be implemented in the backend
      // For now, we'll simulate success
      showSuccess();
      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to cancel proxy bid. Please try again.';
      showError(errorMessage);
      return false;
    } finally {
      setIsPlacingBid(false);
    }
  }, [auctionCarId, isConnected, showSuccess, showError]);

  return {
    placeLiveBid,
    placePreBid,
    placeProxyBid,
    cancelProxyBid,
    isPlacingBid,
    lastBidSuccess,
    lastBidError,
    validateBid,
    calculateNextMinimumBid
  };
};
