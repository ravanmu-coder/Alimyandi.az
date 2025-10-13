import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

interface BidHubConfig {
  baseUrl: string;
  token: string;
}

interface JoinedAuctionCar {
  auctionCarId: string;
  highestBid: number;
  stats: {
    totalBids: number;
    bidCount: number;
    averageBid: number;
    soldCount: number;
    totalSalesAmount: number;
  };
  lastBidTime: string;
  minimumBid: number;
  joinedAt: string;
}

interface NewLiveBid {
  id: string;
  auctionCarId: string;
  userId: string;
  amount: number;
  placedAtUtc: string;
  userName: string;
  isHighestBid: boolean;
}

interface HighestBidUpdated {
  auctionCarId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  updatedAt: string;
}

interface PreBidPlaced {
  id: string;
  auctionCarId: string;
  userId: string;
  amount: number;
  placedAtUtc: string;
  userName: string;
}

interface AuctionTimerReset {
  auctionCarId: string;
  secondsRemaining: number;
  resetAt: string;
}

interface BidStatsUpdated {
  auctionCarId: string;
  stats: {
    totalBids: number;
    bidCount: number;
    averageBid: number;
    soldCount: number;
    totalSalesAmount: number;
  };
}

interface BidValidationError {
  errors: string[];
  minimumBid: number;
  suggestedAmount: number;
}

interface BidHubEvents {
  onJoinedAuctionCar: (data: JoinedAuctionCar) => void;
  onNewLiveBid: (data: NewLiveBid) => void;
  onPreBidPlaced: (data: PreBidPlaced) => void;
  onHighestBidUpdated: (data: HighestBidUpdated) => void;
  onAuctionTimerReset: (data: AuctionTimerReset) => void;
  onBidStatsUpdated: (data: BidStatsUpdated) => void;
  onBidValidationError: (data: BidValidationError) => void;
  onBidError: (error: string) => void;
  onConnectionStateChanged: (isConnected: boolean, error?: string) => void;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  reconnectAttempts: number;
}

export const useBidHub = (config: BidHubConfig, events: BidHubEvents) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0
  });

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      console.log('BidHub already connected');
      return;
    }

    if (connectionRef.current?.state === signalR.HubConnectionState.Connecting) {
      console.log('BidHub connection already in progress');
      return;
    }

    // Validate configuration
    if (!config.baseUrl) {
      const error = 'Base URL is required for BidHub connection';
      console.error(error);
      setConnectionState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error 
      }));
      events.onConnectionStateChanged(false, error);
      return;
    }

    if (!config.token) {
      const error = 'Authentication token is required for BidHub connection';
      console.error(error);
      setConnectionState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error 
      }));
      events.onConnectionStateChanged(false, error);
      return;
    }

    try {
      setConnectionState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: undefined 
      }));

      console.log('Starting BidHub connection to:', `${config.baseUrl}/bidHub`);
      console.log('Using token:', config.token ? 'Present' : 'Missing');

      // Create connection with authorization
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${config.baseUrl}/bidHub`, {
          accessTokenFactory: () => {
            console.log('Providing token for authentication');
            return config.token;
          },
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: true,
          withCredentials: false
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            console.log(`Reconnection attempt ${retryContext.previousRetryCount + 1}/${maxReconnectAttempts}`);
            if (retryContext.previousRetryCount < maxReconnectAttempts) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null;
          }
        })
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      // Set up event handlers
      connection.on('JoinedAuctionCar', events.onJoinedAuctionCar);
      connection.on('NewLiveBid', events.onNewLiveBid);
      connection.on('PreBidPlaced', events.onPreBidPlaced);
      connection.on('HighestBidUpdated', events.onHighestBidUpdated);
      connection.on('AuctionTimerReset', events.onAuctionTimerReset);
      connection.on('BidStatsUpdated', events.onBidStatsUpdated);
      // connection.on('BidValidationError', events.onBidValidationError);
      connection.on('BidError', events.onBidError);

      // Handle connection state changes
      connection.onclose((error) => {
        console.error('BidHub connection closed:', error);
        if (error) {
          console.error('Close details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
        }
        setConnectionState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: false,
          error: error?.message || 'Connection closed unexpectedly'
        }));
        events.onConnectionStateChanged(false, error?.message || 'Connection closed unexpectedly');
      });

      connection.onreconnecting((error) => {
        console.warn('BidHub reconnecting:', error);
        setConnectionState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isConnecting: true,
          error: error?.message || 'Reconnecting...'
        }));
        events.onConnectionStateChanged(false, error?.message || 'Reconnecting...');
      });

      connection.onreconnected((connectionId) => {
        console.log('BidHub reconnected successfully:', connectionId);
        setConnectionState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false,
          error: undefined,
          reconnectAttempts: 0
        }));
        events.onConnectionStateChanged(true);
      });

      connectionRef.current = connection;

      // Start connection
      await connection.start();
      
      console.log('BidHub connected successfully');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: true, 
        isConnecting: false,
        error: undefined,
        reconnectAttempts: 0
      }));
      events.onConnectionStateChanged(true);

    } catch (error: any) {
      console.error('BidHub connection failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        config: {
          baseUrl: config.baseUrl,
          hasToken: !!config.token
        }
      });
      
      const errorMessage = error.message || 'Connection failed';
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isConnecting: false,
        error: errorMessage,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
      events.onConnectionStateChanged(false, errorMessage);

      // Attempt reconnection
      const currentAttempts = connectionState.reconnectAttempts;
      if (currentAttempts < maxReconnectAttempts) {
        console.log(`Attempting reconnection ${currentAttempts + 1}/${maxReconnectAttempts} in ${reconnectDelay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else {
        console.error('Max reconnection attempts reached. Manual reconnection required.');
      }
    }
  }, [config.baseUrl, config.token]);

  const disconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        console.log('BidHub disconnected');
      } catch (error) {
        console.error('Error disconnecting BidHub:', error);
      }
      connectionRef.current = null;
    }

    setConnectionState({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    });
  }, []);

  // Hub method calls
  const joinAuctionCar = useCallback(async (auctionCarId: string): Promise<JoinedAuctionCar | null> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.warn('BidHub not connected, skipping join auction car');
      return null;
    }

    try {
      console.log('Joining auction car:', auctionCarId);
      const result = await connectionRef.current.invoke<JoinedAuctionCar>('JoinAuctionCar', auctionCarId);
      console.log('Joined auction car result:', result);
      return result;
    } catch (error) {
      console.error('Failed to join auction car:', error);
      events.onBidError(`Failed to join auction car: ${error}`);
      return null;
    }
  }, [connectionState.isConnected, events]);

  const leaveAuctionCar = useCallback(async (auctionCarId: string): Promise<void> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.error('BidHub not connected');
      return;
    }

    try {
      console.log('Leaving auction car:', auctionCarId);
      await connectionRef.current.invoke('LeaveAuctionCar', auctionCarId);
      console.log('Left auction car successfully');
    } catch (error) {
      console.error('Failed to leave auction car:', error);
      events.onBidError(`Failed to leave auction car: ${error}`);
    }
  }, [connectionState.isConnected, events]);

  const placeLiveBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.error('BidHub not connected');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('=== PLACING LIVE BID ===');
      console.log('auctionCarId:', auctionCarId);
      console.log('auctionCarId type:', typeof auctionCarId);
      console.log('auctionCarId length:', auctionCarId?.length);
      console.log('amount:', amount);
      console.log('amount type:', typeof amount);
      console.log('SignalR connection state:', connectionState);
      console.log('========================');
      
      await connectionRef.current.invoke('PlaceLiveBid', auctionCarId, amount);
      console.log('Live bid placed successfully');
      return true;
    } catch (error) {
      console.error('Failed to place live bid:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        auctionCarId,
        amount
      });
      events.onBidError(`Failed to place live bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const placePreBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.error('BidHub not connected');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('Placing pre-bid:', { auctionCarId, amount });
      await connectionRef.current.invoke('PlacePreBid', auctionCarId, amount);
      console.log('Pre-bid placed successfully');
      return true;
    } catch (error) {
      console.error('Failed to place pre-bid:', error);
      events.onBidError(`Failed to place pre-bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const placeProxyBid = useCallback(async (auctionCarId: string, startAmount: number, maxAmount: number): Promise<boolean> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.error('BidHub not connected');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('Placing proxy bid:', { auctionCarId, startAmount, maxAmount });
      await connectionRef.current.invoke('PlaceProxyBid', auctionCarId, startAmount, maxAmount);
      console.log('Proxy bid placed successfully');
      return true;
    } catch (error) {
      console.error('Failed to place proxy bid:', error);
      events.onBidError(`Failed to place proxy bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const cancelProxyBid = useCallback(async (auctionCarId: string): Promise<boolean> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.error('BidHub not connected');
      events.onBidError('Not connected to auction');
      return false;
    }

    try {
      console.log('Canceling proxy bid:', auctionCarId);
      await connectionRef.current.invoke('CancelProxyBid', auctionCarId);
      console.log('Proxy bid canceled successfully');
      return true;
    } catch (error) {
      console.error('Failed to cancel proxy bid:', error);
      events.onBidError(`Failed to cancel proxy bid: ${error}`);
      return false;
    }
  }, [connectionState.isConnected, events]);

  const getAuctionStats = useCallback(async (auctionCarId: string): Promise<any> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.warn('BidHub not connected, skipping join auction car');
      return null;
    }

    try {
      console.log('Getting auction stats:', auctionCarId);
      const stats = await connectionRef.current.invoke('GetAuctionStats', auctionCarId);
      console.log('Auction stats received:', stats);
      return stats;
    } catch (error) {
      console.error('Failed to get auction stats:', error);
      events.onBidError(`Failed to get auction stats: ${error}`);
      return null;
    }
  }, [connectionState.isConnected, events]);

  const getMyBids = useCallback(async (auctionCarId: string): Promise<any[]> => {
    if (!connectionRef.current || connectionState.isConnected === false) {
      console.error('BidHub not connected');
      return [];
    }

    try {
      console.log('Getting my bids:', auctionCarId);
      const bids = await connectionRef.current.invoke<any[]>('GetMyBids', auctionCarId);
      console.log('My bids received:', bids);
      return bids || [];
    } catch (error) {
      console.error('Failed to get my bids:', error);
      events.onBidError(`Failed to get my bids: ${error}`);
      return [];
    }
  }, [connectionState.isConnected, events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  // Utility function to test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Test multiple endpoints to see which one works
      const endpoints = ['/health', '/api/health', '/api/admin/health', '/'];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing endpoint: ${config.baseUrl}${endpoint}`);
          const response = await fetch(`${config.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log(`Backend health check passed on ${endpoint}`);
            return true;
          } else {
            console.warn(`Backend health check failed on ${endpoint}:`, response.status, response.statusText);
          }
        } catch (endpointError) {
          console.warn(`Endpoint ${endpoint} failed:`, endpointError);
        }
      }
      
      console.error('All health check endpoints failed');
      return false;
    } catch (error) {
      console.error('Backend health check error:', error);
      return false;
    }
  }, [config.baseUrl, config.token]);

  return {
    connectionState,
    connect,
    disconnect,
    testConnection,
    joinAuctionCar,
    leaveAuctionCar,
    placeLiveBid,
    placePreBid,
    placeProxyBid,
    cancelProxyBid,
    getAuctionStats,
    getMyBids
  };
};
