import { apiClient } from '../lib/api';

export interface AuctionCarFullDetailsDto {
  id: string;
  auctionId: string;
  carId: string;
  lotNumber: string;
  currentPrice: number;
  minPreBid: number;
  isActive: boolean;
  bidCount?: number;
  lastBidTime?: string;
  isReserveMet?: boolean;
  reservePrice?: number;
  lotStatus?: string;
  
  // Car details
  car?: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    color?: string;
    odometer?: number;
    condition?: string;
    type?: string;
    damageType?: string;
    imageUrls?: string[];
    thumbnailUrl?: string;
  };
  
  // Auction details
  auction?: {
    id: string;
    name: string;
    startTimeUtc: string;
    endTimeUtc: string;
    status: string;
    isLive: boolean;
  };
}

// Cache for auction car details to avoid duplicate requests
const auctionCarCache = new Map<string, { data: AuctionCarFullDetailsDto; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const auctionCarApi = {
  // Get full details for auction car with caching
  getFullDetails: async (auctionCarId: string): Promise<AuctionCarFullDetailsDto> => {
    try {
      // Check cache first
      const cached = auctionCarCache.get(auctionCarId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`🎯 Using cached data for auction car ${auctionCarId}`);
        return cached.data;
      }

      console.log(`📡 Fetching full details for auction car ${auctionCarId}`);
      
      // Try the full-details endpoint first
      let response;
      try {
        response = await apiClient.getAuctionCarFullDetails(auctionCarId);
        console.log('📦 Raw API Response:', response);
      } catch (error) {
        console.warn(`⚠️ Full details endpoint failed for ${auctionCarId}, trying fallback`);
        
        // Fallback: get basic auction car details
        const auctionCarDetails = await apiClient.getAuctionCar(auctionCarId);
        
        // Get additional car details if carId is available
        let carDetails = null;
        if (auctionCarDetails.carId) {
          try {
            carDetails = await apiClient.getCar(auctionCarDetails.carId);
          } catch (carError) {
            console.warn(`⚠️ Could not fetch car details for ${auctionCarDetails.carId}`);
          }
        }
        
        // Get auction details if auctionId is available
        let auctionDetails = null;
        if (auctionCarDetails.auctionId) {
          try {
            auctionDetails = await apiClient.getAuction(auctionCarDetails.auctionId);
          } catch (auctionError) {
            console.warn(`⚠️ Could not fetch auction details for ${auctionCarDetails.auctionId}`);
          }
        }
        
        // Combine the data
        response = {
          ...auctionCarDetails,
          car: carDetails,
          auction: auctionDetails
        };
      }
      
      // Defensive mapping to handle different response structures
      const mappedData: AuctionCarFullDetailsDto = {
        id: response.id || auctionCarId,
        auctionId: response.auctionId || '',
        carId: response.carId || '',
        lotNumber: response.lotNumber || 'N/A',
        currentPrice: Number(response.currentPrice) || 0,
        minPreBid: Number(response.minPreBid) || 0,
        isActive: Boolean(response.isActive),
        bidCount: response.bidCount || 0,
        lastBidTime: response.lastBidTime || '',
        isReserveMet: Boolean(response.isReserveMet),
        reservePrice: Number(response.reservePrice) || 0,
        lotStatus: response.lotStatus || response.winnerStatus || 'Active',
        
        car: (response.car || response.carMake || response.carModel) ? {
          id: response.car?.id || response.carId || '',
          make: response.car?.make || response.carMake || 'Unknown',
          model: response.car?.model || response.carModel || 'Unknown',
          year: Number(response.car?.year || response.carYear) || 0,
          vin: response.car?.vin || response.carVin || '',
          color: response.car?.color || '',
          odometer: Number(response.car?.odometer || response.carOdometer || response.car?.mileage) || 0,
          condition: response.car?.condition || response.carCondition || '',
          type: response.car?.type || response.carType || '',
          damageType: response.car?.damageType || response.carDamageType || response.primaryDamage || '',
          imageUrls: response.car?.imageUrls || response.carImages || (response.carImage ? [response.carImage] : []),
          thumbnailUrl: response.car?.imageUrls?.[0] || response.carImages?.[0] || response.carImage || '/placeholder-car.jpg'
        } : undefined,
        
        auction: (response.auction || response.auctionName || response.auctionId) ? {
          id: response.auction?.id || response.auctionId || '',
          name: response.auction?.name || response.auctionName || 'Unknown Auction',
          startTimeUtc: response.auction?.startTimeUtc || response.auctionStartTime || '',
          endTimeUtc: response.auction?.endTimeUtc || response.auctionEndTime || '',
          status: response.auction?.status || 'Unknown',
          isLive: Boolean(response.auction?.isLive)
        } : undefined
      };
      
      // Cache the result
      auctionCarCache.set(auctionCarId, {
        data: mappedData,
        timestamp: Date.now()
      });
      
      console.log(`✅ Successfully fetched and cached auction car details for ${auctionCarId}`);
      console.log('🚗 Car Details:', mappedData.car);
      console.log('🏛️ Auction Details:', mappedData.auction);
      return mappedData;
      
    } catch (error) {
      console.error(`❌ Error fetching auction car details for ${auctionCarId}:`, error);
      
      // Handle 401 specifically
      if ((error as any)?.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      
      throw new Error(`Failed to fetch vehicle details for lot ${auctionCarId}`);
    }
  },

  // Batch fetch multiple auction car details with concurrency limit
  batchGetFullDetails: async (auctionCarIds: string[], concurrencyLimit = 5): Promise<Map<string, AuctionCarFullDetailsDto>> => {
    const results = new Map<string, AuctionCarFullDetailsDto>();
    const uniqueIds = [...new Set(auctionCarIds)];
    
    console.log(`📊 Batch fetching ${uniqueIds.length} auction car details with concurrency limit ${concurrencyLimit}`);
    
    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < uniqueIds.length; i += concurrencyLimit) {
      const batch = uniqueIds.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (auctionCarId) => {
        try {
          const details = await auctionCarApi.getFullDetails(auctionCarId);
          return { auctionCarId, details };
        } catch (error) {
          console.error(`❌ Failed to fetch details for ${auctionCarId}:`, error);
          return { auctionCarId, details: null };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ auctionCarId, details }) => {
        if (details) {
          results.set(auctionCarId, details);
        }
      });
    }
    
    console.log(`✅ Successfully fetched ${results.size}/${uniqueIds.length} auction car details`);
    return results;
  },

  // Clear cache (useful for refresh)
  clearCache: () => {
    auctionCarCache.clear();
    console.log('🗑️ Auction car cache cleared');
  },

  // Get cache stats
  getCacheStats: () => {
    return {
      size: auctionCarCache.size,
      entries: Array.from(auctionCarCache.keys())
    };
  }
};
