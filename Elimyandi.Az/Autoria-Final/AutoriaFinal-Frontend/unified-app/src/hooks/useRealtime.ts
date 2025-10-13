import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

interface RealtimeConfig {
  baseUrl: string;
  token: string;
}

interface BidData {
  id: string;
  auctionCarId: string;
  userId: string;
  amount: number;
  placedAtUtc: string;
  userName: string;
  isHighestBid: boolean;
}

interface BidStats {
  totalBids: number;
  bidCount: number;
  averageBid: number;
  soldCount: number;
  totalSalesAmount: number;
}

interface RealtimeEvents {
  onNewLiveBid: (data: BidData) => void;
  onAuctionTimerReset: (data: { auctionCarId: string; secondsRemaining: number }) => void;
  onMoveToNextCar: (data: { previousCarId: string; nextCarId: string; nextLotNumber: string }) => void;
  onHighestBidUpdated: (data: { auctionCarId: string; amount: number; bidderName: string }) => void;
  onBidStatsUpdated: (data: { auctionCarId: string; stats: BidStats }) => void;
  onConnectionStateChanged: (isConnected: boolean, error?: string) => void;
  onBidError: (error: string) => void;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

export const useRealtime = (config: RealtimeConfig, events: RealtimeEvents) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false
  });

  const auctionHubRef = useRef<signalR.HubConnection | null>(null);
  const bidHubRef = useRef<signalR.HubConnection | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const currentAuctionIdRef = useRef<string | null>(null);
  const currentCarIdRef = useRef<string | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async (auctionId: string, carId?: string) => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current || connectionState.isConnected) {
      console.log('Realtime connection already in progress or connected');
      return;
    }

    // Check if we've exceeded max retries
    if (retryCountRef.current >= maxRetries) {
      console.log('Max retry attempts reached, stopping connection attempts');
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Max retry attempts reached. Please refresh the page.'
      }));
      events.onConnectionStateChanged(false, 'Max retry attempts reached. Please refresh the page.');
      return;
    }

    isConnectingRef.current = true;
    setConnectionState(prev => ({ ...prev, isConnecting: true, error: undefined }));

    try {
      console.log('🚀 Starting realtime connection...', { auctionId, carId });

      // Disconnect existing connections first
      await disconnect();

      // Test backend connectivity first
      try {
        const response = await fetch(`${config.baseUrl}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Backend health check failed: ${response.status}`);
        }
        console.log('✅ Backend health check passed');
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
        throw new Error('Backend server is not available. Please check if the server is running.');
      }

      // Create AuctionHub connection with fallback transports
      const auctionConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${config.baseUrl}/auctionHub`, {
          accessTokenFactory: () => config.token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            console.log(`AuctionHub reconnection attempt ${retryContext.previousRetryCount + 1}`);
            if (retryContext.previousRetryCount < 2) return 2000;
            if (retryContext.previousRetryCount < 5) return 10000;
            return null; // Stop retrying after 5 attempts
          }
        })
        .configureLogging(signalR.LogLevel.Warning) // Reduce log noise
        .build();

      // Create BidHub connection with fallback transports
      const bidConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${config.baseUrl}/bidHub`, {
          accessTokenFactory: () => config.token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            console.log(`BidHub reconnection attempt ${retryContext.previousRetryCount + 1}`);
            if (retryContext.previousRetryCount < 2) return 2000;
            if (retryContext.previousRetryCount < 5) return 10000;
            return null; // Stop retrying after 5 attempts
          }
        })
        .configureLogging(signalR.LogLevel.Warning) // Reduce log noise
        .build();

      // Set up AuctionHub event handlers
      auctionConnection.on('AuctionTimerReset', events.onAuctionTimerReset);
      auctionConnection.on('MoveToNextCar', events.onMoveToNextCar);
      auctionConnection.on('CarMoved', events.onMoveToNextCar);

      // Set up BidHub event handlers
      bidConnection.on('NewLiveBid', events.onNewLiveBid);
      bidConnection.on('HighestBidUpdated', events.onHighestBidUpdated);
      bidConnection.on('BidStatsUpdated', events.onBidStatsUpdated);
      bidConnection.on('BidError', events.onBidError);

      // Handle connection state changes with timeout
      const connectionTimeout = setTimeout(() => {
        console.error('❌ Connection timeout after 10 seconds');
        auctionConnection.stop();
        bidConnection.stop();
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'Connection timeout'
        }));
        events.onConnectionStateChanged(false, 'Connection timeout');
      }, 10000);

      auctionConnection.onclose((error) => {
        clearTimeout(connectionTimeout);
        console.log('AuctionHub connection closed:', error);
        if (error) {
          setConnectionState(prev => ({ 
            ...prev, 
            isConnected: false, 
            isConnecting: false,
            error: error.message 
          }));
          events.onConnectionStateChanged(false, error.message);
        }
      });

      bidConnection.onclose((error) => {
        clearTimeout(connectionTimeout);
        console.log('BidHub connection closed:', error);
        if (error) {
          setConnectionState(prev => ({ 
            ...prev, 
            isConnected: false, 
            isConnecting: false,
            error: error.message 
          }));
          events.onConnectionStateChanged(false, error.message);
        }
      });

      // Start connections with timeout
      console.log('🔌 Starting AuctionHub connection...');
      await Promise.race([
        auctionConnection.start(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AuctionHub connection timeout')), 5000))
      ]);
      console.log('✅ AuctionHub connected successfully');

      console.log('🔌 Starting BidHub connection...');
      await Promise.race([
        bidConnection.start(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('BidHub connection timeout')), 5000))
      ]);
      console.log('✅ BidHub connected successfully');

      clearTimeout(connectionTimeout);

      // Join auction group
      console.log('🎯 Joining auction group:', auctionId);
      await auctionConnection.invoke('JoinAuctionGroup', auctionId);
      console.log('✅ Successfully joined auction group:', auctionId);

      // Join car group if carId provided
      if (carId) {
        console.log('🚗 Joining car group:', carId);
        await bidConnection.invoke('JoinCarGroup', carId);
        console.log('✅ Successfully joined car group:', carId);
        currentCarIdRef.current = carId;
      }

      auctionHubRef.current = auctionConnection;
      bidHubRef.current = bidConnection;
      currentAuctionIdRef.current = auctionId;

      setConnectionState({
        isConnected: true,
        isConnecting: false,
        error: undefined
      });

      events.onConnectionStateChanged(true);
      retryCountRef.current = 0; // Reset retry count on successful connection
      console.log('🎉 Realtime connection established successfully');

    } catch (error) {
      console.error('❌ Realtime connection failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: errorMessage
      }));
      
      events.onConnectionStateChanged(false, errorMessage);

      // Increment retry count and schedule retry if under limit
      retryCountRef.current++;
      if (retryCountRef.current < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        console.log(`⏰ Scheduling retry ${retryCountRef.current}/${maxRetries} in ${retryDelay}ms`);
        
        retryTimeoutRef.current = setTimeout(() => {
          isConnectingRef.current = false;
          connect(auctionId, carId);
        }, retryDelay);
      } else {
        console.error('❌ Max retry attempts reached, stopping connection attempts');
        events.onConnectionStateChanged(false, 'Unable to connect to auction server. Please check your connection and try again.');
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [config.baseUrl, config.token, events, connectionState.isConnected]);

  const disconnect = useCallback(async () => {
    console.log('🔌 Disconnecting realtime...');
    
    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    try {
      if (currentCarIdRef.current && bidHubRef.current) {
        console.log('🚗 Leaving car group:', currentCarIdRef.current);
        await bidHubRef.current.invoke('LeaveCarGroup', currentCarIdRef.current);
      }
    } catch (error) {
      console.error('Error leaving car group:', error);
    }

    try {
      if (auctionHubRef.current) {
        console.log('🛑 Stopping AuctionHub...');
        await auctionHubRef.current.stop();
        auctionHubRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping AuctionHub:', error);
    }
    
    try {
      if (bidHubRef.current) {
        console.log('🛑 Stopping BidHub...');
        await bidHubRef.current.stop();
        bidHubRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping BidHub:', error);
    }
    
    isConnectingRef.current = false;
    currentAuctionIdRef.current = null;
    currentCarIdRef.current = null;
    
    setConnectionState({
      isConnected: false,
      isConnecting: false,
      error: undefined
    });
    
    console.log('✅ Realtime disconnected');
  }, []);

  const switchToCar = useCallback(async (newCarId: string) => {
    if (!bidHubRef.current || !connectionState.isConnected) {
      console.warn('Not connected to BidHub, cannot switch car');
      return;
    }

    try {
      // Leave current car group
      if (currentCarIdRef.current) {
        console.log('🚗 Leaving current car group:', currentCarIdRef.current);
        await bidHubRef.current.invoke('LeaveCarGroup', currentCarIdRef.current);
      }

      // Join new car group
      console.log('🚗 Joining new car group:', newCarId);
      await bidHubRef.current.invoke('JoinCarGroup', newCarId);
      currentCarIdRef.current = newCarId;
      
      console.log('✅ Successfully switched to car:', newCarId);
    } catch (error) {
      console.error('❌ Failed to switch car:', error);
      events.onBidError(`Failed to switch to car: ${error}`);
    }
  }, [connectionState.isConnected, events]);

  const placeLiveBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    if (!bidHubRef.current || !connectionState.isConnected) {
      console.error('Not connected to BidHub');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('💰 Placing live bid:', { auctionCarId, amount });
      await bidHubRef.current.invoke('PlaceLiveBid', auctionCarId, amount);
      console.log('✅ Live bid placed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to place live bid:', error);
      events.onBidError(`Failed to place live bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const placePreBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    if (!bidHubRef.current || !connectionState.isConnected) {
      console.error('Not connected to BidHub');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('💰 Placing pre-bid:', { auctionCarId, amount });
      await bidHubRef.current.invoke('PlacePreBid', auctionCarId, amount);
      console.log('✅ Pre-bid placed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to place pre-bid:', error);
      events.onBidError(`Failed to place pre-bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const placeProxyBid = useCallback(async (auctionCarId: string, maxAmount: number, startAmount: number): Promise<boolean> => {
    if (!bidHubRef.current || !connectionState.isConnected) {
      console.error('Not connected to BidHub');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('💰 Placing proxy bid:', { auctionCarId, maxAmount, startAmount });
      await bidHubRef.current.invoke('PlaceProxyBid', auctionCarId, maxAmount, startAmount);
      console.log('✅ Proxy bid placed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to place proxy bid:', error);
      events.onBidError(`Failed to place proxy bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const cancelProxyBid = useCallback(async (auctionCarId: string): Promise<boolean> => {
    if (!bidHubRef.current || !connectionState.isConnected) {
      console.error('Not connected to BidHub');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('🚫 Canceling proxy bid:', auctionCarId);
      await bidHubRef.current.invoke('CancelProxyBid', auctionCarId);
      console.log('✅ Proxy bid canceled successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel proxy bid:', error);
      events.onBidError(`Failed to cancel proxy bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const getMinimumBid = useCallback(async (auctionCarId: string): Promise<number> => {
    if (!bidHubRef.current || !connectionState.isConnected) {
      console.warn('Not connected to BidHub');
      return 0;
    }

    try {
      console.log('🔍 Getting minimum bid for:', auctionCarId);
      const minimumBid = await bidHubRef.current.invoke<number>('GetMinimumBid', auctionCarId);
      console.log('✅ Minimum bid received:', minimumBid);
      return minimumBid || 0;
    } catch (error) {
      console.error('❌ Failed to get minimum bid:', error);
      return 0;
    }
  }, [connectionState.isConnected]);

  const getBidHistory = useCallback(async (auctionCarId: string): Promise<BidData[]> => {
    if (!bidHubRef.current || !connectionState.isConnected) {
      console.warn('Not connected to BidHub');
      return [];
    }

    try {
      console.log('📜 Getting bid history for:', auctionCarId);
      const history = await bidHubRef.current.invoke<BidData[]>('GetBidHistory', auctionCarId);
      console.log('✅ Bid history received:', history);
      return history || [];
    } catch (error) {
      console.error('❌ Failed to get bid history:', error);
      return [];
    }
  }, [connectionState.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    connect,
    disconnect,
    switchToCar,
    placeLiveBid,
    placePreBid,
    placeProxyBid,
    cancelProxyBid,
    getMinimumBid,
    getBidHistory
  };
};
