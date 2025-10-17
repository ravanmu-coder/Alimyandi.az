/**
 * LiveAuctionPage - Copart/eBay Səviyyəsində Real-Time Auction
 * 
 * ✅ YENİ VERSİYA - Server-Driven, Store-Managed
 * 
 * Prinsiplər:
 * - Bütün state auctionStore-dan gəlir (server-authoritative)
 * - Heç bir local useState yoxdur
 * - Heç bir connection.on() event handler yoxdur (signalRManager-də)
 * - Timer server-driven (TimerTick event)
 * - Bid-lər real-time (NewLiveBid event)
 * - Bütün userlər eyni anda sinxron görür
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuctionStore, selectBidding, selectTimer, selectConnection } from '../stores/auctionStore';
import { useSignalR } from '../hooks/useSignalR';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import {
  ChevronLeft,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Gavel,
  Wifi,
  WifiOff,
  Car,
} from 'lucide-react';

// ========================================
// MAIN COMPONENT
// ========================================

const LiveAuctionPage: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();

  // ========================================
  // STORE STATE (Server-Authoritative)
  // ========================================
  
  const auction = useAuctionStore(state => state.auction);
  const currentCar = useAuctionStore(state => state.currentCar);
  const currentPrice = useAuctionStore(state => state.currentPrice);
  const highestBid = useAuctionStore(state => state.highestBid);
  const bidHistory = useAuctionStore(state => state.bidHistory);
  const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
  const status = useAuctionStore(state => state.status);
  const isLive = useAuctionStore(state => state.isLive);
  const totalBids = useAuctionStore(state => state.totalBids);
  const uniqueBidders = useAuctionStore(state => state.uniqueBidders);
  const activeBidders = useAuctionStore(state => state.activeBidders);
  const isConnected = useAuctionStore(state => state.isConnected);

  // Store actions
  const setAuctionId = useAuctionStore(state => state.setAuctionId);
  const setAuction = useAuctionStore(state => state.setAuction);
  const setCurrentCar = useAuctionStore(state => state.setCurrentCar);
  const setBidHistory = useAuctionStore(state => state.setBidHistory);
  const updateHighestBid = useAuctionStore(state => state.updateHighestBid);
  const setRemainingSeconds = useAuctionStore(state => state.setRemainingSeconds);
  const updateStats = useAuctionStore(state => state.updateStats);

  // ========================================
  // LOCAL UI STATE (UI-specific only)
  // ========================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ========================================
  // SIGNALR CONNECTION
  // ========================================

  const {
    isConnected: signalRConnected,
    isConnecting,
    connectionState,
    joinAuction,
    joinAuctionCar,
    placeLiveBid,
  } = useSignalR({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249',
    token: localStorage.getItem('authToken') || '',
    autoConnect: true,
    events: {
      // Only page-specific logic, store updates are in signalRManager
      onCarMoved: async (data: any) => {
        console.log('🚗 Car Moved:', data);
        if (data.nextCarId) {
          try {
            await joinAuctionCar(data.nextCarId);
            const newCar = await apiClient.getAuctionCar(data.nextCarId);
            setCurrentCar(newCar);
            setCurrentImageIndex(0);
            toast.success(`Moved to Lot #${newCar.lotNumber}`);
          } catch (err) {
            console.error('Failed to load new car:', err);
          }
        }
      },
    },
  });

  // ========================================
  // INITIAL DATA LOAD
  // ========================================

  useEffect(() => {
    const loadAuctionData = async () => {
      if (!auctionId) {
        setError('Auction ID required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setAuctionId(auctionId);

        // Load auction details
        const auctionData = await apiClient.getAuction(auctionId);
        setAuction(auctionData);

        // Load current state
        const currentState = await apiClient.getAuctionCurrentState(auctionId);
        
        // Load car if available
        if (currentState.currentCarLotNumber) {
          try {
            const car = await apiClient.getAuctionCarByLot(currentState.currentCarLotNumber);
            setCurrentCar(car);

            // Load bid data
            const bids = await apiClient.getRecentBids(car.id, 20);
            const highest = await apiClient.getHighestBid(car.id);
            
            setBidHistory(Array.isArray(bids) ? bids : []);
            if (highest) updateHighestBid(highest);
          } catch (err) {
            console.warn('Could not load current car');
          }
        }

        // Set initial timer
        setRemainingSeconds(currentState.timerSeconds || 10);

        // Load stats
        try {
          const stats = await apiClient.getAuctionStatistics(auctionId);
          updateStats({
            totalBids: stats.totalBids,
            uniqueBidders: stats.uniqueBidders,
            activeBidders: stats.activeBidders,
          });
        } catch (err) {
          console.warn('Stats not available');
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load auction:', err);
        setError(err.message || 'Failed to load auction');
        setLoading(false);
      }
    };

    loadAuctionData();
  }, [auctionId]);

  // ========================================
  // JOIN SIGNALR GROUPS WHEN CONNECTED
  // ========================================

  useEffect(() => {
    const joinGroups = async () => {
      if (!auctionId || !signalRConnected || !auction) return;

      try {
        await joinAuction(auctionId);
        console.log('✅ Joined auction group');

        if (currentCar?.id) {
          await joinAuctionCar(currentCar.id);
          console.log('✅ Joined car group');
        }
      } catch (err) {
        console.error('Failed to join groups:', err);
      }
    };

    joinGroups();
  }, [auctionId, signalRConnected, auction, currentCar?.id, joinAuction, joinAuctionCar]);

  // ========================================
  // BID HANDLING
  // ========================================

  const handlePlaceBid = async (amount: number) => {
    if (!currentCar) {
      toast.error('No active car');
      return;
    }

    setIsPlacingBid(true);
    try {
      await placeLiveBid(currentCar.id, amount);
      setBidAmount('');
      // Backend will send events, store will update, UI will re-render
    } catch (err: any) {
      console.error('Bid failed:', err);
      toast.error(err.message || 'Bid failed');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleQuickBid = (increment: number) => {
    const amount = currentPrice + increment;
    handlePlaceBid(amount);
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (remainingSeconds <= 10) return 'text-red-500';
    if (remainingSeconds <= 30) return 'text-orange-500';
    if (remainingSeconds <= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getTimerBgColor = () => {
    if (remainingSeconds <= 10) return 'from-red-600/30 to-red-700/30';
    if (remainingSeconds <= 30) return 'from-orange-600/30 to-orange-700/30';
    if (remainingSeconds <= 60) return 'from-yellow-600/30 to-yellow-700/30';
    return 'from-green-600/30 to-green-700/30';
  };

  const getCarImages = () => {
    const car = currentCar?.car;
    if (!car) return [];
    
    if ((car as any).photoUrls?.length) return (car as any).photoUrls;
    if (car.imageUrls?.length) return car.imageUrls;
    return [];
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Live Auction</h2>
          <p className="text-slate-400">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md bg-slate-800/50 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Auction</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // NO CAR STATE
  // ========================================

  if (!currentCar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 text-slate-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Car</h2>
          <p className="text-slate-400 mb-6">Waiting for auction to start...</p>
        </div>
      </div>
    );
  }

  const images = getCarImages();
  const currentImage = images[currentImageIndex] || '/placeholder-car.jpg';

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/auctions')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Auctions</span>
          </button>

          {/* Live Indicator */}
          {isLive && (
            <div className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-red-400 uppercase">Live Auction</span>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className="text-sm text-slate-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Car Info & Image */}
          <div className="lg:col-span-2 space-y-6">
            {/* Car Image */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10">
              <div className="aspect-video relative">
                <img
                  src={currentImage}
                  alt={`${currentCar.car?.make} ${currentCar.car?.model}`}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Car Details */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h1 className="text-3xl font-bold mb-4">
                {currentCar.car?.year} {currentCar.car?.make} {currentCar.car?.model}
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Lot Number</p>
                  <p className="font-semibold">#{currentCar.lotNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400">VIN</p>
                  <p className="font-semibold">{currentCar.car?.vin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Mileage</p>
                  <p className="font-semibold">{currentCar.car?.mileage?.toLocaleString() || 'N/A'} km</p>
                </div>
                <div>
                  <p className="text-slate-400">Transmission</p>
                  <p className="font-semibold">{currentCar.car?.transmission || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="space-y-6">
            {/* Timer */}
            <div className={`bg-gradient-to-r ${getTimerBgColor()} border border-white/20 rounded-2xl p-6 text-center`}>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Time Remaining</span>
              </div>
              <div className={`text-5xl font-bold ${getTimerColor()}`}>
                {formatTime(remainingSeconds)}
              </div>
            </div>

            {/* Current Price */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">Current Price</span>
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-4xl font-bold text-green-400">
                ${currentPrice.toLocaleString()}
              </div>
              {highestBid && (
                <p className="text-sm text-slate-400 mt-2">
                  Highest Bidder: {highestBid.userName || 'Anonymous'}
                </p>
              )}
            </div>

            {/* Quick Bid Buttons */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Gavel className="h-5 w-5 mr-2" />
                Place Bid
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[100, 500, 1000, 5000].map((increment) => (
                  <button
                    key={increment}
                    onClick={() => handleQuickBid(increment)}
                    disabled={!isLive || isPlacingBid}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold transition-all"
                  >
                    +${increment.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Statistics
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Bids</span>
                  <span className="font-semibold">{totalBids}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unique Bidders</span>
                  <span className="font-semibold">{uniqueBidders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Bidders</span>
                  <span className="font-semibold flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {activeBidders}
                  </span>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Bid History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bidHistory.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No bids yet</p>
                )}
                {bidHistory.slice(0, 10).map((bid, idx) => (
                  <div
                    key={bid.id}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      idx === 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-700/30'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">${bid.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{bid.userName || 'Anonymous'}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(bid.placedAtUtc).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAuctionPage;

/**
 * QEYD:
 * 
 * ✅ Bütün state auctionStore-dan gəlir
 * ✅ Heç bir local useState auction məlumatı üçün yoxdur
 * ✅ SignalR event-ləri signalRManager-də idarə olunur
 * ✅ Timer server-driven (TimerTick event hər saniyə)
 * ✅ Bid-lər real-time (NewLiveBid event)
 * ✅ Bütün userlər eyni anda sinxron görür
 * 
 * İSTİFADƏ:
 * - Bu fayl köhnə LiveAuctionPage.tsx-i əvəz edə bilər
 * - Və ya köhnəsini LiveAuctionPage_OLD.tsx kimi rename edib bunu istifadə et
 */

