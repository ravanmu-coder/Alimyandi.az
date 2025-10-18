import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { AuctionGetDto } from '../types/api';
import { 
  Clock, 
  MapPin, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Car,
  TrendingUp,
  AlertCircle,
  Info,
  Play,
  Gavel,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

interface LocationDetails {
  id: string;
  name: string;
  city: string;
  address: string;
}

interface AuctionWithLocation extends AuctionGetDto {
  locationDetails?: LocationDetails;
}

export default function AllAuctions() {
  const [auctions, setAuctions] = useState<AuctionWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load auctions data
  useEffect(() => {
    loadAuctions();
  }, []);

  // Auto-refresh every 30 seconds to keep data current
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        console.log('🔄 Auto-refreshing auction data...');
        loadAuctions();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  const loadAuctions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading auctions data...');

      // Use single endpoint to get all auctions as per requirements
      const [allAuctions, allLocations] = await Promise.all([
        apiClient.getAuctions(),
        apiClient.getLocations()
      ]);

      console.log(`📊 Loaded ${allAuctions.length} auctions and ${allLocations.length} locations`);

      // Create location lookup map for efficient access
      const locationMap = new Map();
      allLocations.forEach(location => {
        locationMap.set(location.id, location);
      });

      // Filter auctions: only show active and future auctions (exclude ended/completed)
      // STATUS-BASED FILTERING: Only 'live' and 'upcoming' auctions
      const now = new Date();
      const filteredAuctions = allAuctions.filter(auction => {
        const status = auction.status?.toLowerCase();
        const startTime = new Date(auction.startTimeUtc);
        const endTime = new Date(auction.endTimeUtc);
        
        // Primary filter: Check status field first
        // Accept only 'live', 'upcoming', 'running', 'active', 'scheduled' status
        const validStatuses = ['live', 'upcoming', 'running', 'active', 'scheduled'];
        const hasValidStatus = status && validStatuses.includes(status);
        
        // Secondary filters for additional validation:
        // 1. Include if auction is currently live (isLive = true OR status = 'live'/'running'/'active')
        const isCurrentlyLive = auction.isLive || status === 'live' || status === 'running' || status === 'active';
        
        // 2. Include if auction is upcoming (status = 'upcoming'/'scheduled' OR start time in future)
        const isUpcoming = status === 'upcoming' || status === 'scheduled' || startTime > now;
        
        // 3. Exclude if auction has ended (current time > end time)
        const hasNotEnded = now <= endTime;
        
        // Final decision: Must have valid status AND (be live OR upcoming) AND not ended
        return hasValidStatus && (isCurrentlyLive || isUpcoming) && hasNotEnded;
      });

      // Log filtering results for debugging
      const liveCount = filteredAuctions.filter(a => a.isLive || a.status?.toLowerCase() === 'live' || a.status?.toLowerCase() === 'running' || a.status?.toLowerCase() === 'active').length;
      const upcomingCount = filteredAuctions.filter(a => {
        const status = a.status?.toLowerCase();
        return (status === 'upcoming' || status === 'scheduled') && !a.isLive;
      }).length;
      
      console.log(`✅ Filtered to ${filteredAuctions.length} active/future auctions:`);
      console.log(`   📍 Live/Running: ${liveCount}`);
      console.log(`   📅 Upcoming/Scheduled: ${upcomingCount}`);
      console.log(`   🔍 Status breakdown:`, filteredAuctions.map(a => ({
        name: a.name,
        status: a.status,
        isLive: a.isLive,
        startTime: a.startTimeUtc
      })));

      // Sort by start time (ascending) - nearest auction first
      const sortedAuctions = filteredAuctions.sort((a, b) => {
        const timeA = new Date(a.startTimeUtc).getTime();
        const timeB = new Date(b.startTimeUtc).getTime();
        return timeA - timeB;
      });

      // Enrich auctions with location details using the lookup map
      const auctionsWithLocations = sortedAuctions.map(auction => {
        const locationDetails = locationMap.get(auction.locationId);
        
        return {
          ...auction,
          locationDetails: locationDetails ? {
            id: locationDetails.id,
            name: locationDetails.name || '',
            city: locationDetails.city || '',
            address: locationDetails.address || ''
          } : {
            id: auction.locationId,
            name: auction.locationName || 'Unknown Location',
            city: '',
            address: ''
          }
        };
      });

      console.log(`🎯 Final result: ${auctionsWithLocations.length} auctions ready for display`);
      setAuctions(auctionsWithLocations);
    } catch (error) {
      console.error('❌ Error loading auctions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load auctions: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(auctions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAuctions = auctions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Format time display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format location display
  const formatLocation = (auction: AuctionWithLocation) => {
    if (auction.locationDetails) {
      const { address, city } = auction.locationDetails;
      if (address && city) {
        return `${address} - ${city}`;
      } else if (city) {
        return city;
      } else if (address) {
        return address;
      }
    }
    return auction.locationName || 'Location TBD';
  };

  // Countdown timer component
  const CountdownTimer = ({ startTime }: { startTime: string }) => {
    const [timeLeft, setTimeLeft] = useState<{
      hours: number;
      minutes: number;
      seconds: number;
      isExpired: boolean;
    }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

    useEffect(() => {
      const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const start = new Date(startTime).getTime();
        const difference = start - now;

        if (difference <= 0) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
          return;
        }

        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          isExpired: false
        });
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);

      return () => clearInterval(timer);
    }, [startTime]);


    if (timeLeft.isExpired) {
      return (
        <div className="flex items-center space-x-2 text-red-500">
          <Clock className="h-4 w-4" />
          <span className="font-semibold">Started</span>
        </div>
      );
    }

    return (
      <span className="text-blue-300 font-medium text-xs">
        in {timeLeft.hours}h {timeLeft.minutes}m
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800/50 rounded-xl w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-700/50 rounded"></div>
                      <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-700/50 rounded"></div>
                  <div className="h-4 bg-slate-700/50 rounded"></div>
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Auctions</h3>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={loadAuctions}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-6 py-3 rounded-xl transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">All Auctions</h1>
              <p className="text-slate-300 text-lg">
                Discover live and upcoming vehicle auctions
              </p>
            </div>
            <button
              onClick={loadAuctions}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {isLoading ? 'Loading...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column - Auction List */}
          <div className="lg:col-span-2">
            {/* Advanced Glassmorphism Panel */}
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Auction Schedule</h2>
                      <p className="text-sm text-slate-400">Live and upcoming auctions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-300">
                    <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-300 font-medium">Live</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-300 font-medium">Upcoming</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auction List */}
              <div className="p-6">
                {currentAuctions.length > 0 ? (
                  <>
                    {/* List Header */}
                    <div className="flex items-center gap-6 px-4 py-2 mb-3 bg-slate-700/20 rounded-lg border border-white/5">
                      <div className="w-24 flex-shrink-0">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Time</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Auction Details</span>
                      </div>
                      <div className="w-32 flex-shrink-0 text-center">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</span>
                      </div>
                      <div className="w-32 flex-shrink-0 text-right">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Actions</span>
                      </div>
                    </div>
                    
                    {/* Auction Items */}
                    <div className="space-y-3">
                    {currentAuctions.map((auction) => (
                      <div
                        key={auction.id}
                        className="bg-gradient-to-r from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-blue-400/30 transition-all duration-300 hover:shadow-[0_8px_25px_rgba(59,130,246,0.1)]"
                      >
                        {/* Horizontal Row Layout */}
                        <div className="flex items-center gap-6">
                          {/* Column 1 - Time (Fixed Width) */}
                          <div className="w-24 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white mb-1">
                                {formatTime(auction.startTimeUtc)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {new Date(auction.startTimeUtc).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Column 2 - Main Information (Flexible Width) */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-white truncate">
                                {auction.name || 'Auction'}
                              </h3>
                              <div className="flex items-center space-x-1 text-slate-400">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm truncate">
                                  {formatLocation(auction)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-slate-400">
                              <div className="flex items-center space-x-1">
                                <Car className="h-3 w-3 text-purple-400" />
                                <span>{auction.totalCarsCount} cars</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Gavel className="h-3 w-3 text-orange-400" />
                                <span>{auction.carsWithPreBidsCount} pre-bids</span>
                              </div>
                              {auction.currentCarLotNumber && (
                                <div className="flex items-center space-x-1 text-blue-400">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>Lot #{auction.currentCarLotNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Column 3 - Status (Fixed Width) */}
                          <div className="w-32 flex-shrink-0">
                            <div className="flex justify-center">
                              {auction.isLive ? (
                                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-full px-3 py-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <span className="text-red-300 font-medium text-xs">Live</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-full px-3 py-1">
                                  <Clock className="h-3 w-3 text-blue-400" />
                                  <CountdownTimer startTime={auction.startTimeUtc} />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Column 4 - Actions (Fixed Width) */}
                          <div className="w-32 flex-shrink-0">
                            <div className="flex items-center justify-end space-x-2">
                              {/* View Auction Button - Icon Only */}
                              <Link
                                to={`/auctions/${auction.id}`}
                                className="w-8 h-8 bg-transparent hover:bg-slate-700/30 border border-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:border-blue-400/50 hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]"
                                title="View Auction"
                              >
                                <Eye className="h-4 w-4 text-blue-400" />
                              </Link>
                              
                              {/* Join Live Auction Button - Enhanced */}
                              <Link
                                to={`/auctions/${auction.id}/join`}
                                className={`px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-semibold ${
                                  auction.isLive
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-[0_4px_12px_rgba(34,197,94,0.3)] animate-pulse'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                                }`}
                                title={auction.isLive ? "Join Live Auction" : "Join Auction"}
                              >
                                <div className="flex items-center space-x-1">
                                  <Play className="h-3 w-3" />
                                  <span>{auction.isLive ? 'Join Live' : 'Join'}</span>
                                </div>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Auctions Available</h3>
                    <p className="text-slate-500 mb-4">
                      There are currently no live or upcoming auctions. Check back later for new auction schedules.
                    </p>
                    <button
                      onClick={loadAuctions}
                      className="inline-flex items-center space-x-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl transition-all duration-300"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-sm font-medium">Check Again</span>
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      const isCurrentPage = page === currentPage;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                            isCurrentPage
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                              : 'bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - About Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">About All Auctions</h3>
                    <p className="text-sm text-slate-400">Learn how auctions work</p>
                  </div>
                </div>
              </div>

              {/* Panel Content */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Live Auctions</h4>
                  <p className="text-slate-300 text-sm leading-relaxed" style={{ lineHeight: '1.6' }}>
                    Currently active auctions where bidding is happening in real-time. 
                    You can join these auctions immediately and start bidding on available vehicles.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Upcoming Auctions</h4>
                  <p className="text-slate-300 text-sm leading-relaxed" style={{ lineHeight: '1.6' }}>
                    Scheduled auctions that haven't started yet. You can view details 
                    and prepare to join when they go live.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">Action Buttons</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center border border-white/10">
                        <Eye className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-slate-300 text-sm font-medium mb-1">View Auction</div>
                        <div className="text-slate-400 text-xs leading-relaxed">
                          See detailed information about the auction, including all available vehicles and bidding history.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                        <Play className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-slate-300 text-sm font-medium mb-1">Join Live Auction</div>
                        <div className="text-slate-400 text-xs leading-relaxed">
                          Enter the advanced live bidding interface with real-time updates, car display, and instant bid placement.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-amber-300 text-sm font-medium mb-1">Pro Tip</div>
                        <div className="text-amber-200/80 text-xs leading-relaxed">
                          Live auctions are marked with a pulsing red indicator and "Join Live" button. The new live auction interface provides real-time bidding, car display, and instant updates. Use "View Auction" to explore vehicles before joining.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
