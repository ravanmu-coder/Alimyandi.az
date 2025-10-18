import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import SignalRManager, { ConnectionState, SignalREvents, SignalRConfig } from '../utils/signalRManager';

// Hook return type
interface UseSignalRReturn {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isFailed: boolean;
  lastError?: string;
  retryCount: number;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  waitForConnection: (timeoutMs?: number) => Promise<boolean>;
  waitForState: (targetState: ConnectionState, timeoutMs?: number) => Promise<boolean>;
  
  // Group management
  joinGroup: (groupName: string, hubType?: 'auction' | 'bid') => Promise<void>;
  leaveGroup: (groupName: string, hubType?: 'auction' | 'bid') => Promise<void>;
  
  // Hub method calls
  invoke: (methodName: string, ...args: any[]) => Promise<any>;
  
  // Convenience methods for common operations
  joinAuction: (auctionId: string) => Promise<void>;
  leaveAuction: (auctionId: string) => Promise<void>;
  joinAuctionCar: (auctionCarId: string) => Promise<void>;
  leaveAuctionCar: (auctionCarId: string) => Promise<void>;
  
  // Bidding methods
  placeLiveBid: (auctionCarId: string, amount: number) => Promise<boolean>;
  placePreBid: (auctionCarId: string, amount: number) => Promise<boolean>;
  placeProxyBid: (auctionCarId: string, maxAmount: number, startAmount: number) => Promise<boolean>;
  cancelProxyBid: (auctionCarId: string) => Promise<boolean>;
}

// Hook configuration
interface UseSignalRConfig extends SignalRConfig {
  autoConnect?: boolean;
  events?: SignalREvents;
}

/**
 * React hook for SignalR connection management
 * Creates user-specific connection instances to prevent conflicts
 */
export const useSignalR = (config: UseSignalRConfig): UseSignalRReturn => {
  // Create a unique instance key based on user token and base URL
  const instanceKey = useMemo(() => {
    const token = config.token || 'anonymous';
    const baseUrl = config.baseUrl || 'default';
    return `${baseUrl}_${token.substring(0, 10)}`;
  }, [config.token, config.baseUrl]);

  const manager = useRef(SignalRManager.getInstance(instanceKey));
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [lastError, setLastError] = useState<string | undefined>();
  const [retryCount, setRetryCount] = useState(0);
  const isInitialized = useRef(false);

  // Initialize manager configuration - ALWAYS set event handlers FIRST
  useEffect(() => {
    console.log(`🔧 Initializing/Updating SignalR hook for instance: ${instanceKey}`);
    
    // CRITICAL: Set event handlers BEFORE connecting
    const eventHandlers: SignalREvents = {
      onConnectionStateChanged: (state, error) => {
        console.log(`🔄 useSignalR: Connection state changed to "${state}"`, error || '');
        setConnectionState(state);
        setLastError(error);
        setRetryCount(manager.current.getRetryCount());
        
        // Call user's event handler
        config.events?.onConnectionStateChanged?.(state, error);
      },
      ...config.events
    };
    
    // Set event handlers FIRST (before any connection attempt)
    manager.current.setEventHandlers(eventHandlers);
    console.log('✅ Event handlers set:', Object.keys(eventHandlers).filter(k => k.startsWith('on')));
    
    if (!isInitialized.current) {
      // First time initialization
      manager.current.configure(config);
      
      // Set initial state
      const initialState = manager.current.getConnectionState();
      console.log(`🔧 Setting initial connection state: ${initialState}`);
      setConnectionState(initialState);
      setRetryCount(manager.current.getRetryCount());
      
      isInitialized.current = true;
    }
  }, [config, instanceKey]);

  // Auto-connect if enabled - runs whenever initialization completes or config changes
  useEffect(() => {
    if (config.autoConnect && isInitialized.current) {
      const currentState = manager.current.getConnectionState();
      console.log(`🔌 Auto-connect check: current state = ${currentState}`);
      
      // Only connect if not already connected or connecting
      if (currentState === ConnectionState.Disconnected || currentState === ConnectionState.Failed) {
        console.log('🔌 Auto-connecting...');
        manager.current.connect().catch(error => {
          console.error('Auto-connect failed:', error);
        });
      } else {
        console.log(`🔌 Already ${currentState}, skipping auto-connect`);
      }
    }
  }, [config.autoConnect, isInitialized.current]);

  // Periodic state sync to ensure React state matches manager state
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const managerState = manager.current.getConnectionState();
      setConnectionState(prevState => {
        if (prevState !== managerState) {
          console.warn(`⚠️ State sync: Correcting state mismatch. Was "${prevState}", now "${managerState}"`);
          return managerState;
        }
        return prevState;
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(syncInterval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup on actual unmount, not on hot-reload
      if (manager.current && import.meta.env.PROD) {
        console.log(`Cleaning up SignalR instance: ${instanceKey}`);
        // Disconnect but don't destroy immediately - let other components finish
        manager.current.disconnect().catch(err => {
          console.error('Error during cleanup disconnect:', err);
        });
        
        // Destroy the instance after a delay to allow other components to cleanup
        setTimeout(() => {
          SignalRManager.destroyInstance(instanceKey);
        }, 1000);
      } else if (manager.current) {
        console.log(`🔥 Hot-reload detected, keeping SignalR connection alive`);
      }
    };
  }, [instanceKey]);

  // Connection methods
  const connect = useCallback(async (): Promise<void> => {
    await manager.current.connect();
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    await manager.current.disconnect();
  }, []);

  const reconnect = useCallback(async (): Promise<void> => {
    await manager.current.reconnect();
  }, []);

  const waitForConnection = useCallback(async (timeoutMs?: number): Promise<boolean> => {
    return await manager.current.waitForConnection(timeoutMs);
  }, []);

  const waitForState = useCallback(async (targetState: ConnectionState, timeoutMs?: number): Promise<boolean> => {
    return await manager.current.waitForState(targetState, timeoutMs);
  }, []);

  // Group management
  const joinGroup = useCallback(async (groupName: string, hubType: 'auction' | 'bid' = 'auction'): Promise<void> => {
    await manager.current.joinGroup(groupName, hubType);
  }, []);

  const leaveGroup = useCallback(async (groupName: string, hubType: 'auction' | 'bid' = 'auction'): Promise<void> => {
    await manager.current.leaveGroup(groupName, hubType);
  }, []);

  // Hub method calls
  const invoke = useCallback(async (methodName: string, ...args: any[]): Promise<any> => {
    return await manager.current.invoke(methodName, ...args);
  }, []);

  // Convenience methods
  const joinAuction = useCallback(async (auctionId: string): Promise<void> => {
    await manager.current.joinGroup(auctionId, 'auction');
  }, []);

  const leaveAuction = useCallback(async (auctionId: string): Promise<void> => {
    await manager.current.leaveGroup(auctionId, 'auction');
  }, []);

  const joinAuctionCar = useCallback(async (auctionCarId: string): Promise<void> => {
    await manager.current.joinGroup(auctionCarId, 'bid');
  }, []);

  const leaveAuctionCar = useCallback(async (auctionCarId: string): Promise<void> => {
    await manager.current.leaveGroup(auctionCarId, 'bid');
  }, []);

  // Bidding methods
  const placeLiveBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    try {
      await manager.current.invoke('PlaceLiveBid', auctionCarId, amount);
      return true;
    } catch (error) {
      console.error('Failed to place live bid:', error);
      return false;
    }
  }, []);

  const placePreBid = useCallback(async (auctionCarId: string, amount: number): Promise<boolean> => {
    try {
      await manager.current.invoke('PlacePreBid', auctionCarId, amount);
      return true;
    } catch (error) {
      console.error('Failed to place pre-bid:', error);
      return false;
    }
  }, []);

  const placeProxyBid = useCallback(async (auctionCarId: string, maxAmount: number, startAmount: number): Promise<boolean> => {
    try {
      await manager.current.invoke('PlaceProxyBid', auctionCarId, maxAmount, startAmount);
      return true;
    } catch (error) {
      console.error('Failed to place proxy bid:', error);
      return false;
    }
  }, []);

  const cancelProxyBid = useCallback(async (auctionCarId: string): Promise<boolean> => {
    try {
      await manager.current.invoke('CancelProxyBid', auctionCarId);
      return true;
    } catch (error) {
      console.error('Failed to cancel proxy bid:', error);
      return false;
    }
  }, []);

  // Computed properties
  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;
  const isReconnecting = connectionState === ConnectionState.Reconnecting;
  const isFailed = connectionState === ConnectionState.Failed;

  return {
    // Connection state
    connectionState,
    isConnected,
    isConnecting,
    isReconnecting,
    isFailed,
    lastError,
    retryCount,
    
    // Connection methods
    connect,
    disconnect,
    reconnect,
    waitForConnection,
    waitForState,
    
    // Group management
    joinGroup,
    leaveGroup,
    
    // Hub method calls
    invoke,
    
    // Convenience methods
    joinAuction,
    leaveAuction,
    joinAuctionCar,
    leaveAuctionCar,
    
    // Bidding methods
    placeLiveBid,
    placePreBid,
    placeProxyBid,
    cancelProxyBid
  };
};

export default useSignalR;