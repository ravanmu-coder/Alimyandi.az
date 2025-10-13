import { apiClient } from '../lib/api';

export interface BidDto {
  id: string;
  auctionCarId: string;
  auctionId?: string;
  carId?: string;
  userId: string;
  userName?: string;
  amount: number;
  placedAtUtc: string;
  isHighestBid: boolean;
  hasBeenOutbid?: boolean;
  status: string; // "Active", "Won", "Outbid", etc.
  bidType?: string;
  timestamp?: string;
  isWinning?: boolean;
  isOutbid?: boolean;
}

export interface BidSummaryDto {
  auctionId: string;
  totalBids: number;
  highestBid: number;
  userBids: BidDto[];
}

export const bidApi = {
  // Get all user bids with defensive response handling
  getMyBids: async (): Promise<BidDto[]> => {
    try {
      console.log('📡 Fetching user bids from /api/bid/my-bids');
      const response = await apiClient.getMyBids();
      
      // Defensive response shape detection
      let bidsArray: any[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        bidsArray = response;
        console.log(`✅ Direct array response with ${bidsArray.length} items`);
      } else if (response && typeof response === 'object') {
        // Try common response wrapper patterns
        if (Array.isArray(response.data)) {
          bidsArray = response.data;
          console.log(`✅ Found array in response.data with ${bidsArray.length} items`);
        } else if (Array.isArray(response.result)) {
          bidsArray = response.result;
          console.log(`✅ Found array in response.result with ${bidsArray.length} items`);
        } else if (Array.isArray(response.value)) {
          bidsArray = response.value;
          console.log(`✅ Found array in response.value with ${bidsArray.length} items`);
        } else if (Array.isArray(response.items)) {
          bidsArray = response.items;
          console.log(`✅ Found array in response.items with ${bidsArray.length} items`);
        } else if (Array.isArray(response.bids)) {
          bidsArray = response.bids;
          console.log(`✅ Found array in response.bids with ${bidsArray.length} items`);
        } else {
          console.warn('⚠️ Unexpected my-bids response shape:', {
            type: typeof response,
            keys: Object.keys(response),
            sample: JSON.stringify(response).substring(0, 200) + '...'
          });
          console.log('🔄 Falling back to empty array');
          bidsArray = [];
        }
      } else {
        console.warn('⚠️ Unexpected my-bids response shape - not an object or array:', {
          type: typeof response,
          value: response
        });
        console.log('🔄 Falling back to empty array');
        bidsArray = [];
      }
      
      // Defensive mapping to handle different DTO structures
      const mappedBids: BidDto[] = bidsArray.map((bid: any, index: number) => {
        try {
          return {
            id: bid.id || `temp-${index}`,
            auctionCarId: bid.auctionCarId || '',
            auctionId: bid.auctionId || '',
            carId: bid.carId || '',
            userId: bid.userId || '',
            userName: bid.userName || (bid.user ? `${bid.user.firstName || ''} ${bid.user.lastName || ''}`.trim() : ''),
            amount: Number(bid.amount) || 0,
            placedAtUtc: bid.placedAtUtc || bid.timestamp || new Date().toISOString(),
            isHighestBid: Boolean(bid.isHighestBid || bid.isWinning),
            hasBeenOutbid: Boolean(bid.hasBeenOutbid || bid.isOutbid),
            status: bid.status || (bid.isWinning ? 'Winning' : bid.isOutbid ? 'Outbid' : 'Active'),
            bidType: bid.bidType || 'Live',
            timestamp: bid.timestamp || bid.placedAtUtc || new Date().toISOString(),
            isWinning: Boolean(bid.isWinning),
            isOutbid: Boolean(bid.isOutbid)
          };
        } catch (mappingError) {
          console.error(`❌ Error mapping bid at index ${index}:`, mappingError, bid);
          // Return a safe fallback bid object
          return {
            id: `error-${index}`,
            auctionCarId: '',
            auctionId: '',
            carId: '',
            userId: '',
            userName: '',
            amount: 0,
            placedAtUtc: new Date().toISOString(),
            isHighestBid: false,
            hasBeenOutbid: false,
            status: 'Error',
            bidType: 'Unknown',
            timestamp: new Date().toISOString(),
            isWinning: false,
            isOutbid: false
          };
        }
      });
      
      console.log(`✅ Successfully mapped ${mappedBids.length} bids`);
      return mappedBids;
    } catch (error) {
      console.error('❌ Error fetching user bids:', error);
      
      // Handle 401 specifically
      if ((error as any)?.response?.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      
      throw new Error('Failed to fetch your bids. Please try again.');
    }
  },

  // Get bid summary for specific auction
  getMyBidSummary: async (auctionId: string): Promise<BidSummaryDto> => {
    try {
      console.log(`📡 Fetching bid summary for auction ${auctionId}`);
      const response = await apiClient.getMyBidSummary(auctionId);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching bid summary for auction ${auctionId}:`, error);
      throw error;
    }
  },

  // Calculate statistics from bids array (frontend calculation) - defensive
  calculateStatistics: (bids: BidDto[]) => {
    const stats = {
      totalBids: 0,
      activeBids: 0,
      winningBids: 0,
      totalBidAmount: 0
    };

    // Defensive check for bids array
    if (!Array.isArray(bids)) {
      console.warn('⚠️ calculateStatistics received non-array:', typeof bids);
      return stats;
    }

    stats.totalBids = bids.length;

    bids.forEach((bid, index) => {
      try {
        // Defensive amount parsing
        const amount = Number(bid?.amount) || 0;
        if (amount > 0) {
          stats.totalBidAmount += amount;
        }

        // Active bids (bids that are not finished/ended)
        if (bid?.status === 'Active' || (bid?.isHighestBid && bid?.status !== 'Won')) {
          stats.activeBids++;
        }

        // Winning bids (user has highest bid or won)
        if (bid?.isHighestBid || bid?.status === 'Won' || bid?.status === 'Winning') {
          stats.winningBids++;
        }
      } catch (error) {
        console.error(`❌ Error calculating stats for bid at index ${index}:`, error, bid);
      }
    });

    console.log('📊 Calculated statistics:', stats);
    return stats;
  },

  // Filter bids by category - defensive
  filterBids: (bids: BidDto[], filter: 'all' | 'active' | 'winning' | 'outbid') => {
    // Defensive check for bids array
    if (!Array.isArray(bids)) {
      console.warn('⚠️ filterBids received non-array:', typeof bids);
      return [];
    }

    try {
      switch (filter) {
        case 'active':
          return bids.filter(bid => {
            try {
              return bid?.status === 'Active' || 
                     (bid?.isHighestBid && bid?.status !== 'Won' && bid?.status !== 'Outbid');
            } catch (error) {
              console.error('❌ Error filtering active bid:', error, bid);
              return false;
            }
          });
        
        case 'winning':
          return bids.filter(bid => {
            try {
              return bid?.isHighestBid || 
                     bid?.status === 'Won' || 
                     bid?.status === 'Winning';
            } catch (error) {
              console.error('❌ Error filtering winning bid:', error, bid);
              return false;
            }
          });
        
        case 'outbid':
          return bids.filter(bid => {
            try {
              return bid?.hasBeenOutbid || 
                     bid?.status === 'Outbid' ||
                     (!bid?.isHighestBid && bid?.status !== 'Won');
            } catch (error) {
              console.error('❌ Error filtering outbid bid:', error, bid);
              return false;
            }
          });
        
        default:
          return bids;
      }
    } catch (error) {
      console.error('❌ Error in filterBids:', error);
      return bids; // Return original array as fallback
    }
  }
};