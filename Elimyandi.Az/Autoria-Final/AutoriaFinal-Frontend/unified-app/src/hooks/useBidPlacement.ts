import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuctionStore } from '../stores/auctionStore';
import { BidGetDto } from '../types/api';

/**
 * useBidPlacement
 * 
 * Bid placement məntiqini idarə edir
 * Optimistic UI update + server validation
 */

interface UseBidPlacementProps {
  placeLiveBid: (auctionCarId: string, amount: number) => Promise<void>;
}

interface UseBidPlacementReturn {
  isPlacing: boolean;
  placeBid: (auctionCarId: string, amount: number) => Promise<boolean>;
}

export const useBidPlacement = ({
  placeLiveBid
}: UseBidPlacementProps): UseBidPlacementReturn => {
  const [isPlacing, setIsPlacing] = useState(false);
  
  // Store actions
  const updateHighestBid = useAuctionStore(state => state.updateHighestBid);
  const addBidToHistory = useAuctionStore(state => state.addBidToHistory);
  const currentCar = useAuctionStore(state => state.currentCar);
  const highestBid = useAuctionStore(state => state.highestBid);
  const auction = useAuctionStore(state => state.auction);

  const placeBid = useCallback(async (
    auctionCarId: string, 
    amount: number
  ): Promise<boolean> => {
    console.log('🎯 [useBidPlacement] Placing bid:', { auctionCarId, amount });

    if (!currentCar) {
      toast.error('No active vehicle');
      return false;
    }

    // ========================================
    // VALIDATION
    // ========================================
    
    const currentHigh = highestBid?.amount || currentCar.currentPrice || 0;
    const increment = auction?.minBidIncrement || 100;
    const minimumBid = currentHigh + increment;

    if (amount < minimumBid) {
      toast.error(`Minimum bid: $${minimumBid.toLocaleString()}`);
      return false;
    }

    if (amount <= currentHigh) {
      toast.error(`Bid must be higher than $${currentHigh.toLocaleString()}`);
      return false;
    }

    // ========================================
    // OPTIMISTIC UI UPDATE
    // ========================================
    
    setIsPlacing(true);

    const optimisticBid: BidGetDto = {
      id: `temp-${Date.now()}`,
      auctionCarId: auctionCarId,
      userId: 'current-user',
      amount: amount,
      bidType: 'Live',
      timestamp: new Date().toISOString(),
      isWinning: true,
      isOutbid: false,
      user: {
        id: 'current-user',
        email: '',
        firstName: 'You',
        lastName: ''
      }
    };

    // Update store optimistically
    updateHighestBid(optimisticBid);
    addBidToHistory(optimisticBid);

    console.log('⚡ Optimistic update applied');

    // ========================================
    // SERVER REQUEST
    // ========================================
    
    try {
      await placeLiveBid(auctionCarId, amount);
      
      console.log('✅ [useBidPlacement] Bid successful');
      toast.success('You are now the highest bidder!', {
        icon: '🏆',
        duration: 4000
      });
      
      return true;
    } catch (err: any) {
      console.error('❌ [useBidPlacement] Bid failed:', err);
      
      // ========================================
      // ERROR HANDLING (Revert optimistic update)
      // ========================================
      
      // Backend error messages
      const errorMessage = err?.response?.data?.message || err?.message || err?.toString() || '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Error details:', { errorMessage, err });
      }
      
      // Specific error messages
      if (errorMessage.includes('Auction is not active') || errorMessage.includes('not active')) {
        toast.error('❌ Auction is not active', { id: 'bid-error', duration: 4000 });
      } else if (errorMessage.includes('Seller cannot bid') || errorMessage.includes('seller')) {
        toast.error('❌ Seller cannot bid on own vehicle', { id: 'bid-error', duration: 4000 });
      } else if (errorMessage.includes('minimum bid') || errorMessage.includes('increment')) {
        toast.error(`❌ Bid too low - minimum: $${minimumBid.toLocaleString()}`, { 
          id: 'bid-error', 
          duration: 4000 
        });
      } else if (errorMessage.includes('Proxy bid conflict') || errorMessage.includes('proxy')) {
        toast.error('❌ Proxy bid conflict - higher proxy bid exists', { 
          id: 'bid-error', 
          duration: 4000 
        });
      } else if (errorMessage.includes('AuctionBusinessException') || errorMessage.includes('business')) {
        toast.error('❌ Business rule violation', { id: 'bid-error', duration: 4000 });
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('not authorized')) {
        toast.error('❌ You are not authorized to bid', { id: 'bid-error', duration: 4000 });
      } else {
        toast.error(`❌ ${errorMessage || 'Failed to place bid'}`, { 
          id: 'bid-error', 
          duration: 4000 
        });
      }
      
      // Note: Store will be updated by real-time events from backend
      // No need to manually revert - NewLiveBid event will sync correct state
      
      return false;
    } finally {
      setIsPlacing(false);
    }
  }, [placeLiveBid, currentCar, highestBid, auction, updateHighestBid, addBidToHistory]);

  return {
    isPlacing,
    placeBid
  };
};

export default useBidPlacement;
