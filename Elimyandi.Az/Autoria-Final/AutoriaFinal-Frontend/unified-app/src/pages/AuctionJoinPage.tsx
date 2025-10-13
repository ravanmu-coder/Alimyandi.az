import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MapPin, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Wifi,
  WifiOff,
  Users,
  DollarSign,
  Calendar,
  Car,
  Gauge,
  AlertTriangle,
  FileText,
  Hash,
  Camera,
  Play,
  Pause,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useSignalR } from '../hooks/useSignalR';
import { auctionDataService, AuctionPageData } from '../services/auctionDataService';
import { useToast } from '../components/ToastProvider';
import { AuctionGetDto, AuctionCarDetailDto, CarDto } from '../types/api';
import { BidCalculator } from '../utils/bidCalculator';
import LiveAuctionTimer from '../components/LiveAuctionTimer';
import { BidPanel } from '../components/BidPanel';

// Types
interface BidData {
  id: string;
  auctionCarId: string;
  userId: string;
  amount: number;
  placedAtUtc: string;
  userName: string;
  isHighestBid: boolean;
}

interface BidStats {
  totalBids: number;
  bidCount: number;
  averageBid: number;
  soldCount: number;
  totalSalesAmount: number;
}

type BidTab = 'live' | 'prebid' | 'proxy';

const AuctionJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { auctionId } = useParams<{ auctionId: string }>();
  const { addToast } = useToast();

  // State management
  const [pageData, setPageData] = useState<AuctionPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [bidHistory, setBidHistory] = useState<BidData[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [proxyMaxAmount, setProxyMaxAmount] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [minimumBid, setMinimumBid] = useState<number>(0);
  const [activeBidTab, setActiveBidTab] = useState<BidTab>('live');
  const [bidStats] = useState<BidStats>({
    totalBids: 0,
    bidCount: 0,
    averageBid: 0,
    soldCount: 0,
    totalSalesAmount: 0
  });
  const [auctionUrgency, setAuctionUrgency] = useState<{
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    urgencyScore: number;
    factors: string[];
  }>({
    urgencyLevel: 'low',
    urgencyScore: 0,
    factors: []
  });
  const [minPreBid, setMinPreBid] = useState<number>(0);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // SignalR configuration
  const signalRConfig = {
    baseUrl: 'https://localhost:7249',
    token: localStorage.getItem('authToken') || localStorage.getItem('auth_token') || '',
    autoConnect: true,
    events: {
      onNewLiveBid: useCallback((data: { auctionCarId: string; bid: any }) => {
        console.log('🎯 New live bid received:', data);
        
        try {
          const bidData = data.bid as BidData;
          
          // Update bid history
          setBidHistory(prev => {
            const newHistory = [bidData, ...prev.slice(0, 9)]; // Keep last 10 bids
            console.log('📊 Updated bid history:', newHistory.length, 'bids');
            return newHistory;
          });
          
          // Update current car data if this bid is for the current car
          if (pageData?.currentCar?.id === data.auctionCarId) {
            setPageData(prev => {
              if (!prev) return null;
              
              const updatedData = {
                ...prev,
                currentCar: prev.currentCar ? {
                  ...prev.currentCar,
                  currentPrice: bidData.amount,
                  bidCount: (prev.currentCar.bidCount || 0) + 1,
                  lastBidTime: bidData.placedAtUtc
                } : null,
                highestBid: {
                  amount: bidData.amount,
                  bidderName: bidData.userName,
                  placedAtUtc: bidData.placedAtUtc
                }
              };
              
              console.log('💰 Updated current car price:', bidData.amount);
              return updatedData;
            });
            
            // Update minimum bid for next bid using BidCalculator
            setMinimumBid(() => {
              const newMin = BidCalculator.calculateMinimumBid(bidData.amount, minPreBid || 0);
              console.log('📈 Updated minimum bid:', newMin);
              return newMin;
            });
          }

          // Show toast notification
          addToast({
            type: 'success',
            title: 'New Live Bid',
            message: `${bidData.userName} bid $${bidData.amount.toLocaleString()}`
          });
          
        } catch (error) {
          console.error('❌ Error processing new live bid:', error);
        }
      }, [pageData?.currentCar?.id, addToast]),

      onAuctionTimerReset: useCallback((data: { auctionCarId: string; newTimerSeconds: number }) => {
        console.log('⏰ Auction timer reset:', data);
        
        try {
          if (pageData?.currentCar?.id === data.auctionCarId) {
            setTimerSeconds(data.newTimerSeconds);
            console.log('⏱️ Timer updated to:', data.newTimerSeconds, 'seconds');
            
            addToast({
              type: 'info',
              title: 'Timer Reset',
              message: `Timer extended to ${Math.floor(data.newTimerSeconds / 60)}:${(data.newTimerSeconds % 60).toString().padStart(2, '0')}`
            });
          }
        } catch (error) {
          console.error('❌ Error processing timer reset:', error);
        }
      }, [pageData?.currentCar?.id, addToast]),

      onMoveToNextCar: useCallback(async (data: { previousCarId: string; nextCarId: string; nextLotNumber: string }) => {
        console.log('🚗 Moving to next car:', data);
        
        try {
          // Leave previous car group
          if (data.previousCarId) {
            // Note: leaveAuctionCar will be available from the hook
            console.log('👋 Would leave previous car group:', data.previousCarId);
          }
          
          // Switch to new car in SignalR
          // Note: joinAuctionCar will be available from the hook
          console.log('✅ Would join new car group:', data.nextCarId);

          // Refresh data for new car
          const newCarData = await auctionDataService.refreshCurrentCarData(data.nextLotNumber);
          
          setPageData(prev => prev ? {
            ...prev,
            currentCar: newCarData.currentCar,
            carDetails: newCarData.carDetails,
            highestBid: newCarData.highestBid,
            bidHistory: newCarData.bidHistory
          } : null);

          // Reset bid form and state
          setBidAmount('');
          setProxyMaxAmount('');
          setActiveBidTab('live');
          setBidHistory(newCarData.bidHistory);
          
          // Update minimum bid for new car
          if (newCarData.currentCar) {
            try {
              const minBid = await auctionDataService.getMinimumBid(newCarData.currentCar.id);
              setMinimumBid(minBid);
            } catch (error) {
              console.warn('⚠️ Failed to load minimum bid for new car:', error);
              setMinimumBid(newCarData.currentCar.currentPrice || 0);
            }
          }

          addToast({
            type: 'info',
            title: 'Next Vehicle',
            message: `Now showing Lot #${data.nextLotNumber}`
          });
          
        } catch (error) {
          console.error('❌ Failed to move to next car:', error);
          addToast({
            type: 'error',
            title: 'Car Switch Error',
            message: 'Failed to switch to next vehicle'
          });
        }
      }, [addToast]),

      onHighestBidUpdated: useCallback((data: { auctionCarId: string; highestBid: any }) => {
        console.log('💰 Highest bid updated:', data);
        
        try {
          if (pageData?.currentCar?.id === data.auctionCarId) {
            setPageData(prev => {
              if (!prev) return null;
              
              return {
                ...prev,
                currentCar: prev.currentCar ? {
                  ...prev.currentCar,
                  currentPrice: data.highestBid.amount
                } : null,
                highestBid: {
                  amount: data.highestBid.amount,
                  bidderName: data.highestBid.bidderName,
                  placedAtUtc: new Date().toISOString()
                }
              };
            });
            
            console.log('💰 Updated highest bid:', data.highestBid.amount);
          }
        } catch (error) {
          console.error('❌ Error processing highest bid update:', error);
        }
      }, [pageData?.currentCar?.id]),

      onBidStatsUpdated: useCallback((data: { auctionCarId: string; stats: BidStats }) => {
        console.log('📊 Bid stats updated:', data);
        
        try {
          if (pageData?.currentCar?.id === data.auctionCarId) {
            setBidStats(data.stats);
            console.log('📊 Updated bid stats:', data.stats);
          }
        } catch (error) {
          console.error('❌ Error processing bid stats update:', error);
        }
      }, [pageData?.currentCar?.id]),

      onConnectionStateChanged: useCallback((state: any, error?: string) => {
        console.log('🔌 Connection state changed:', state, error);
        
        try {
          if (state !== 'Connected' && error) {
            addToast({
              type: 'warning',
              title: 'Connection Lost',
              message: 'Lost connection to auction. Attempting to reconnect...'
            });
          } else if (state === 'Connected') {
            addToast({
              type: 'success',
              title: 'Connected',
              message: 'Successfully connected to auction'
            });
          }
        } catch (error) {
          console.error('❌ Error processing connection state change:', error);
        }
      }, [addToast]),

      onBidError: useCallback((error: string) => {
        console.error('❌ Bid error:', error);
        
        try {
          addToast({
            type: 'error',
            title: 'Bid Error',
            message: error
          });
        } catch (error) {
          console.error('❌ Error processing bid error:', error);
        }
      }, [addToast])
    }
  };

  // Use SignalR hook
  const {
    isConnected,
    isConnecting,
    lastError,
    retryCount,
    connect,
    disconnect,
    waitForConnection,
    joinAuction,
    joinAuctionCar,
    leaveAuctionCar,
    placeLiveBid,
    placePreBid,
    placeProxyBid,
    cancelProxyBid
  } = useSignalR(signalRConfig);

  // Initialize auction page data with progressive loading
  const initializeAuctionPage = useCallback(async () => {
    if (!auctionId) {
      setError('No auction ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Initializing auction page for:', auctionId);
      
      // Step 1: Load critical auction data first
      const data = await auctionDataService.initializeAuctionPage(auctionId);
      
      setPageData(data);
      setTimerSeconds(data.currentState.timerSeconds);
      setBidHistory(data.bidHistory);
      
      // Step 2: Load minimum bid if we have a current car
      if (data.currentCar) {
        try {
          const minBid = await auctionDataService.getMinimumBid(data.currentCar.id);
          setMinimumBid(minBid);
          setMinPreBid(minBid);
          console.log('✅ Minimum bid loaded:', minBid);
        } catch (error) {
          console.warn('⚠️ Failed to load minimum bid, using BidCalculator:', error);
          const calculatedMin = BidCalculator.calculateMinimumBid(data.currentCar.currentPrice || 0, 0);
          setMinimumBid(calculatedMin);
          setMinPreBid(calculatedMin);
        }
      }

      // Calculate initial auction urgency
      const urgency = BidCalculator.calculateAuctionUrgency(
        data.currentState.timerSeconds,
        data.bidHistory,
        data.currentCar?.currentPrice || 0
      );
      setAuctionUrgency(urgency);

      console.log('✅ Auction page initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize auction page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Categorize error for better user experience
      if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Authentication')) {
        setError('Authentication failed. Please log in again.');
      } else if (errorMessage.includes('404')) {
        setError('Auction not found. Please check the auction ID.');
      } else {
        setError(`Failed to load auction: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  // Connect to SignalR when data is loaded with proper error handling
  useEffect(() => {
    const connectToSignalR = async () => {
      if (!pageData) return;
      
      // Don't attempt connection if already connected or if we've exceeded retry limit
      if (isConnected || isConnecting || (retryCount >= 5)) {
        return;
      }

      try {
        console.log('🔌 Connecting to SignalR...');
        
        // Connect to SignalR
        await connect();
        
        // Wait for connection to be established
        const connectionEstablished = await waitForConnection(10000);
        if (!connectionEstablished) {
          console.error('❌ SignalR connection timeout');
          return;
        }

        console.log('✅ SignalR connected, joining groups...');
        
        // Join auction group
        await joinAuction(pageData.auction.id);
        console.log('✅ Joined auction group:', pageData.auction.id);
        
        // Join car group if we have a current car
        if (pageData.currentCar?.id) {
          await joinAuctionCar(pageData.currentCar.id);
          console.log('✅ Joined car group:', pageData.currentCar.id);
        }

        console.log('🎉 SignalR setup complete');
        
      } catch (error) {
        console.error('❌ SignalR connection failed:', error);
        // Don't set error state here as the page can still function without SignalR
      }
    };
    
    connectToSignalR();
  }, [pageData, isConnected, isConnecting, retryCount, connect, waitForConnection, joinAuction, joinAuctionCar]);

  // Timer effect with urgency calculation
  useEffect(() => {
    if (timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timerSeconds]);

  // Update urgency in real-time
  useEffect(() => {
    if (pageData?.currentCar) {
      const urgency = BidCalculator.calculateAuctionUrgency(
        timerSeconds,
        bidHistory,
        pageData.currentCar.currentPrice || 0
      );
      setAuctionUrgency(urgency);
    }
  }, [timerSeconds, bidHistory, pageData?.currentCar]);

  // Load data on mount
  useEffect(() => {
    initializeAuctionPage();
  }, [initializeAuctionPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // Enhanced bid handler using BidCalculator
  const handleBidPlaced = useCallback((bid: any) => {
    console.log('🎯 Bid placed successfully:', bid);
    
    // Update minimum bid for next bid
    if (bid.amount) {
      const newMin = BidCalculator.calculateMinimumBid(bid.amount, minPreBid);
      setMinimumBid(newMin);
    }
        
        // Invalidate cache to get fresh data
    if (pageData?.currentCar?.id) {
        auctionDataService.invalidateCache(pageData.currentCar.id);
    }
  }, [minPreBid, pageData?.currentCar?.id]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Auction</h2>
          <p className="text-white/80">Initializing real-time auction data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !pageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-lg p-8">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Auction</h2>
            <p className="text-white/80 mb-6">{error}</p>
              <button
              onClick={initializeAuctionPage}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pageData) return null;

  const { auction, currentState, currentCar, carDetails, highestBid, lotQueue } = pageData;
  const isLive = currentState.isLive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Auction Header - Advanced Glassmorphism */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {auction.name}
                </h1>
                
                <div className="flex items-center gap-6">
                  {/* Status Badge */}
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border ${
                    isLive 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-green-500/20' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30 shadow-blue-500/20'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></div>
                    {isLive ? 'LIVE AUCTION' : 'SCHEDULED'}
                  </div>

                  {/* Location */}
                  {auction.locationName && (
                    <div className="flex items-center gap-2 text-white/80">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{auction.locationName}</span>
                    </div>
                  )}

                  {/* Participants */}
                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{currentState.activeBidders || 0} Active</span>
                  </div>

                  {/* Connection Status */}
                  <div className="flex items-center gap-2 text-white/80">
                    {isConnected ? (
                      <Wifi className="h-4 w-4 text-green-400" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-sm">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    {lastError && !isConnecting && (
                      <button
                        onClick={() => {
                          if (pageData) {
                            connect();
                            joinAuction(pageData.auction.id);
                            if (pageData.currentCar?.id) {
                              joinAuctionCar(pageData.currentCar.id);
                            }
                          }
                        }}
                        className="ml-2 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-xs text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* Timer */}
                {timerSeconds > 0 && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Clock className="h-4 w-4" />
                    <span className="text-lg font-mono font-bold">
                      {formatTime(timerSeconds)}
                    </span>
                    <span className="text-sm">remaining</span>
                    
                    {/* Urgency Indicator */}
                    {auctionUrgency.urgencyLevel !== 'low' && (
                      <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        auctionUrgency.urgencyLevel === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        auctionUrgency.urgencyLevel === 'high' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                        'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {auctionUrgency.urgencyLevel.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={initializeAuctionPage}
                disabled={loading}
                className="p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Copart-inspired Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel - Car Details & Queue */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Car Details Panel */}
            {currentCar && carDetails && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Details
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/80">
                        <Hash className="h-4 w-4" />
                        <span>Lot #{currentCar.lotNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Calendar className="h-4 w-4" />
                        <span>{carDetails.year || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Gauge className="h-4 w-4" />
                        <span>{carDetails.odometer?.toLocaleString() || 'N/A'} mi</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/80">
                        <MapPin className="h-4 w-4" />
                        <span>{carDetails.type || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <FileText className="h-4 w-4" />
                        <span>{carDetails.condition || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{carDetails.damageType || 'N/A'}</span>
                      </div>
                    </div>
          </div>

                  {carDetails.vin && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        <Hash className="h-3 w-3" />
                        <span>VIN: {carDetails.vin}</span>
                      </div>
                    </div>
                  )}
              </div>
              </div>
            )}

            {/* Lot Queue */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Lot Queue
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lotQueue.slice(0, 6).map((car, index) => (
                    <div
                      key={car.id}
                    className={`p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                      car.id === currentCar?.id
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Lot #{car.lotNumber}
                        </div>
                        <div className="text-xs text-white/60">
                          Vehicle #{car.id}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          ${car.currentPrice?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-white/60">
                          {index === 0 ? 'Now' : `${index * 2}min`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Main Stage */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Live Auction Timer */}
            <LiveAuctionTimer
              timerSeconds={timerSeconds}
              isLive={isLive}
              onTimerExpired={() => {
                console.log('⏰ Timer expired - auction should move to next car');
                addToast({
                  type: 'warning',
                  title: 'Time Up',
                  message: 'Auction timer expired. Moving to next vehicle...'
                });
              }}
              onTimerReset={(newSeconds) => {
                console.log('⏰ Timer reset to:', newSeconds);
                setTimerSeconds(newSeconds);
              }}
              className="w-full"
              showWarnings={true}
            />
            
            {/* Car Gallery */}
            {currentCar && carDetails && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden">
                    {carDetails.imageUrls && carDetails.imageUrls.length > 0 ? (
                      <img
                        src={carDetails.imageUrls[0]}
                        alt={`${carDetails.make} ${carDetails.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Camera className="h-16 w-16 text-white/40" />
                      </div>
                    )}
                    
                    {/* Reserve Status */}
                    {currentCar.isReserveMet && (
                      <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-lg px-3 py-1">
                        <div className="flex items-center gap-2 text-green-300 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Reserve Met
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {carDetails.imageUrls && carDetails.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {carDetails.imageUrls.slice(1, 5).map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Vehicle ${index + 2}`}
                          className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Bid Circle & History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bid Circle */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Current Bid
                </h3>
                
                <div className="text-center">
                  <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 ${
                    auctionUrgency.urgencyLevel === 'critical'
                      ? 'border-red-500 animate-pulse bg-red-500/10'
                      : auctionUrgency.urgencyLevel === 'high'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-blue-500 bg-blue-500/10'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {BidCalculator.formatCurrency(highestBid?.amount || currentCar?.currentPrice || 0)}
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        {highestBid?.bidderName || 'No bids'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-white/80">
                      Bid Count: {currentCar?.bidCount || 0}
                    </div>
                    <div className="text-sm text-white/80">
                      Reserve: {BidCalculator.formatCurrency(currentCar?.reservePrice || 0)}
                    </div>
                    <div className="text-sm text-white/80">
                      Next Min: {BidCalculator.formatCurrency(minimumBid)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid History */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Bids
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bidHistory.slice(0, 5).map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-white/80">{bid.userName}</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {BidCalculator.formatCurrency(bid.amount)}
                      </span>
                    </div>
                  ))}
                  
                  {bidHistory.length === 0 && (
                    <div className="text-center text-white/60 text-sm py-4">
                      No bids yet
                    </div>
                  )}
                </div>
          </div>
        </div>
      </div>

          {/* Right Panel - Bidding Actions */}
          <div className="lg:col-span-3">
            {currentCar && (
              <BidPanel
                auctionCarId={currentCar.id}
                currentPrice={currentCar.currentPrice || 0}
                minBidIncrement={BidCalculator.calculateBidIncrement(currentCar.currentPrice || 0)}
                isActive={isLive}
                isReserveMet={currentCar.isReserveMet || false}
                reservePrice={currentCar.reservePrice}
                bidCount={currentCar.bidCount || 0}
                lastBidTime={currentCar.lastBidTime}
                onBidPlaced={handleBidPlaced}
                className="w-full"
                minPreBid={minPreBid}
                showRealTimeValidation={true}
                autoCalculateMinimum={true}
              />
            )}
          </div>

          {/* Connection Error Display */}
          {lastError && (
            <div className="mt-6 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-red-400" />
                <div className="flex-1">
                  <h4 className="text-red-300 font-medium mb-1">Connection Error</h4>
                  <p className="text-red-200/80 text-sm">{lastError}</p>
                </div>
                <button
                  onClick={() => {
                    if (pageData) {
                      connect();
                      joinAuction(pageData.auction.id);
                      if (pageData.currentCar?.id) {
                        joinAuctionCar(pageData.currentCar.id);
                      }
                    }
                  }}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Retry Connection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionJoinPage;
