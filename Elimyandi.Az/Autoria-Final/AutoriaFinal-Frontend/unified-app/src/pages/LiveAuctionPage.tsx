import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  EyeOff,
  Zap,
  Timer,
  Car,
  Gavel,
  Star,
  Heart,
  Share2,
  Download,
  Info,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import existing services and hooks
import { useSignalR } from '../hooks/useSignalR';
import { auctionDataService, AuctionPageData } from '../services/auctionDataService';
import { apiClient } from '../lib/api';
import { 
  AuctionGetDto, 
  AuctionCarDetailDto, 
  CarDto, 
  BidGetDto, 
  PlaceLiveBidRequest 
} from '../types/api';

// Types
interface AuctionState {
  isLive: boolean;
  currentCarLotNumber: number | null;
  timerSeconds: number;
  isPaused: boolean;
}

interface BidHistoryItem {
  id: string;
  amount: number;
  bidderName: string;
  bidTime: string;
  bidType: 'live' | 'pre' | 'proxy';
  isHighest: boolean;
  isCurrentUser: boolean;
}

// Car Display Panel Component
const CarDisplayPanel: React.FC<{
  currentCar: AuctionCarDetailDto | null;
  carDetails: CarDto | null;
  lotQueue: AuctionCarDetailDto[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSelectCar: (car: AuctionCarDetailDto) => void;
}> = ({ currentCar, carDetails, lotQueue, isFullscreen, onToggleFullscreen, onSelectCar }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const images = useMemo(() => {
    if (!carDetails?.images || carDetails.images.length === 0) {
      return ['/api/placeholder/600/400'];
    }
    return carDetails.images;
  }, [carDetails?.images]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  if (!currentCar) {
    return (
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="aspect-video bg-slate-800/50 flex items-center justify-center">
          <div className="text-center">
            <Car className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Active Vehicle</h3>
            <p className="text-slate-500">Waiting for auction to begin...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Lot #{currentCar.lotNumber} - {carDetails?.make} {carDetails?.model}
              </h2>
              <p className="text-sm text-slate-400">
                {carDetails?.year} • {carDetails?.mileage?.toLocaleString()} miles
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleFullscreen}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-300"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Car Image */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-slate-800/50 rounded-2xl overflow-hidden">
              {isImageLoading && (
                <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-slate-500 animate-spin" />
                </div>
              )}
              <img
                src={images[currentImageIndex]}
                alt={`${carDetails?.make} ${carDetails?.model}`}
                className="w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-300"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-300"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Car Details */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Vehicle Info</h4>
                <div className="space-y-1 text-sm text-slate-300">
                  <div>Make: {carDetails?.make}</div>
                  <div>Model: {carDetails?.model}</div>
                  <div>Year: {carDetails?.year}</div>
                  <div>Mileage: {carDetails?.mileage?.toLocaleString()} miles</div>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Condition</h4>
                <div className="space-y-1 text-sm text-slate-300">
                  <div>Engine: {carDetails?.engine}</div>
                  <div>Transmission: {carDetails?.transmission}</div>
                  <div>Fuel: {carDetails?.fuelType}</div>
                  <div>Color: {carDetails?.color}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lot Queue */}
          <div className="lg:col-span-1">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Lots</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {lotQueue.slice(0, 10).map((car, index) => (
                  <button
                    key={car.id}
                    onClick={() => onSelectCar(car)}
                    className="w-full p-3 bg-slate-600/30 hover:bg-slate-600/50 rounded-lg border border-white/10 hover:border-blue-400/30 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-500/50 rounded-lg flex items-center justify-center">
                        <Car className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          Lot #{car.lotNumber}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {car.car?.make} {car.car?.model}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        #{index + 2}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bid Panel Component
const BidPanel: React.FC<{
  currentCar: AuctionCarDetailDto | null;
  highestBid: BidGetDto | null;
  bidHistory: BidGetDto[];
  timerSeconds: number;
  isLive: boolean;
  isPaused: boolean;
  isConnected: boolean;
  onPlaceBid: (amount: number) => Promise<void>;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  currentUserId?: string;
}> = ({ 
  currentCar, 
  highestBid, 
  bidHistory, 
  timerSeconds, 
  isLive, 
  isPaused, 
  isConnected,
  onPlaceBid,
  onTimerToggle,
  onTimerReset,
  currentUserId 
}) => {
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [selectedBidType, setSelectedBidType] = useState<'live' | 'pre' | 'proxy'>('live');

  const minimumBid = useMemo(() => {
    if (!highestBid) return currentCar?.startingPrice || 0;
    return highestBid.amount + (highestBid.amount * 0.05); // 5% increment
  }, [highestBid, currentCar?.startingPrice]);

  const quickBidAmounts = useMemo(() => {
    const base = minimumBid;
    return [
      base,
      base + 100,
      base + 250,
      base + 500,
      base + 1000,
      base + 2500
    ];
  }, [minimumBid]);

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    if (amount < minimumBid) {
      toast.error(`Minimum bid is $${minimumBid.toLocaleString()}`);
      return;
    }

    setIsPlacingBid(true);
    try {
      await onPlaceBid(amount);
      setBidAmount('');
      toast.success('Bid placed successfully!');
    } catch (error) {
      toast.error('Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleQuickBid = async (amount: number) => {
    setIsPlacingBid(true);
    try {
      await onPlaceBid(amount);
      toast.success('Bid placed successfully!');
    } catch (error) {
      toast.error('Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timerSeconds <= 10) return 'text-red-500';
    if (timerSeconds <= 30) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Timer */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Timer className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Auction Timer</h3>
                <p className="text-sm text-slate-400">
                  {isLive ? 'Live Auction' : 'Starting Soon'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onTimerToggle}
                className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-300"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                onClick={onTimerReset}
                className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-300"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center">
            <div className={`text-6xl font-bold ${getTimerColor()} mb-4`}>
              {formatTime(timerSeconds)}
            </div>
            <div className="flex items-center justify-center space-x-2 text-slate-400">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bidding Panel */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Gavel className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Place Bid</h3>
              <p className="text-sm text-slate-400">
                Current High: ${highestBid?.amount?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Bid Type Selection */}
          <div className="flex space-x-2">
            {[
              { type: 'live', label: 'Live Bid', icon: Zap },
              { type: 'pre', label: 'Pre Bid', icon: Clock },
              { type: 'proxy', label: 'Proxy Bid', icon: Star }
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSelectedBidType(type as any)}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl transition-all duration-300 ${
                  selectedBidType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Bid Amount Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bid Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={minimumBid.toLocaleString()}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Minimum: ${minimumBid.toLocaleString()}
              </p>
            </div>

            {/* Quick Bid Buttons */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quick Bid
              </label>
              <div className="grid grid-cols-2 gap-2">
                {quickBidAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickBid(amount)}
                    disabled={isPlacingBid}
                    className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-lg text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Place Bid Button */}
            <button
              onClick={handlePlaceBid}
              disabled={isPlacingBid || !bidAmount || !isConnected}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isPlacingBid ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Gavel className="h-4 w-4" />
              )}
              <span>{isPlacingBid ? 'Placing Bid...' : 'Place Bid'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bid History */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bid History</h3>
              <p className="text-sm text-slate-400">
                {bidHistory.length} bids placed
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {bidHistory.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No bids yet</p>
              </div>
            ) : (
              bidHistory.map((bid) => (
                <div
                  key={bid.id}
                  className={`p-3 rounded-xl border transition-all duration-300 ${
                    bid.isHighest
                      ? 'bg-green-500/10 border-green-500/30'
                      : bid.bidderId === currentUserId
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-slate-700/30 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        bid.isHighest ? 'bg-green-500' : 'bg-slate-600'
                      }`}>
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          ${bid.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400">
                          {bid.bidderName || 'Anonymous'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        {new Date(bid.bidTime).toLocaleTimeString()}
                      </div>
                      {bid.isHighest && (
                        <div className="text-xs text-green-400 font-medium">
                          Highest
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Live Auction Page Component
const LiveAuctionPage: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [auctionData, setAuctionData] = useState<AuctionPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<AuctionCarDetailDto | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // SignalR connection
  const {
    isConnected,
    isConnecting,
    isReconnecting,
    lastError,
    connect,
    disconnect,
    invoke
  } = useSignalR({
    baseUrl: import.meta.env.VITE_SIGNALR_BASE_URL || 'https://localhost:7249',
    token: localStorage.getItem('authToken') || '',
    autoConnect: true,
    events: {
      onBidPlaced: (bid: BidGetDto) => {
        console.log('New bid placed:', bid);
        // Update bid history
        if (auctionData) {
          setAuctionData(prev => prev ? {
            ...prev,
            bidHistory: [bid, ...prev.bidHistory],
            highestBid: bid
          } : null);
        }
      },
      onTimerUpdate: (seconds: number) => {
        setTimerSeconds(seconds);
      },
      onAuctionStateChanged: (state: any) => {
        console.log('Auction state changed:', state);
        if (state.currentCarLotNumber) {
          // Load new car data
          loadCurrentCarData(state.currentCarLotNumber);
        }
      }
    }
  });

  // Load auction data
  const loadAuctionData = useCallback(async () => {
    if (!auctionId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await auctionDataService.initializeAuctionPage(auctionId);
      setAuctionData(data);
      setSelectedCar(data.currentCar);
      setCurrentUserId(data.auction.userId);
      
      // Join SignalR groups
      if (isConnected && invoke) {
        try {
          await invoke('JoinAuction', auctionId);
          if (data.currentCar) {
            await invoke('JoinAuctionCar', data.currentCar.id);
          }
        } catch (signalRErr) {
          console.warn('SignalR group join failed:', signalRErr);
          // Don't fail the entire load if SignalR join fails
        }
      }
    } catch (err) {
      console.error('Error loading auction data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load auction data');
    } finally {
      setLoading(false);
    }
  }, [auctionId, isConnected, invoke]);

  // Load current car data
  const loadCurrentCarData = useCallback(async (lotNumber: number) => {
    if (!auctionData) return;
    
    try {
      const car = auctionData.lotQueue.find(c => c.lotNumber === lotNumber);
      if (car) {
        setSelectedCar(car);
        // Join new car group
        if (isConnected && invoke) {
          try {
            await invoke('JoinAuctionCar', car.id);
          } catch (signalRErr) {
            console.warn('SignalR car group join failed:', signalRErr);
          }
        }
      }
    } catch (err) {
      console.error('Error loading car data:', err);
    }
  }, [auctionData, isConnected, invoke]);

  // Place bid
  const handlePlaceBid = useCallback(async (amount: number) => {
    if (!selectedCar || !isConnected || !invoke) {
      throw new Error('Cannot place bid: No car selected or not connected');
    }

    try {
      await invoke('PlaceLiveBid', selectedCar.id, amount);
    } catch (err) {
      console.error('Error placing bid:', err);
      throw err;
    }
  }, [selectedCar, isConnected, invoke]);

  // Timer controls
  const handleTimerToggle = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleTimerReset = useCallback(() => {
    setTimerSeconds(60);
    setIsPaused(false);
  }, []);

  // Effects
  useEffect(() => {
    loadAuctionData();
  }, [loadAuctionData]);

  useEffect(() => {
    if (!isPaused && timerSeconds > 0) {
      const timer = setInterval(() => {
        setTimerSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, timerSeconds]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Auction...</h2>
          <p className="text-slate-400">Please wait while we prepare the live auction</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Auction</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={loadAuctionData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-all duration-300"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/all-auctions')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-xl transition-all duration-300"
            >
              Back to Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!auctionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Auction Data</h2>
          <p className="text-slate-400 mb-6">Unable to load auction information</p>
          <button
            onClick={() => navigate('/all-auctions')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-all duration-300"
          >
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/60 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/all-auctions')}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{auctionData.auction.name}</h1>
              <p className="text-slate-400">
                {auctionData.auction.isLive ? 'Live Auction' : 'Starting Soon'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-slate-300">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-300"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Car Display Panel */}
          <div className="lg:col-span-2">
            <CarDisplayPanel
              currentCar={selectedCar}
              carDetails={auctionData.carDetails}
              lotQueue={auctionData.lotQueue}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onSelectCar={setSelectedCar}
            />
          </div>

          {/* Bid Panel */}
          <div className="lg:col-span-1">
            <BidPanel
              currentCar={selectedCar}
              highestBid={auctionData.highestBid}
              bidHistory={auctionData.bidHistory}
              timerSeconds={timerSeconds}
              isLive={auctionData.auction.isLive}
              isPaused={isPaused}
              isConnected={isConnected}
              onPlaceBid={handlePlaceBid}
              onTimerToggle={handleTimerToggle}
              onTimerReset={handleTimerReset}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveAuctionPage;
