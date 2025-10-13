import { useEffect, useCallback, useRef } from 'react';
import { useSignalR } from './useSignalR';
import { auctionDataService } from '../services/auctionDataService';
import { apiClient } from '../lib/api';

export interface SignalREventHandlers {
  onNewLiveBid?: (data: { auctionCarId: string; bid: any }) => void;
  onAuctionTimerReset?: (data: { auctionCarId: string; newTimerSeconds: number }) => void;
  onHighestBidUpdated?: (data: { auctionCarId: string; highestBid: any }) => void;
  onProxyBidActivated?: (data: { auctionCarId: string; proxyBid: any }) => void;
  onProxyWarCompleted?: (data: { auctionCarId: string; winner: any; finalPrice: number }) => void;
  onMoveToNextCar?: (data: { previousCarId: string; nextCarId: string; nextLot: string }) => void;
  onAuctionStarted?: (data: { auctionId: string }) => void;
  onAuctionStopped?: (data: { auctionId: string }) => void;
  onAuctionEnded?: (data: { auctionId: string; winner: any; finalPrice: number }) => void;
  onBidError?: (error: string) => void;
}

export interface UseSignalREventsReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastError: string | undefined;
  retryCount: number;
  reconnect: () => Promise<void>;
  joinAuction: (auctionId: string) => Promise<void>;
  leaveAuction: (auctionId: string) => Promise<void>;
  joinAuctionCar: (auctionCarId: string) => Promise<void>;
  leaveAuctionCar: (auctionCarId: string) => Promise<void>;
}

export const useSignalREvents = (
  auctionId: string,
  currentAuctionCarId: string | null,
  eventHandlers: SignalREventHandlers = {}
): UseSignalREventsReturn => {
  const signalR = useSignalR({
    baseUrl: 'https://localhost:7249',
    token: localStorage.getItem('authToken') || '',
    autoConnect: true,
    events: {
      onConnectionStateChanged: (state, error) => {
        console.log('SignalR connection state changed:', state, error);
      },
      onNewLiveBid: async (data) => {
        console.log('New live bid received:', data);
        
        // Update bid history for the specific auction car
        if (data.auctionCarId === currentAuctionCarId) {
          try {
            const bidHistory = await apiClient.getBidHistory(data.auctionCarId, 50);
            eventHandlers.onNewLiveBid?.(data);
          } catch (error) {
            console.error('Failed to refresh bid history:', error);
          }
        }
      },
      onAuctionTimerReset: (data) => {
        console.log('Auction timer reset:', data);
        eventHandlers.onAuctionTimerReset?.(data);
      },
      onHighestBidUpdated: async (data) => {
        console.log('Highest bid updated:', data);
        
        if (data.auctionCarId === currentAuctionCarId) {
          try {
            const highestBid = await apiClient.getHighestBid(data.auctionCarId);
            eventHandlers.onHighestBidUpdated?.(data);
          } catch (error) {
            console.error('Failed to refresh highest bid:', error);
          }
        }
      },
      onProxyBidActivated: (data) => {
        console.log('Proxy bid activated:', data);
        eventHandlers.onProxyBidActivated?.(data);
      },
      onProxyWarCompleted: (data) => {
        console.log('Proxy war completed:', data);
        eventHandlers.onProxyWarCompleted?.(data);
      },
      onCarMoved: async (data) => {
        console.log('Car moved:', data);
        
        // Refresh auction data when car changes
        try {
          await auctionDataService.refreshCurrentCarData(data.nextLot);
          eventHandlers.onMoveToNextCar?.(data);
        } catch (error) {
          console.error('Failed to refresh car data:', error);
        }
      },
      onAuctionStarted: (data) => {
        console.log('Auction started:', data);
        eventHandlers.onAuctionStarted?.(data);
      },
      onAuctionStopped: (data) => {
        console.log('Auction stopped:', data);
        eventHandlers.onAuctionStopped?.(data);
      },
      onAuctionEnded: (data) => {
        console.log('Auction ended:', data);
        eventHandlers.onAuctionEnded?.(data);
      },
      onBidError: (error) => {
        console.error('Bid error:', error);
        eventHandlers.onBidError?.(error);
      }
    }
  });

  // Auto-join auction and car groups when connected
  useEffect(() => {
    if (signalR.isConnected && auctionId) {
      signalR.joinAuction(auctionId).catch(console.error);
    }
  }, [signalR.isConnected, auctionId]);

  useEffect(() => {
    if (signalR.isConnected && currentAuctionCarId) {
      signalR.joinAuctionCar(currentAuctionCarId).catch(console.error);
    }
  }, [signalR.isConnected, currentAuctionCarId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (signalR.isConnected) {
        if (auctionId) {
          signalR.leaveAuction(auctionId).catch(console.error);
        }
        if (currentAuctionCarId) {
          signalR.leaveAuctionCar(currentAuctionCarId).catch(console.error);
        }
      }
    };
  }, [signalR.isConnected, auctionId, currentAuctionCarId]);

  return {
    isConnected: signalR.isConnected,
    isConnecting: signalR.isConnecting,
    isReconnecting: signalR.isReconnecting,
    lastError: signalR.lastError,
    retryCount: signalR.retryCount,
    reconnect: signalR.reconnect,
    joinAuction: signalR.joinAuction,
    leaveAuction: signalR.leaveAuction,
    joinAuctionCar: signalR.joinAuctionCar,
    leaveAuctionCar: signalR.leaveAuctionCar
  };
};
