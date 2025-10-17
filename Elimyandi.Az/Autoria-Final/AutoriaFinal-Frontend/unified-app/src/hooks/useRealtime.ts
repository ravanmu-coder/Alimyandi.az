/**
 * useRealtime - Real-time Auction Data Hook
 * 
 * ❌ KÖHNƏ: SignalR event-ləri dinləyib local state idarə edirdi
 * ✅ YENİ: Yalnız store-dan oxuyur, event-lər artıq signalRManager-də
 * 
 * Bu hook sadəcə auctionStore-dan məlumat oxuyaraq komponentlərə təqdim edir.
 * Bütün real-time updates signalRManager vasitəsilə store-a yazılır.
 */

import { useCallback } from 'react';
import { useAuctionStore } from '../stores/auctionStore';
import { 
  AuctionDetailDto, 
  AuctionCarDetailDto, 
  BidGetDto 
} from '../types/api';

export interface UseRealtimeReturn {
  // Auction info
  auction: AuctionDetailDto | null;
  auctionId: string | null;
  status: 'Idle' | 'Running' | 'Paused' | 'Ended';
  isLive: boolean;
  
  // Current car
  currentCar: AuctionCarDetailDto | null;
  currentCarId: string | null;
  
  // Bidding
  currentPrice: number;
  highestBid: BidGetDto | null;
  bidHistory: BidGetDto[];
  
  // Timer (server-authoritative)
  remainingSeconds: number;
  formattedTime: string;
  timerUrgency: 'low' | 'medium' | 'high' | 'critical';
  
  // Stats
  totalBids: number;
  uniqueBidders: number;
  activeBidders: number;
  
  // Connection
  isConnected: boolean;
}

export const useRealtime = (): UseRealtimeReturn => {
  // Read all auction data from store
  const auction = useAuctionStore(state => state.auction);
  const auctionId = useAuctionStore(state => state.auctionId);
  const status = useAuctionStore(state => state.status);
  const isLive = useAuctionStore(state => state.isLive);
  
  const currentCar = useAuctionStore(state => state.currentCar);
  const currentCarId = useAuctionStore(state => state.currentCarId);
  
  const currentPrice = useAuctionStore(state => state.currentPrice);
  const highestBid = useAuctionStore(state => state.highestBid);
  const bidHistory = useAuctionStore(state => state.bidHistory);
  
  const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
  
  const totalBids = useAuctionStore(state => state.totalBids);
  const uniqueBidders = useAuctionStore(state => state.uniqueBidders);
  const activeBidders = useAuctionStore(state => state.activeBidders);
  
  const isConnected = useAuctionStore(state => state.isConnected);

  // Utility functions
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerUrgency = useCallback((): 'low' | 'medium' | 'high' | 'critical' => {
    if (remainingSeconds <= 10) return 'critical';
    if (remainingSeconds <= 30) return 'high';
    if (remainingSeconds <= 60) return 'medium';
    return 'low';
  }, [remainingSeconds]);

  return {
    // Auction info
    auction,
    auctionId,
    status,
    isLive,
    
    // Current car
    currentCar,
    currentCarId,
    
    // Bidding
    currentPrice,
    highestBid,
    bidHistory,
    
    // Timer
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    timerUrgency: getTimerUrgency(),
    
    // Stats
    totalBids,
    uniqueBidders,
    activeBidders,
    
    // Connection
    isConnected,
  };
};

/**
 * İSTİFADƏ NÜMUNƏSİ:
 * 
 * const { 
 *   currentCar, 
 *   currentPrice, 
 *   remainingSeconds, 
 *   formattedTime,
 *   bidHistory,
 *   isLive 
 * } = useRealtime();
 * 
 * return (
 *   <div>
 *     <h1>{currentCar?.car?.make} {currentCar?.car?.model}</h1>
 *     <p>Current Price: ${currentPrice.toLocaleString()}</p>
 *     <p>Time Remaining: {formattedTime}</p>
 *     <ul>
 *       {bidHistory.map(bid => (
 *         <li key={bid.id}>${bid.amount}</li>
 *       ))}
 *     </ul>
 *   </div>
 * );
 * 
 * QEYD:
 * - Bu hook yalnız oxuyur, yazmır
 * - Bütün updates signalRManager → auctionStore vasitəsilə gəlir
 * - Heç bir event dinləmir
 * - Heç bir connection yaratmır
 * - Pure data access layer
 */
