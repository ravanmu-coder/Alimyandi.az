import { apiClient } from '../lib/api';

export interface AuctionInfoDto {
  id: string;
  name: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: string;
  isLive: boolean;
  currentCarLotNumber?: string;
  totalCarsCount: number;
  soldCarsCount?: number;
  unsoldCarsCount?: number;
  totalRevenue?: number;
  locationId: string;
  locationName?: string;
}

export interface AuctionCurrentStateDto {
  auctionId: string;
  isLive: boolean;
  currentCarLotNumber?: string;
  timerSeconds: number;
  status: string;
  totalBids?: number;
  activeBidders?: number;
}

export const auctionApi = {
  // Get auction information
  getAuctionInfo: async (auctionId: string): Promise<AuctionInfoDto> => {
    try {
      console.log(`📡 Fetching auction info for ${auctionId}`);
      const response = await apiClient.getAuction(auctionId);
      
      // Defensive mapping
      const mappedAuction: AuctionInfoDto = {
        id: response.id || auctionId,
        name: response.name || 'Unknown Auction',
        startTimeUtc: response.startTimeUtc || '',
        endTimeUtc: response.endTimeUtc || '',
        status: response.status || 'Unknown',
        isLive: Boolean(response.isLive),
        currentCarLotNumber: response.currentCarLotNumber || '',
        totalCarsCount: Number(response.totalCarsCount) || 0,
        soldCarsCount: Number(response.soldCarsCount) || 0,
        unsoldCarsCount: Number(response.unsoldCarsCount) || 0,
        totalRevenue: Number((response as any).totalRevenue || (response as any).totalSalesAmount) || 0,
        locationId: response.locationId || '',
        locationName: response.locationName || ''
      };
      
      console.log(`✅ Successfully fetched auction info for ${auctionId}`);
      return mappedAuction;
    } catch (error) {
      console.error(`❌ Error fetching auction info for ${auctionId}:`, error);
      
      if ((error as any)?.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      
      throw new Error(`Failed to fetch auction information for ${auctionId}`);
    }
  },

  // Get current auction state
  getCurrentState: async (auctionId: string): Promise<AuctionCurrentStateDto> => {
    try {
      console.log(`📡 Fetching current state for auction ${auctionId}`);
      const response = await apiClient.getAuctionCurrentState(auctionId);
      
      const mappedState: AuctionCurrentStateDto = {
        auctionId: response.auctionId || auctionId,
        isLive: Boolean(response.isLive),
        currentCarLotNumber: response.currentCarLotNumber || '',
        timerSeconds: Number(response.timerSeconds) || 0,
        status: response.status || 'Unknown',
        totalBids: Number(response.totalBids) || 0,
        activeBidders: Number(response.activeBidders) || 0
      };
      
      console.log(`✅ Successfully fetched current state for auction ${auctionId}`);
      return mappedState;
    } catch (error) {
      console.error(`❌ Error fetching current state for auction ${auctionId}:`, error);
      
      if ((error as any)?.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      
      throw new Error(`Failed to fetch current auction state for ${auctionId}`);
    }
  },

  // Check if auction is currently running
  isAuctionRunning: (auction: AuctionInfoDto): boolean => {
    const now = new Date();
    const startTime = new Date(auction.startTimeUtc);
    const endTime = new Date(auction.endTimeUtc);
    
    return now >= startTime && now <= endTime && auction.isLive;
  },

  // Check if auction has ended
  isAuctionEnded: (auction: AuctionInfoDto): boolean => {
    const now = new Date();
    const endTime = new Date(auction.endTimeUtc);
    
    return now > endTime;
  },

  // Get auction status display text
  getAuctionStatusDisplay: (auction: AuctionInfoDto): string => {
    if (auctionApi.isAuctionRunning(auction)) {
      return 'Live';
    } else if (auctionApi.isAuctionEnded(auction)) {
      return 'Ended';
    } else {
      return 'Scheduled';
    }
  },

  // Format auction time for display
  formatAuctionTime: (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }
};
