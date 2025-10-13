import { apiClient } from '../lib/api';
import { AuctionGetDto, AuctionCarDetailDto, CarDto, AuctionCarGetDto } from '../types/api';

export interface AuctionPageData {
  auction: AuctionGetDto;
  currentState: {
    auctionId: string;
    isLive: boolean;
    currentCarLotNumber?: string;
    timerSeconds: number;
    status: string;
    totalBids?: number;
    activeBidders?: number;
  };
  currentCar: AuctionCarDetailDto | null;
  carDetails: CarDto | null;
  highestBid: {
    amount: number;
    bidderName?: string;
    placedAtUtc?: string;
  } | null;
  bidHistory: any[];
  lotQueue: AuctionCarGetDto[];
}

class AuctionDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Unified data loading function that fetches all initial auction page data
   * This is the "brain" of the auction page initialization
   * Uses sequential API calls with delays to prevent throttling
   */
  async initializeAuctionPage(auctionId: string): Promise<AuctionPageData> {
    console.log('🚀 Initializing auction page data for:', auctionId);

    try {
      // Step 1: Sequential API calls for basic auction data with delays
      console.log('📡 Step 1: Fetching basic auction data sequentially...');
      
      const auctionResponse = await this.getAuctionInfoWithRetry(auctionId);
      await this.delay(300);
      
      const currentStateResponse = await this.getAuctionCurrentStateWithRetry(auctionId);
      await this.delay(300);
      
      const lotQueueResponse = await this.getLotQueueWithRetry(auctionId);

      console.log('✅ Basic auction data loaded:', {
        auction: auctionResponse.name,
        isLive: currentStateResponse.isLive,
        currentLot: currentStateResponse.currentCarLotNumber,
        queueLength: lotQueueResponse.length
      });

      // Step 2: Chain requests based on current car lot number
      let currentCar: AuctionCarDetailDto | null = null;
      let carDetails: CarDto | null = null;
      let highestBid: any = null;
      let bidHistory: any[] = [];

      if (currentStateResponse.currentCarLotNumber) {
        console.log('📡 Step 2: Fetching current car data for lot:', currentStateResponse.currentCarLotNumber);
        
        const carResponse = await this.getAuctionCarByLotWithRetry(currentStateResponse.currentCarLotNumber);
        await this.delay(300);

        currentCar = carResponse;
        if (currentCar) {
          // Sequential calls for car details to prevent throttling
          carDetails = await this.getCarDetailsWithRetry(currentCar.carId);
          await this.delay(300);
          
          highestBid = await this.getHighestBidWithRetry(currentCar.id);
          await this.delay(300);
          
          bidHistory = await this.getBidHistoryWithRetry(currentCar.id);
        }
      }

      const result: AuctionPageData = {
        auction: auctionResponse,
        currentState: currentStateResponse,
        currentCar,
        carDetails,
        highestBid,
        bidHistory,
        lotQueue: lotQueueResponse
      };

      console.log('🎉 Auction page data initialization complete:', {
        auctionName: result.auction.name,
        isLive: result.currentState.isLive,
        hasCurrentCar: !!result.currentCar,
        queueLength: result.lotQueue.length,
        bidHistoryLength: result.bidHistory.length
      });

      return result;

    } catch (error) {
      console.error('❌ Failed to initialize auction page data:', error);
      throw new Error(`Failed to load auction data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add delay between API calls to prevent throttling
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Using cached data for ${key}`);
      return cached.data;
    }
    return null;
  }

  /**
   * Cache data with timestamp
   */
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Get auction information with retry and caching
   */
  private async getAuctionInfoWithRetry(auctionId: string): Promise<AuctionGetDto> {
    const cacheKey = `auction-${auctionId}`;
    const cached = this.getCachedData<AuctionGetDto>(cacheKey);
    if (cached) return cached;

    return this.retryWithBackoff(async () => {
      console.log(`📡 Fetching auction info for ${auctionId}`);
      const response = await apiClient.getAuction(auctionId);
      console.log(`✅ Auction info loaded: ${response.name}`);
      this.setCachedData(cacheKey, response);
      return response;
    });
  }

  /**
   * Get auction information (legacy method for compatibility)
   */
  private async getAuctionInfo(auctionId: string): Promise<AuctionGetDto> {
    return this.getAuctionInfoWithRetry(auctionId);
  }

  /**
   * Get current auction state with retry and caching
   */
  private async getAuctionCurrentStateWithRetry(auctionId: string): Promise<any> {
    const cacheKey = `auction-state-${auctionId}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    return this.retryWithBackoff(async () => {
      console.log(`📡 Fetching current state for auction ${auctionId}`);
      const response = await apiClient.getAuctionCurrentState(auctionId);
      console.log(`✅ Current state loaded:`, response);
      this.setCachedData(cacheKey, response);
      return response;
    });
  }

  /**
   * Get current auction state (legacy method for compatibility)
   */
  private async getAuctionCurrentState(auctionId: string): Promise<any> {
    return this.getAuctionCurrentStateWithRetry(auctionId);
  }

  /**
   * Get lot queue with retry and caching
   */
  private async getLotQueueWithRetry(auctionId: string): Promise<AuctionCarGetDto[]> {
    const cacheKey = `lot-queue-${auctionId}`;
    const cached = this.getCachedData<AuctionCarGetDto[]>(cacheKey);
    if (cached) return cached;

    try {
      return await this.retryWithBackoff(async () => {
        console.log(`📡 Fetching lot queue for auction ${auctionId}`);
        const response = await apiClient.getAuctionCars(auctionId);
        console.log(`✅ Lot queue loaded: ${response.length} cars`);
        this.setCachedData(cacheKey, response);
        return response;
      });
    } catch (error) {
      console.error(`❌ Error fetching lot queue for auction ${auctionId}:`, error);
      return []; // Return empty array instead of throwing to allow page to load
    }
  }

  /**
   * Get lot queue (legacy method for compatibility)
   */
  private async getLotQueue(auctionId: string): Promise<AuctionCarGetDto[]> {
    return this.getLotQueueWithRetry(auctionId);
  }

  /**
   * Get auction car by lot number with retry
   */
  private async getAuctionCarByLotWithRetry(lotNumber: string): Promise<AuctionCarDetailDto | null> {
    const cacheKey = `auction-car-lot-${lotNumber}`;
    const cached = this.getCachedData<AuctionCarDetailDto>(cacheKey);
    if (cached) return cached;

    try {
      return await this.retryWithBackoff(async () => {
        console.log(`📡 Fetching auction car for lot ${lotNumber}`);
        const response = await apiClient.getAuctionCarByLot(lotNumber);
        console.log(`✅ Auction car loaded for lot ${lotNumber}`);
        this.setCachedData(cacheKey, response);
        return response;
      });
    } catch (error) {
      console.error(`❌ Error fetching auction car for lot ${lotNumber}:`, error);
      return null;
    }
  }

  /**
   * Get auction car by lot number (legacy method for compatibility)
   */
  private async getAuctionCarByLot(lotNumber: string): Promise<AuctionCarDetailDto | null> {
    return this.getAuctionCarByLotWithRetry(lotNumber);
  }

  /**
   * Get car details with retry and caching
   */
  private async getCarDetailsWithRetry(carId: string): Promise<CarDto | null> {
    const cacheKey = `car-details-${carId}`;
    const cached = this.getCachedData<CarDto>(cacheKey);
    if (cached) return cached;

    try {
      return await this.retryWithBackoff(async () => {
        console.log(`📡 Fetching car details for ${carId}`);
        const response = await apiClient.getCar(carId);
        console.log(`✅ Car details loaded for ${carId}`);
        this.setCachedData(cacheKey, response);
        return response;
      });
    } catch (error) {
      console.error(`❌ Error fetching car details for ${carId}:`, error);
      return null;
    }
  }

  /**
   * Get car details (legacy method for compatibility)
   */
  private async getCarDetails(carId: string): Promise<CarDto | null> {
    return this.getCarDetailsWithRetry(carId);
  }

  /**
   * Public method for getting car details
   */
  async getCarDetails(carId: string): Promise<CarDto | null> {
    return this.getCarDetailsWithRetry(carId);
  }

  /**
   * Get highest bid for auction car with retry and caching
   */
  private async getHighestBidWithRetry(auctionCarId: string): Promise<any> {
    const cacheKey = `highest-bid-${auctionCarId}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      return await this.retryWithBackoff(async () => {
        console.log(`📡 Fetching highest bid for auction car ${auctionCarId}`);
        const response = await apiClient.getHighestBid(auctionCarId);
        console.log(`✅ Highest bid loaded: $${response?.amount || 0}`);
        this.setCachedData(cacheKey, response);
        return response;
      });
    } catch (error) {
      console.error(`❌ Error fetching highest bid for auction car ${auctionCarId}:`, error);
      return null;
    }
  }

  /**
   * Get highest bid for auction car (legacy method for compatibility)
   */
  private async getHighestBid(auctionCarId: string): Promise<any> {
    return this.getHighestBidWithRetry(auctionCarId);
  }

  /**
   * Public method for getting highest bid
   */
  async getHighestBid(auctionCarId: string): Promise<any> {
    return this.getHighestBidWithRetry(auctionCarId);
  }

  /**
   * Get bid history for auction car with retry and caching
   */
  private async getBidHistoryWithRetry(auctionCarId: string): Promise<any[]> {
    const cacheKey = `bid-history-${auctionCarId}`;
    const cached = this.getCachedData<any[]>(cacheKey);
    if (cached) return cached;

    try {
      return await this.retryWithBackoff(async () => {
        console.log(`📡 Fetching bid history for auction car ${auctionCarId}`);
        const response = await apiClient.getBidHistory(auctionCarId);
        console.log(`✅ Bid history loaded: ${response.length} bids`);
        this.setCachedData(cacheKey, response);
        return response;
      });
    } catch (error) {
      console.error(`❌ Error fetching bid history for auction car ${auctionCarId}:`, error);
      return [];
    }
  }

  /**
   * Get bid history for auction car (legacy method for compatibility)
   */
  private async getBidHistory(auctionCarId: string): Promise<any[]> {
    return this.getBidHistoryWithRetry(auctionCarId);
  }

  /**
   * Public method for getting bid history
   */
  async getBidHistory(auctionCarId: string): Promise<any[]> {
    return this.getBidHistoryWithRetry(auctionCarId);
  }

  /**
   * Get minimum bid amount for auction car with retry and caching
   */
  async getMinimumBid(auctionCarId: string): Promise<number> {
    const cacheKey = `minimum-bid-${auctionCarId}`;
    const cached = this.getCachedData<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      return await this.retryWithBackoff(async () => {
        console.log(`📡 Fetching minimum bid for auction car ${auctionCarId}`);
        const response = await apiClient.getMinimumBid(auctionCarId);
        console.log(`✅ Minimum bid loaded: $${response}`);
        const result = response || 0;
        this.setCachedData(cacheKey, result);
        return result;
      });
    } catch (error) {
      console.error(`❌ Error fetching minimum bid for auction car ${auctionCarId}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache for specific keys or all cache
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      // Invalidate specific pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          console.log(`🗑️ Invalidated cache for ${key}`);
        }
      }
    } else {
      // Invalidate all cache
      this.cache.clear();
      console.log('🗑️ Invalidated all cache');
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
        console.log(`🗑️ Cleared expired cache for ${key}`);
      }
    }
  }

  /**
   * Refresh current car data when switching cars
   * Uses sequential calls to prevent throttling
   */
  async refreshCurrentCarData(lotNumber: string): Promise<{
    currentCar: AuctionCarDetailDto | null;
    carDetails: CarDto | null;
    highestBid: any;
    bidHistory: any[];
  }> {
    console.log('🔄 Refreshing current car data for lot:', lotNumber);

    try {
      // Invalidate cache for this lot to ensure fresh data
      this.invalidateCache(lotNumber);
      
      const currentCar = await this.getAuctionCarByLotWithRetry(lotNumber);
      await this.delay(300);

      if (currentCar) {
        // Sequential calls to prevent throttling
        const carDetails = await this.getCarDetailsWithRetry(currentCar.carId);
        await this.delay(300);
        
        const highestBid = await this.getHighestBidWithRetry(currentCar.id);
        await this.delay(300);
        
        const bidHistory = await this.getBidHistoryWithRetry(currentCar.id);

        return {
          currentCar,
          carDetails,
          highestBid,
          bidHistory
        };
      }

      return {
        currentCar: null,
        carDetails: null,
        highestBid: null,
        bidHistory: []
      };

    } catch (error) {
      console.error('❌ Failed to refresh current car data:', error);
      throw error;
    }
  }
}

export const auctionDataService = new AuctionDataService();
