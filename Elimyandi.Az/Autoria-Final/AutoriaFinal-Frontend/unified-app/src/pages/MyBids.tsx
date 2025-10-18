import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Trophy, 
  Gavel, 
  List, 
  Eye, 
  Clock,
  TrendingUp,
  Award,
  X,
  RefreshCw,
  Car,
  Calendar,
  DollarSign,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

// API imports
import { bidApi, BidDto } from '../api/bids';
import { auctionCarApi, AuctionCarFullDetailsDto } from '../api/auctioncar';
import { auctionApi, AuctionInfoDto } from '../api/auction';
import { carApi, CarDetailsDto } from '../api/car';

// Enhanced bid with vehicle details
interface EnrichedBidDto extends BidDto {
  vehicleDetails?: AuctionCarFullDetailsDto;
  isLoading?: boolean;
  error?: string;
}

interface BidStatistics {
  totalBids: number;
  activeBids: number;
  winningBids: number;
  totalBidAmount: number;
}

type TabFilter = 'all' | 'active' | 'winning' | 'outbid';

// Statistics card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, isLoading }) => (
  <div className={`group bg-slate-800/40 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 ${color} rounded-lg group-hover:opacity-80 transition-opacity`}>
        {icon}
      </div>
      <div className="text-right">
        {isLoading ? (
          <div className="w-16 h-8 bg-slate-600/50 rounded animate-pulse"></div>
        ) : (
          <div className="text-3xl font-bold text-white">
            {typeof value === 'number' && title.includes('Amount') 
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
              : value
            }
          </div>
        )}
      </div>
    </div>
    <div className="text-slate-400 text-sm font-medium">{title}</div>
  </div>
);

// Bid row component
interface BidRowProps {
  bid: EnrichedBidDto;
  onRefreshVehicle: (auctionCarId: string) => void;
}

const BidRow: React.FC<BidRowProps> = ({ bid, onRefreshVehicle }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const vehicleDetails = bid.vehicleDetails;
  const car = vehicleDetails?.car;
  const auction = vehicleDetails?.auction;

  return (
    <div className="group bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-5 hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200">
      <div className="flex items-center gap-5">
        {/* Lot Number Badge */}
        <div className="flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className="px-4 py-3 bg-slate-600/50 rounded-lg border border-slate-500/50">
              <div className="text-center">
                <div className="text-xs text-slate-400 font-medium mb-1">LOT</div>
                <div className="text-lg font-bold text-white">
                  {vehicleDetails?.lotNumber || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info & Auction Details */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              {bid.isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 bg-slate-600/50 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-slate-600/30 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-slate-600/20 rounded w-24 animate-pulse"></div>
                </div>
              ) : bid.error ? (
                <div>
                  <h4 className="text-red-400 font-semibold text-lg mb-1">
                    Failed to load vehicle details
                  </h4>
                  <p className="text-slate-400 text-sm mb-2">
                    Auction Car ID: {bid.auctionCarId}
                  </p>
                  <button
                    onClick={() => onRefreshVehicle(bid.auctionCarId)}
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-semibold text-xl">
                      {car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Vehicle'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel className="w-4 h-4 text-purple-400" />
                    <p className="text-slate-300 text-sm font-medium">
                      {auction?.name || 'Unknown Auction'}
                    </p>
                  </div>
                  <div className="flex items-center text-slate-500 text-xs space-x-4">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Bid Placed: {formatDate(bid.placedAtUtc)}
                    </span>
                    {auction && auctionApi.isAuctionRunning(auction) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                        Live Auction
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Bid Amounts */}
            <div className="text-right flex-shrink-0 ml-6">
              <div className="space-y-1">
                <div className="text-white font-semibold text-lg">
                  Your Bid: {formatCurrency(bid.amount)}
                </div>
                {vehicleDetails && vehicleDetails.currentPrice !== bid.amount && (
                  <div className="text-slate-400 text-sm">
                    Current: {formatCurrency(vehicleDetails.currentPrice)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (appears on hover) */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => navigate(`/auction-cars/${bid.auctionCarId}`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600/80 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Vehicle
            </button>
            {auction && auctionApi.isAuctionRunning(auction) && (
              <button
                onClick={() => navigate(`/auctions/${auction.id}/join`)}
                className="inline-flex items-center px-4 py-2 bg-green-600/80 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Join Auction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
export default function MyBids() {
  const [bids, setBids] = useState<EnrichedBidDto[]>([]);
  const [statistics, setStatistics] = useState<BidStatistics>({
    totalBids: 0,
    activeBids: 0,
    winningBids: 0,
    totalBidAmount: 0
  });
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Load user bids and calculate statistics
  const loadMyBids = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🚀 Loading user bids...');
      
      // Step 1: Get user bids
      const userBids = await bidApi.getMyBids();
      
      // Step 2: Calculate statistics
      const stats = bidApi.calculateStatistics(userBids);
      setStatistics(stats);
      
      // Step 3: Initialize bids with loading state for vehicle details
      const enrichedBids: EnrichedBidDto[] = userBids.map(bid => ({
        ...bid,
        isLoading: true
      }));
      
      setBids(enrichedBids);
      
      // Step 4: Load vehicle details in batches
      const auctionCarIds = userBids.map(bid => bid.auctionCarId);
      const vehicleDetailsMap = await auctionCarApi.batchGetFullDetails(auctionCarIds);
      
      // Step 5: Update bids with vehicle details
      const finalEnrichedBids: EnrichedBidDto[] = userBids.map(bid => {
        const vehicleDetails = vehicleDetailsMap.get(bid.auctionCarId);
        return {
          ...bid,
          vehicleDetails,
          isLoading: false,
          error: vehicleDetails ? undefined : 'Failed to load vehicle details'
        };
      });
      
      setBids(finalEnrichedBids);
      console.log('✅ Successfully loaded all bid data');
      
    } catch (error) {
      console.error('❌ Error loading bids:', error);
      
      if ((error as Error).message === 'UNAUTHORIZED') {
        // Redirect to login
        navigate('/login');
        return;
      }
      
      setError((error as Error).message || 'Failed to load your bids. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Refresh specific vehicle details
  const refreshVehicleDetails = useCallback(async (auctionCarId: string) => {
    setBids(prevBids => 
      prevBids.map(bid => 
        bid.auctionCarId === auctionCarId 
          ? { ...bid, isLoading: true, error: undefined }
          : bid
      )
    );

    try {
      const vehicleDetails = await auctionCarApi.getFullDetails(auctionCarId);
      
      setBids(prevBids => 
        prevBids.map(bid => 
          bid.auctionCarId === auctionCarId 
            ? { ...bid, vehicleDetails, isLoading: false, error: undefined }
            : bid
        )
      );
    } catch (error) {
      setBids(prevBids => 
        prevBids.map(bid => 
          bid.auctionCarId === auctionCarId 
            ? { ...bid, isLoading: false, error: 'Failed to load vehicle details' }
            : bid
        )
      );
    }
  }, []);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    auctionCarApi.clearCache(); // Clear cache for fresh data
    await loadMyBids();
    setIsRefreshing(false);
  }, [loadMyBids]);

  // Initial load
  useEffect(() => {
    loadMyBids();
  }, [loadMyBids]);

  // Filter bids based on active tab
  const filteredBids = bidApi.filterBids(bids, activeTab);

  // Get count for each tab
  const getTabCount = (filter: TabFilter) => {
    return bidApi.filterBids(bids, filter).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading Skeleton */}
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="h-10 bg-slate-700/50 rounded-lg w-80 mb-3"></div>
              <div className="h-5 bg-slate-700/30 rounded w-96"></div>
            </div>
            
            {/* Statistics Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <StatCard
                  key={i}
                  title="Loading..."
                  value=""
                  icon={<div className="w-7 h-7 bg-slate-600/50 rounded"></div>}
                  color="bg-slate-600/20"
                  isLoading={true}
                />
              ))}
            </div>
            
            {/* Content Skeleton */}
            <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700 rounded-xl overflow-hidden">
              <div className="border-b border-slate-700 p-6">
                <div className="flex space-x-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-6 bg-slate-600/50 rounded w-20"></div>
                  ))}
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-700/30 rounded-lg"></div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">My Bidding Dashboard</h1>
            <p className="text-slate-400 text-lg">Track your auction activity and monitor your bids</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Statistics Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bids"
            value={statistics.totalBids}
            icon={<List className="h-7 w-7 text-purple-400" />}
            color="bg-purple-500/20"
          />
          <StatCard
            title="Active Bids"
            value={statistics.activeBids}
            icon={<Gavel className="h-7 w-7 text-blue-400" />}
            color="bg-blue-500/20"
          />
          <StatCard
            title="Winning Bids"
            value={statistics.winningBids}
            icon={<Trophy className="h-7 w-7 text-yellow-400" />}
            color="bg-yellow-500/20"
          />
          <StatCard
            title="Total Bid Amount"
            value={statistics.totalBidAmount}
            icon={<Wallet className="h-7 w-7 text-green-400" />}
            color="bg-green-500/20"
          />
          </div>

        {/* Tabbed Bid List Panel */}
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700 rounded-xl overflow-hidden">
          {/* Tab System */}
          <div className="border-b border-slate-700">
            <div className="flex">
              {[
                { key: 'all', label: 'All Bids', icon: List },
                { key: 'active', label: 'Active', icon: Clock },
                { key: 'winning', label: 'Winning', icon: Trophy },
                { key: 'outbid', label: 'Outbid', icon: X }
              ].map((tab) => {
                const Icon = tab.icon;
                const count = getTabCount(tab.key as TabFilter);
                const isActive = activeTab === tab.key;

              return (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabFilter)}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-all duration-200 relative ${
                    isActive
                        ? 'text-blue-400 bg-slate-700/50'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      isActive 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                    {count}
                  </span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                </button>
              );
            })}
          </div>
        </div>

          {/* Bid List Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-300">{error}</span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {filteredBids.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gavel className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">
                  {activeTab === 'all' ? 'No Bids Yet' : `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Bids`}
                </h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? 'You haven\'t placed any bids yet. Start bidding to see your activity here.'
                    : `You don't have any ${activeTab} bids at the moment.`
                  }
                </p>
                <Link
                  to="/all-auctions"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Browse Auctions
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBids.map((bid) => (
                  <BidRow
                    key={bid.id}
                    bid={bid}
                    onRefreshVehicle={refreshVehicleDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}