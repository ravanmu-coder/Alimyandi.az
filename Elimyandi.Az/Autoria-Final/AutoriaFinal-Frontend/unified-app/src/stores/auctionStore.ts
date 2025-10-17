import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AuctionDetailDto, AuctionCarDetailDto, BidGetDto } from '../types/api';

// ========================================
// TYPES
// ========================================

export type AuctionStatus = 'Idle' | 'Running' | 'Paused' | 'Ended';

export interface AuctionState {
  // Auction info
  auctionId: string | null;
  auction: AuctionDetailDto | null;
  status: AuctionStatus;
  
  // Current car
  currentCar: AuctionCarDetailDto | null;
  currentCarId: string | null;
  
  // Bidding
  currentPrice: number;
  highestBid: BidGetDto | null;
  bidHistory: BidGetDto[];
  
  // Timer (server-authoritative)
  remainingSeconds: number;
  
  // Stats
  totalBids: number;
  uniqueBidders: number;
  activeBidders: number;
  
  // Connection
  isConnected: boolean;
  isLive: boolean;
}

export interface AuctionActions {
  // Initialize
  setAuctionId: (auctionId: string) => void;
  setAuction: (auction: AuctionDetailDto) => void;
  
  // Auction status
  setAuctionStatus: (status: AuctionStatus) => void;
  startAuction: () => void;
  pauseAuction: () => void;
  endAuction: () => void;
  
  // Current car
  setCurrentCar: (car: AuctionCarDetailDto | null) => void;
  setCurrentCarId: (carId: string | null) => void;
  
  // Bidding
  setCurrentPrice: (price: number) => void;
  updateHighestBid: (bid: BidGetDto) => void;
  addBidToHistory: (bid: BidGetDto) => void;
  setBidHistory: (bids: BidGetDto[]) => void;
  
  // Timer (server-driven)
  setRemainingSeconds: (seconds: number) => void;
  tickTimer: () => void; // Only for display smoothing
  resetTimer: (seconds: number) => void;
  
  // Stats
  updateStats: (stats: { totalBids?: number; uniqueBidders?: number; activeBidders?: number }) => void;
  
  // Connection
  setConnectionStatus: (isConnected: boolean) => void;
  setLiveStatus: (isLive: boolean) => void;
  
  // Reset
  reset: () => void;
}

export type AuctionStore = AuctionState & AuctionActions;

// ========================================
// INITIAL STATE
// ========================================

const initialState: AuctionState = {
  auctionId: null,
  auction: null,
  status: 'Idle',
  
  currentCar: null,
  currentCarId: null,
  
  currentPrice: 0,
  highestBid: null,
  bidHistory: [],
  
  remainingSeconds: 0,
  
  totalBids: 0,
  uniqueBidders: 0,
  activeBidders: 0,
  
  isConnected: false,
  isLive: false,
};

// ========================================
// STORE
// ========================================

export const useAuctionStore = create<AuctionStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Initialize
      setAuctionId: (auctionId) => set({ auctionId }),
      
      setAuction: (auction) => set({ auction }),
      
      // Auction status
      setAuctionStatus: (status) => {
        console.log('📊 Store: Auction status changed:', status);
        set({ status, isLive: status === 'Running' });
      },
      
      startAuction: () => {
        console.log('🚀 Store: Auction started');
        set({ status: 'Running', isLive: true });
      },
      
      pauseAuction: () => {
        console.log('⏸️ Store: Auction paused');
        set({ status: 'Paused', isLive: false });
      },
      
      endAuction: () => {
        console.log('🏁 Store: Auction ended');
        set({ status: 'Ended', isLive: false, remainingSeconds: 0 });
      },
      
      // Current car
      setCurrentCar: (car) => {
        console.log('🚗 Store: Current car changed:', car?.lotNumber);
        set({ 
          currentCar: car,
          currentCarId: car?.id || null,
          currentPrice: car?.currentPrice || car?.minPreBid || 0,
          highestBid: null,
          bidHistory: [],
        });
      },
      
      setCurrentCarId: (carId) => set({ currentCarId: carId }),
      
      // Bidding
      setCurrentPrice: (price) => {
        console.log('💰 Store: Price updated:', price);
        set({ currentPrice: price });
      },
      
      updateHighestBid: (bid) => {
        console.log('🏆 Store: Highest bid updated:', bid.amount);
        set({ 
          highestBid: bid,
          currentPrice: bid.amount,
        });
      },
      
      addBidToHistory: (bid) => {
        const { bidHistory } = get();
        // Add to beginning and keep last 50
        const newHistory = [bid, ...bidHistory].slice(0, 50);
        set({ bidHistory: newHistory });
      },
      
      setBidHistory: (bids) => set({ bidHistory: bids }),
      
      // Timer (server-driven)
      setRemainingSeconds: (seconds) => {
        console.log('⏰ Store: Timer set to:', seconds);
        set({ remainingSeconds: seconds });
      },
      
      tickTimer: () => {
        // Only for smooth display between server ticks
        const { remainingSeconds } = get();
        if (remainingSeconds > 0) {
          set({ remainingSeconds: remainingSeconds - 1 });
        }
      },
      
      resetTimer: (seconds) => {
        console.log('🔄 Store: Timer reset to:', seconds);
        set({ remainingSeconds: seconds });
      },
      
      // Stats
      updateStats: (stats) => {
        set((state) => ({
          totalBids: stats.totalBids ?? state.totalBids,
          uniqueBidders: stats.uniqueBidders ?? state.uniqueBidders,
          activeBidders: stats.activeBidders ?? state.activeBidders,
        }));
      },
      
      // Connection
      setConnectionStatus: (isConnected) => {
        console.log('🔌 Store: Connection status:', isConnected);
        set({ isConnected });
      },
      
      setLiveStatus: (isLive) => {
        console.log('🔴 Store: Live status:', isLive);
        set({ isLive });
      },
      
      // Reset
      reset: () => {
        console.log('🔄 Store: Reset to initial state');
        set(initialState);
      },
    }),
    {
      name: 'auction-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ========================================
// SELECTORS (for optimized re-renders)
// ========================================

export const selectAuctionInfo = (state: AuctionStore) => ({
  auctionId: state.auctionId,
  auction: state.auction,
  status: state.status,
  isLive: state.isLive,
});

export const selectCurrentCar = (state: AuctionStore) => ({
  currentCar: state.currentCar,
  currentCarId: state.currentCarId,
});

export const selectBidding = (state: AuctionStore) => ({
  currentPrice: state.currentPrice,
  highestBid: state.highestBid,
  bidHistory: state.bidHistory,
});

export const selectTimer = (state: AuctionStore) => ({
  remainingSeconds: state.remainingSeconds,
});

export const selectStats = (state: AuctionStore) => ({
  totalBids: state.totalBids,
  uniqueBidders: state.uniqueBidders,
  activeBidders: state.activeBidders,
});

export const selectConnection = (state: AuctionStore) => ({
  isConnected: state.isConnected,
  isLive: state.isLive,
});

