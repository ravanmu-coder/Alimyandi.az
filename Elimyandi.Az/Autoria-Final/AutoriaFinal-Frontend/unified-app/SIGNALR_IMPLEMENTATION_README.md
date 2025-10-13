# SignalR Connection Management System

## 🚨 Problem Solved

The previous implementation had multiple critical issues:
- **Multiple SignalR connections**: Each component created its own connection
- **Connection storms**: Server overwhelmed with simultaneous connections
- **No connection state management**: Components couldn't track connection status
- **Infinite retry loops**: No exponential backoff strategy
- **Memory leaks**: Poor cleanup on component unmount
- **No authentication handling**: JWT token management issues

## ✅ Solution Overview

### 1. Singleton SignalR Manager (`utils/signalRManager.ts`)

**Key Features:**
- **Singleton Pattern**: Single connection instance across the entire application
- **Connection State Management**: Disconnected, Connecting, Connected, Reconnecting, Failed
- **Exponential Backoff**: Retry intervals [2000, 5000, 10000, 30000, 60000]ms
- **JWT Authentication**: Automatic token handling and refresh
- **Network Status Detection**: Online/offline awareness
- **Memory Leak Prevention**: Proper cleanup and event listener management
- **Page Visibility Handling**: Pause/resume connections when tab is hidden

**Connection States:**
```typescript
enum ConnectionState {
  Disconnected = 'Disconnected',    // Initial state
  Connecting = 'Connecting',         // Attempting connection
  Connected = 'Connected',           // Successfully connected
  Reconnecting = 'Reconnecting',    // Retrying after failure
  Failed = 'Failed'                 // Max retries exceeded
}
```

**Error Categories:**
```typescript
enum ErrorCategory {
  Network = 'Network',              // Connection/timeout issues
  Authentication = 'Authentication', // Token/auth problems
  Server = 'Server',                // 500/503 errors
  Unknown = 'Unknown'               // Other errors
}
```

### 2. React Hook (`hooks/useSignalR.ts`)

**Features:**
- **Easy Integration**: Simple hook interface for components
- **Auto-connect Option**: Optional automatic connection on mount
- **Event Handling**: Centralized event subscription management
- **Group Management**: Join/leave auction and car groups
- **Bidding Methods**: Pre-bid, live bid, proxy bid functionality

**Usage Example:**
```typescript
const {
  connectionState,
  isConnected,
  isConnecting,
  lastError,
  connect,
  disconnect,
  joinAuction,
  joinAuctionCar,
  placeLiveBid,
  placePreBid,
  placeProxyBid
} = useSignalR({
  baseUrl: 'https://localhost:7249',
  token: localStorage.getItem('authToken'),
  autoConnect: true,
  events: {
    onNewLiveBid: (data) => console.log('New bid:', data),
    onConnectionStateChanged: (state, error) => console.log('State:', state)
  }
});
```

### 3. Connection Status Component (`components/ConnectionStatus.tsx`)

**Features:**
- **Real-time Status Display**: Shows current connection state
- **Error Information**: Displays error categories and details
- **Manual Reconnect**: Button to retry connection
- **Retry Counter**: Shows attempt progress (X/5)
- **Online/Offline Detection**: Network status awareness

**Status Indicators:**
- 🟢 **Bağlantı Aktiv** - Normal operation
- 🟡 **Bağlanır...** - Connection attempt in progress
- 🟡 **Bağlantı Kəsildi - Yenidən bağlanır...** - Retrying with backoff
- 🔴 **Bağlantı Uğursuz** - Max retries exceeded, manual reconnect needed
- 📡 **İnternet Bağlantısı Yoxdur** - Device offline

## 🔧 Configuration

### SignalR Manager Configuration
```typescript
interface SignalRConfig {
  baseUrl: string;                    // Backend URL
  token: string;                      // JWT authentication token
  hubUrl?: string;                    // Default: '/auctionHub'
  transport?: HttpTransportType;      // Default: WebSockets
  timeout?: number;                   // Default: 30000ms
  keepAliveInterval?: number;         // Default: 15000ms
}
```

### Event Handlers
```typescript
interface SignalREvents {
  onConnectionStateChanged?: (state: ConnectionState, error?: string) => void;
  onAuctionStarted?: (data: { auctionId: string }) => void;
  onAuctionStopped?: (data: { auctionId: string }) => void;
  onNewLiveBid?: (data: { auctionCarId: string; bid: any }) => void;
  onPreBidPlaced?: (data: { auctionCarId: string; bid: any }) => void;
  onHighestBidUpdated?: (data: { auctionCarId: string; highestBid: any }) => void;
  onBidError?: (error: string) => void;
  // ... more events
}
```

## 🚀 Usage Examples

### Basic Connection
```typescript
import { useSignalR } from '../hooks/useSignalR';

const MyComponent = () => {
  const { isConnected, connect, disconnect } = useSignalR({
    baseUrl: 'https://localhost:7249',
    token: localStorage.getItem('authToken'),
    autoConnect: true
  });

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
};
```

### Auction Participation
```typescript
const AuctionComponent = () => {
  const {
    isConnected,
    joinAuction,
    joinAuctionCar,
    placeLiveBid,
    placePreBid
  } = useSignalR({
    baseUrl: 'https://localhost:7249',
    token: localStorage.getItem('authToken'),
    autoConnect: true,
    events: {
      onNewLiveBid: (data) => {
        console.log('New bid received:', data);
        // Update UI with new bid
      },
      onConnectionStateChanged: (state, error) => {
        if (state === 'Failed') {
          // Show error message to user
        }
      }
    }
  });

  const handleJoinAuction = async (auctionId: string) => {
    await joinAuction(auctionId);
  };

  const handleJoinCar = async (carId: string) => {
    await joinAuctionCar(carId);
  };

  const handlePlaceBid = async (carId: string, amount: number) => {
    const success = await placeLiveBid(carId, amount);
    if (success) {
      console.log('Bid placed successfully');
    }
  };
};
```

### Connection Status Display
```typescript
import ConnectionStatus from '../components/ConnectionStatus';

const Layout = () => {
  return (
    <div>
      <header>
        <ConnectionStatus showDetails={false} />
      </header>
      <main>
        {/* Your app content */}
      </main>
    </div>
  );
};
```

## 🔄 Migration from Old System

### Before (Multiple Connections)
```typescript
// OLD - Each component created its own connection
const Component1 = () => {
  const realtime1 = useRealtime(config1, events1);
  // ...
};

const Component2 = () => {
  const bidHub = useBidHub(config2, events2);
  // ...
};

const Component3 = () => {
  const signalR = useSignalR(config3, events3);
  // ...
};
```

### After (Single Shared Connection)
```typescript
// NEW - All components use the same singleton connection
const Component1 = () => {
  const signalR = useSignalR(config, events1);
  // ...
};

const Component2 = () => {
  const signalR = useSignalR(config, events2);
  // ...
};

const Component3 = () => {
  const signalR = useSignalR(config, events3);
  // ...
};
```

## 🛡️ Error Handling

### Network Errors
- **Automatic Detection**: Connection timeouts, network failures
- **Exponential Backoff**: Increasing delays between retry attempts
- **Max Retry Limit**: Stops after 5 attempts to prevent infinite loops
- **Manual Reconnect**: User can retry after max attempts

### Authentication Errors
- **Token Validation**: Checks JWT token validity
- **Token Refresh**: Automatic token refresh when possible
- **Redirect to Login**: Redirects to login page on auth failure

### Server Errors
- **Error Categorization**: Distinguishes between different error types
- **User-Friendly Messages**: Shows appropriate messages to users
- **Retry Logic**: Different retry strategies for different error types

## 📊 Performance Benefits

### Before
- **Multiple Connections**: 3+ simultaneous connections per page
- **Connection Storms**: Server overwhelmed during page loads
- **Memory Leaks**: Poor cleanup caused memory issues
- **No State Management**: Components couldn't track connection status

### After
- **Single Connection**: One shared connection across entire app
- **Controlled Connections**: No connection storms
- **Proper Cleanup**: Memory leaks eliminated
- **State Awareness**: Components know connection status
- **Better UX**: Users see connection status and can retry

## 🔧 Advanced Features

### Group Management
```typescript
// Join auction group
await joinGroup('auction-123', 'auction');

// Join car group
await joinGroup('car-456', 'bid');

// Leave groups
await leaveGroup('auction-123', 'auction');
await leaveGroup('car-456', 'bid');
```

### Custom Hub Methods
```typescript
// Call any SignalR hub method
const result = await invoke('CustomMethod', param1, param2);
```

### Connection Monitoring
```typescript
const { connectionState, retryCount, lastError } = useSignalR(config);

// Monitor connection health
useEffect(() => {
  if (connectionState === 'Failed') {
    // Show error message
  }
}, [connectionState]);
```

## 🧪 Testing

### Connection Tests
```typescript
// Test connection establishment
const manager = SignalRManager.getInstance();
await manager.connect();

// Test group joining
await manager.joinGroup('test-auction', 'auction');

// Test method invocation
const result = await manager.invoke('TestMethod', 'param');
```

### Error Simulation
```typescript
// Simulate network failure
window.dispatchEvent(new Event('offline'));

// Simulate server error
// Server returns 500 error

// Test retry logic
// Connection should retry with exponential backoff
```

## 📝 Best Practices

1. **Always use the hook**: Don't access SignalRManager directly in components
2. **Handle connection states**: Check `isConnected` before making calls
3. **Provide user feedback**: Show connection status to users
4. **Clean up properly**: The hook handles cleanup automatically
5. **Use error boundaries**: Wrap components in error boundaries
6. **Monitor performance**: Check connection health regularly

## 🔮 Future Enhancements

- **Connection Pooling**: Multiple connections for high-load scenarios
- **Message Queuing**: Queue messages when disconnected
- **Compression**: Enable message compression for better performance
- **Metrics**: Add connection metrics and monitoring
- **Load Balancing**: Support for multiple SignalR servers
