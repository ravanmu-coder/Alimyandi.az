import * as signalR from '@microsoft/signalr';

// Connection states
export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting', 
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
  Failed = 'Failed'
}

// Error categories
export enum ErrorCategory {
  Network = 'Network',
  Authentication = 'Authentication', 
  Server = 'Server',
  Unknown = 'Unknown'
}

// Connection configuration
export interface SignalRConfig {
  baseUrl: string;
  token: string;
  hubUrl?: string; // Default: '/auctionHub'
  transport?: signalR.HttpTransportType;
  timeout?: number; // Default: 30000ms
  keepAliveInterval?: number; // Default: 15000ms
}

// Event handlers
export interface SignalREvents {
  onConnectionStateChanged?: (state: ConnectionState, error?: string) => void;
  onAuctionStarted?: (data: { auctionId: string }) => void;
  onAuctionStopped?: (data: { auctionId: string }) => void;
  onAuctionEnded?: (data: { auctionId: string; winner: any; finalPrice: number }) => void;
  onAuctionExtended?: (data: { auctionId: string; extensionMinutes: number }) => void;
  onCarMoved?: (data: { previousCarId: string; nextCarId: string; nextLot: string }) => void;
  onTimerTick?: (data: { auctionCarId: string; remainingSeconds: number }) => void;
  onAuctionTimerReset?: (data: { auctionCarId: string; newTimerSeconds: number }) => void;
  onPriceUpdated?: (data: { auctionCarId: string; newPrice: number; bidCount: number }) => void;
  onBidPlaced?: (data: { auctionCarId: string; bid: any }) => void;
  onNewLiveBid?: (data: { auctionCarId: string; bid: any }) => void;
  onPreBidPlaced?: (data: { auctionCarId: string; bid: any }) => void;
  onHighestBidUpdated?: (data: { auctionCarId: string; highestBid: any }) => void;
  onBidStatsUpdated?: (data: { auctionCarId: string; stats: any }) => void;
  onBidError?: (error: string) => void;
}

// Group subscription management
interface GroupSubscription {
  groupName: string;
  hubType: 'auction' | 'bid';
  subscribedAt: Date;
}

// Connection info
interface ConnectionInfo {
  state: ConnectionState;
  error?: string;
  errorCategory?: ErrorCategory;
  retryCount: number;
  lastConnectedAt?: Date;
  lastErrorAt?: Date;
  isOnline: boolean;
}

class SignalRManager {
  private static instances: Map<string, SignalRManager> = new Map();
  private instanceKey: string;
  private auctionConnection: signalR.HubConnection | null = null;
  private bidConnection: signalR.HubConnection | null = null;
  private config: SignalRConfig | null = null;
  private connectionInfo: ConnectionInfo;
  private eventHandlers: SignalREvents = {};
  private groupSubscriptions: Map<string, GroupSubscription> = new Map();
  private retryTimeout: NodeJS.Timeout | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private isDestroyed: boolean = false;

  // Exponential backoff configuration
  private readonly retryIntervals = [2000, 5000, 10000, 30000, 60000]; // milliseconds
  private readonly maxRetries = 5;
  private readonly connectionTimeout = 30000; // 30 seconds
  private readonly keepAliveIntervalMs = 15000; // 15 seconds

  private constructor(instanceKey: string) {
    this.instanceKey = instanceKey;
    this.connectionInfo = {
      state: ConnectionState.Disconnected,
      retryCount: 0,
      isOnline: navigator.onLine
    };

    console.log(`SignalR: Creating new instance for key: ${instanceKey}`);

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  public static getInstance(instanceKey: string = 'default'): SignalRManager {
    if (!SignalRManager.instances.has(instanceKey)) {
      SignalRManager.instances.set(instanceKey, new SignalRManager(instanceKey));
    }
    return SignalRManager.instances.get(instanceKey)!;
  }

  public static destroyInstance(instanceKey: string): void {
    const instance = SignalRManager.instances.get(instanceKey);
    if (instance) {
      instance.destroy();
      SignalRManager.instances.delete(instanceKey);
      console.log(`SignalR: Destroyed instance for key: ${instanceKey}`);
    }
  }

  public static getAllInstances(): Map<string, SignalRManager> {
    return new Map(SignalRManager.instances);
  }

  // Configuration and initialization
  public configure(config: SignalRConfig): void {
    this.config = {
      ...config,
      hubUrl: config.hubUrl || '/auctionHub',
      transport: config.transport || signalR.HttpTransportType.WebSockets,
      timeout: config.timeout || this.connectionTimeout,
      keepAliveInterval: config.keepAliveInterval || this.keepAliveIntervalMs
    };
  }

  public setEventHandlers(events: SignalREvents): void {
    this.eventHandlers = { ...this.eventHandlers, ...events };
  }

  // Connection management
  public async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('SignalRManager must be configured before connecting');
    }

    if (this.isConnecting || this.connectionInfo.state === ConnectionState.Connected) {
      console.log('SignalR: Connection already in progress or connected');
      return;
    }

    if (this.connectionInfo.state === ConnectionState.Connecting) {
      console.log('SignalR: Already connecting, skipping');
      return;
    }

    if (!this.connectionInfo.isOnline) {
      this.updateConnectionState(ConnectionState.Failed, 'Device is offline');
      return;
    }

    this.isConnecting = true;
    this.updateConnectionState(ConnectionState.Connecting);

    try {
      console.log(`SignalR: Starting connection for instance ${this.instanceKey}...`);
      console.log(`SignalR: Token: ${this.config.token.substring(0, 20)}...`);
      console.log(`SignalR: Base URL: ${this.config.baseUrl}`);
      
      // Disconnect existing connections first
      await this.disconnect();

      // Create connections
      await this.createConnections();
      
      // Start connections
      await this.startConnections();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Start keep-alive
      this.startKeepAlive();
      
      this.updateConnectionState(ConnectionState.Connected);
      this.connectionInfo.retryCount = 0; // Reset retry count on success
      this.connectionInfo.lastConnectedAt = new Date();
      
      console.log('SignalR: Connected successfully');
      
    } catch (error) {
      console.error('SignalR: Connection failed:', error);
      await this.handleConnectionError(error);
    } finally {
      this.isConnecting = false;
    }
  }

  public destroy(): void {
    console.log(`SignalR: Destroying instance ${this.instanceKey}...`);
    this.isDestroyed = true;
    
    // Disconnect and cleanup
    this.disconnect().catch(err => {
      console.error('Error during destroy disconnect:', err);
    });

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Clear all subscriptions
    this.groupSubscriptions.clear();
    this.eventHandlers = {};
  }

  public async disconnect(): Promise<void> {
    console.log(`SignalR: Disconnecting instance ${this.instanceKey}...`);
    
    // Clear retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // Clear keep-alive interval
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    // Stop connections
    const stopPromises: Promise<void>[] = [];
    
    if (this.auctionConnection) {
      stopPromises.push(
        this.auctionConnection.stop().catch(err => 
          console.error('Error stopping auction connection:', err)
        )
      );
      this.auctionConnection = null;
    }

    if (this.bidConnection) {
      stopPromises.push(
        this.bidConnection.stop().catch(err => 
          console.error('Error stopping bid connection:', err)
        )
      );
      this.bidConnection = null;
    }

    await Promise.all(stopPromises);
    
    this.updateConnectionState(ConnectionState.Disconnected);
    this.groupSubscriptions.clear();
    
    console.log('SignalR: Disconnected');
  }

  // Group management
  public async joinGroup(groupName: string, hubType: 'auction' | 'bid' = 'auction'): Promise<void> {
    // Wait for connection to be established before joining group
    const isConnected = await this.waitForConnection(5000);
    if (!isConnected) {
      console.warn(`SignalR: Cannot join group ${groupName}, connection failed`);
      throw new Error('SignalR connection not available');
    }

    const connection = hubType === 'auction' ? this.auctionConnection : this.bidConnection;
    
    if (!connection || this.connectionInfo.state !== ConnectionState.Connected) {
      console.warn(`SignalR: Cannot join group ${groupName}, not connected`);
      throw new Error('SignalR connection not available');
    }

    try {
      const methodName = hubType === 'auction' ? 'JoinAuction' : 'JoinAuctionCar';
      await connection.invoke(methodName, groupName);
      
      this.groupSubscriptions.set(groupName, {
        groupName,
        hubType,
        subscribedAt: new Date()
      });
      
      console.log(`SignalR: Joined ${hubType} group:`, groupName);
    } catch (error) {
      console.error(`SignalR: Failed to join ${hubType} group ${groupName}:`, error);
      throw error;
    }
  }

  public async leaveGroup(groupName: string, hubType: 'auction' | 'bid' = 'auction'): Promise<void> {
    const connection = hubType === 'auction' ? this.auctionConnection : this.bidConnection;
    
    if (!connection || this.connectionInfo.state !== ConnectionState.Connected) {
      console.warn(`SignalR: Cannot leave group ${groupName}, not connected`);
      return;
    }

    try {
      const methodName = hubType === 'auction' ? 'LeaveAuction' : 'LeaveAuctionCar';
      await connection.invoke(methodName, groupName);
      
      this.groupSubscriptions.delete(groupName);
      console.log(`SignalR: Left ${hubType} group:`, groupName);
    } catch (error) {
      console.error(`SignalR: Failed to leave ${hubType} group ${groupName}:`, error);
    }
  }

  // Hub method calls
  public async invoke(methodName: string, ...args: any[]): Promise<any> {
    if (this.connectionInfo.state !== ConnectionState.Connected) {
      throw new Error('SignalR: Not connected');
    }

    // Determine which connection to use based on method name
    const connection = this.getConnectionForMethod(methodName);
    if (!connection) {
      throw new Error(`SignalR: Unknown method ${methodName}`);
    }

    try {
      return await connection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`SignalR: Method ${methodName} failed:`, error);
      throw error;
    }
  }

  // Manual reconnection
  public async reconnect(): Promise<void> {
    console.log('SignalR: Manual reconnection requested');
    this.connectionInfo.retryCount = 0; // Reset retry count for manual reconnect
    await this.connect();
  }

  // Wait for connection to be established
  public async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.connectionInfo.state === ConnectionState.Connected) {
        resolve(true);
        return;
      }

      if (this.connectionInfo.state === ConnectionState.Failed) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        console.warn('SignalR: waitForConnection timeout');
        resolve(false);
      }, timeoutMs);

      const checkConnection = () => {
        if (this.connectionInfo.state === ConnectionState.Connected) {
          clearTimeout(timeout);
          resolve(true);
        } else if (this.connectionInfo.state === ConnectionState.Failed) {
          clearTimeout(timeout);
          resolve(false);
        } else {
          // Still connecting or reconnecting, check again
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  // Wait for specific connection state
  public async waitForState(targetState: ConnectionState, timeoutMs: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.connectionInfo.state === targetState) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        console.warn(`SignalR: waitForState timeout waiting for ${targetState}`);
        resolve(false);
      }, timeoutMs);

      const checkState = () => {
        if (this.connectionInfo.state === targetState) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          setTimeout(checkState, 100);
        }
      };

      checkState();
    });
  }

  // Public getters
  public getConnectionState(): ConnectionState {
    return this.connectionInfo.state;
  }

  public getConnectionInfo(): ConnectionInfo {
    return { ...this.connectionInfo };
  }

  public isConnected(): boolean {
    return this.connectionInfo.state === ConnectionState.Connected;
  }

  public getLastError(): string | undefined {
    return this.connectionInfo.error;
  }

  public getRetryCount(): number {
    return this.connectionInfo.retryCount;
  }

  // Cleanup
  public destroy(): void {
    console.log('SignalR: Destroying manager...');
    this.isDestroyed = true;
    this.disconnect();
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    SignalRManager.instance = null as any;
  }

  // Private methods
  private async createConnections(): Promise<void> {
    if (!this.config) return;

    console.log(`SignalR: Creating connections for instance ${this.instanceKey}`);

    const connectionOptions = {
      accessTokenFactory: () => {
        if (!this.config?.token) {
          throw new Error('No authentication token available');
        }
        console.log(`SignalR: Providing token for ${this.instanceKey}: ${this.config.token.substring(0, 20)}...`);
        return this.config.token;
      },
      transport: this.config.transport,
      skipNegotiation: true,
      withCredentials: false
    };

    const auctionHubUrl = `${this.config.baseUrl}/auctionHub`;
    const bidHubUrl = `${this.config.baseUrl}/bidHub`;

    console.log(`SignalR: Creating AuctionHub connection to: ${auctionHubUrl}`);
    console.log(`SignalR: Creating BidHub connection to: ${bidHubUrl}`);

    // Create auction hub connection with automatic reconnect
    this.auctionConnection = new signalR.HubConnectionBuilder()
      .withUrl(auctionHubUrl, connectionOptions)
      .withAutomaticReconnect([0, 2000, 10000, 30000]) // Retry after 0s, 2s, 10s, 30s
      .configureLogging(signalR.LogLevel.Information) // More verbose logging
      .build();

    // Create bid hub connection with automatic reconnect
    this.bidConnection = new signalR.HubConnectionBuilder()
      .withUrl(bidHubUrl, connectionOptions)
      .withAutomaticReconnect([0, 2000, 10000, 30000]) // Retry after 0s, 2s, 10s, 30s
      .configureLogging(signalR.LogLevel.Information) // More verbose logging
      .build();

    // Add connection event handlers for debugging
    this.auctionConnection.onclose((error) => {
      console.warn(`SignalR: AuctionHub connection closed for ${this.instanceKey}:`, error);
    });

    this.bidConnection.onclose((error) => {
      console.warn(`SignalR: BidHub connection closed for ${this.instanceKey}:`, error);
    });

    this.auctionConnection.onreconnecting((error) => {
      console.log(`🔄 SignalR: AuctionHub reconnecting for ${this.instanceKey}:`, error);
      this.updateConnectionState(ConnectionState.Reconnecting, error?.toString());
    });

    this.bidConnection.onreconnecting((error) => {
      console.log(`🔄 SignalR: BidHub reconnecting for ${this.instanceKey}:`, error);
    });

    this.auctionConnection.onreconnected((connectionId) => {
      console.log(`✅ SignalR: AuctionHub reconnected for ${this.instanceKey}:`, connectionId);
      this.updateConnectionState(ConnectionState.Connected);
      
      // Re-subscribe to groups after reconnection
      this.resubscribeToGroups();
    });

    this.bidConnection.onreconnected((connectionId) => {
      console.log(`✅ SignalR: BidHub reconnected for ${this.instanceKey}:`, connectionId);
      
      // Re-subscribe to groups after reconnection
      this.resubscribeToGroups();
    });
  }

  // Re-subscribe to all groups after reconnection
  private async resubscribeToGroups(): Promise<void> {
    console.log(`🔄 Re-subscribing to groups for ${this.instanceKey}:`, Object.keys(this.groupSubscriptions));
    
    for (const [groupName, subscription] of Object.entries(this.groupSubscriptions)) {
      try {
        if (subscription.type === 'auction') {
          await this.joinAuction(groupName);
          console.log(`✅ Re-joined auction group: ${groupName}`);
        } else if (subscription.type === 'auctionCar') {
          await this.joinAuctionCar(groupName);
          console.log(`✅ Re-joined auction car group: ${groupName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to re-join group ${groupName}:`, error);
      }
    }
  }

  private async startConnections(): Promise<void> {
    if (!this.auctionConnection || !this.bidConnection) {
      throw new Error('Connections not created');
    }

    console.log(`SignalR: Starting connections for instance ${this.instanceKey}...`);

    // Start both connections with timeout
    const startPromises = [
      Promise.race([
        this.auctionConnection.start().then(() => {
          console.log(`SignalR: AuctionHub started successfully for ${this.instanceKey}`);
          console.log(`SignalR: AuctionHub connectionId: ${this.auctionConnection?.connectionId}`);
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AuctionHub connection timeout')), this.connectionTimeout)
        )
      ]),
      Promise.race([
        this.bidConnection.start().then(() => {
          console.log(`SignalR: BidHub started successfully for ${this.instanceKey}`);
          console.log(`SignalR: BidHub connectionId: ${this.bidConnection?.connectionId}`);
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('BidHub connection timeout')), this.connectionTimeout)
        )
      ])
    ];

    await Promise.all(startPromises);
    console.log(`SignalR: All connections started for instance ${this.instanceKey}`);
    console.log('SignalR: Both connections started successfully');
  }

  private setupEventHandlers(): void {
    if (!this.auctionConnection || !this.bidConnection) return;

    // Auction hub events
    this.auctionConnection.on('AuctionStarted', (data) => this.eventHandlers.onAuctionStarted?.(data));
    this.auctionConnection.on('AuctionStopped', (data) => this.eventHandlers.onAuctionStopped?.(data));
    this.auctionConnection.on('AuctionEnded', (data) => this.eventHandlers.onAuctionEnded?.(data));
    this.auctionConnection.on('AuctionExtended', (data) => this.eventHandlers.onAuctionExtended?.(data));
    this.auctionConnection.on('CarMoved', (data) => this.eventHandlers.onCarMoved?.(data));
    this.auctionConnection.on('TimerTick', (data) => this.eventHandlers.onTimerTick?.(data));
    this.auctionConnection.on('AuctionTimerReset', (data) => this.eventHandlers.onAuctionTimerReset?.(data));

    // Bid hub events
    this.bidConnection.on('BidPlaced', (data) => this.eventHandlers.onBidPlaced?.(data));
    this.bidConnection.on('PriceUpdated', (data) => this.eventHandlers.onPriceUpdated?.(data));
    this.bidConnection.on('NewLiveBid', (data) => this.eventHandlers.onNewLiveBid?.(data));
    this.bidConnection.on('PreBidPlaced', (data) => this.eventHandlers.onPreBidPlaced?.(data));
    this.bidConnection.on('HighestBidUpdated', (data) => this.eventHandlers.onHighestBidUpdated?.(data));
    this.bidConnection.on('BidStatsUpdated', (data) => this.eventHandlers.onBidStatsUpdated?.(data));
    this.bidConnection.on('BidError', (error) => this.eventHandlers.onBidError?.(error));

    // Connection state events
    this.auctionConnection.onclose((error) => this.handleConnectionClose('auction', error));
    this.bidConnection.onclose((error) => this.handleConnectionClose('bid', error));
  }

  private async handleConnectionError(error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
    const errorCategory = this.categorizeError(error);
    
    this.connectionInfo.lastErrorAt = new Date();
    this.connectionInfo.error = errorMessage;
    this.connectionInfo.errorCategory = errorCategory;

    // Check if we should retry
    if (this.connectionInfo.retryCount < this.maxRetries && this.connectionInfo.isOnline) {
      this.connectionInfo.retryCount++;
      const retryDelay = this.retryIntervals[Math.min(this.connectionInfo.retryCount - 1, this.retryIntervals.length - 1)];
      
      console.log(`SignalR: Retrying connection in ${retryDelay}ms (attempt ${this.connectionInfo.retryCount}/${this.maxRetries})`);
      
      this.updateConnectionState(ConnectionState.Reconnecting, `Retrying in ${retryDelay}ms...`);
      
      this.retryTimeout = setTimeout(() => {
        this.connect();
      }, retryDelay);
    } else {
      this.updateConnectionState(ConnectionState.Failed, errorMessage);
    }
  }

  private handleConnectionClose(hubType: 'auction' | 'bid', error?: Error): void {
    console.log(`SignalR: ${hubType} connection closed:`, error);
    
    if (error && this.connectionInfo.state === ConnectionState.Connected) {
      this.handleConnectionError(error);
    }
  }

  private categorizeError(error: any): ErrorCategory {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('offline') || message.includes('timeout')) {
      return ErrorCategory.Network;
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('token')) {
      return ErrorCategory.Authentication;
    }
    
    if (message.includes('500') || message.includes('503') || message.includes('server')) {
      return ErrorCategory.Server;
    }
    
    return ErrorCategory.Unknown;
  }

  private updateConnectionState(state: ConnectionState, error?: string): void {
    this.connectionInfo.state = state;
    if (error) {
      this.connectionInfo.error = error;
    }
    
    this.eventHandlers.onConnectionStateChanged?.(state, error);
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(() => {
      if (this.connectionInfo.state === ConnectionState.Connected) {
        // Send ping to keep connection alive
        this.auctionConnection?.invoke('Ping').catch(err => 
          console.warn('SignalR: Keep-alive ping failed:', err)
        );
      }
    }, this.config?.keepAliveInterval || this.keepAliveIntervalMs);
  }

  private getConnectionForMethod(methodName: string): signalR.HubConnection | null {
    // Map methods to their respective connections
    const auctionMethods = ['JoinAuction', 'LeaveAuction', 'Ping'];
    const bidMethods = ['JoinAuctionCar', 'LeaveAuctionCar', 'PlaceLiveBid', 'PlacePreBid', 'PlaceProxyBid', 'CancelProxyBid'];
    
    if (auctionMethods.includes(methodName)) {
      return this.auctionConnection;
    }
    
    if (bidMethods.includes(methodName)) {
      return this.bidConnection;
    }
    
    // Default to auction connection for unknown methods
    return this.auctionConnection;
  }

  private handleOnline(): void {
    console.log('SignalR: Device came online');
    this.connectionInfo.isOnline = true;
    
    if (this.connectionInfo.state === ConnectionState.Failed) {
      this.reconnect();
    }
  }

  private handleOffline(): void {
    console.log('SignalR: Device went offline');
    this.connectionInfo.isOnline = false;
    this.updateConnectionState(ConnectionState.Failed, 'Device is offline');
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      console.log('SignalR: Page hidden, pausing keep-alive');
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }
    } else {
      console.log('SignalR: Page visible, resuming keep-alive');
      if (this.connectionInfo.state === ConnectionState.Connected) {
        this.startKeepAlive();
      }
    }
  }
}

export default SignalRManager;
