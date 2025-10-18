/**
 * LiveAuctionPage - REFACTORED VERSION
 * 
 * 🎯 Məqsəd: Server-driven, Zustand-əsaslı, mərkəzləşdirilmiş state management
 * 
 * Əsas Prinsiplər:
 * 1. ❌ Lokal useState yoxdur - bütün state auctionStore-dadır
 * 2. ✅ useAuctionStore hook-u ilə store-dan reaktiv oxuma
 * 3. ✅ SignalR event-ləri mərkəzi useSignalREvents hook-unda
 * 4. ✅ Timer server-driven - client-side hesablama yoxdur
 * 5. ✅ "Dumb component" - yalnız göstəriş və bid placement
 */

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Car,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Store & Hooks
import { useAuctionStore } from '../stores/auctionStore';
import { useBidHub } from '../hooks/useBidHub';
import { useAuctionHub } from '../hooks/useAuctionHub';
import { useBidPlacement } from '../hooks/useBidPlacement';

// API & Services
import { apiClient } from '../lib/api';
import { getEnumLabel } from '../services/enumService';

// Components
import DynamicBidButton from '../components/DynamicBidButton';

// Types
import { AuctionCarGetDto } from '../types/api';

// ========================================
// HELPER COMPONENTS
// ========================================

interface UpcomingVehicleImageProps {
  lot: AuctionCarGetDto;
  getImageUrl: (url: string) => string;
}

const UpcomingVehicleImage: React.FC<UpcomingVehicleImageProps> = ({ lot, getImageUrl }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const imageUrl = lot.carImage || (lot as any).car?.carImage || '';
        if (imageUrl) {
          setImageSrc(getImageUrl(imageUrl));
        } else {
          setHasError(true);
        }
      } catch (err) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [lot, getImageUrl]);

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-slate-700/50 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-slate-500 text-xs">Loading...</div>
      </div>
    );
  }

  if (hasError || !imageSrc) {
    return (
      <div className="w-full h-32 bg-slate-700/50 rounded-lg flex items-center justify-center">
        <Car className="h-12 w-12 text-slate-600" />
      </div>
    );
  }

  return (
    <img 
      src={imageSrc} 
      alt={`${lot.carMake} ${lot.carModel}`}
      className="w-full h-32 object-cover rounded-lg"
      onError={() => setHasError(true)}
    />
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const LiveAuctionPage: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();

  // ========================================
  // ZUSTAND STORE (Single Source of Truth)
  // ========================================
  
  // Auction Info
  const auction = useAuctionStore(state => state.auction);
  const isLive = useAuctionStore(state => state.isLive);
  
  // Current Car
  const currentCar = useAuctionStore(state => state.currentCar);
  const currentCarId = useAuctionStore(state => state.currentCarId);
  
  // Bidding
  const currentPrice = useAuctionStore(state => state.currentPrice);
  const highestBid = useAuctionStore(state => state.highestBid);
  const bidHistory = useAuctionStore(state => state.bidHistory);
  
  // Timer (Server-Authoritative)
  const remainingSeconds = useAuctionStore(state => state.remainingSeconds);
  
  // Stats
  const totalBids = useAuctionStore(state => state.totalBids);
  const uniqueBidders = useAuctionStore(state => state.uniqueBidders);
  
  // Connection
  const isConnected = useAuctionStore(state => state.isConnected);

  // Actions
  const setAuctionId = useAuctionStore(state => state.setAuctionId);
  const setAuction = useAuctionStore(state => state.setAuction);
  const setCurrentCar = useAuctionStore(state => state.setCurrentCar);
  const setBidHistory = useAuctionStore(state => state.setBidHistory);
  const setConnectionStatus = useAuctionStore(state => state.setConnectionStatus);
  const reset = useAuctionStore(state => state.reset);

  // ========================================
  // LOCAL UI STATE (Non-Critical)
  // ========================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lotQueue, setLotQueue] = useState<AuctionCarGetDto[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ========================================
  // SIGNALR CONNECTIONS
  // ========================================

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249';
  const authToken = localStorage.getItem('authToken') || '';

  // AuctionHub connection (Timer, Auction lifecycle)
  const {
    isConnected: auctionHubConnected,
    connectionState: auctionHubState
  } = useAuctionHub({
    baseUrl: API_BASE_URL,
    token: authToken,
    auctionId: auctionId || null
  });

  // BidHub connection (Bidding, Real-time bid updates)
  const {
    isConnected: bidHubConnected,
    placeLiveBid,
    connectionState: bidHubState
  } = useBidHub({
    baseUrl: API_BASE_URL,
    token: authToken,
    auctionCarId: currentCarId,
    onNewLiveBid: (data) => {
      console.log('💰 New bid received:', data);
      // Store already updated by hook
    },
    onHighestBidUpdated: (data) => {
      console.log('🏆 Highest bid updated:', data);
      // Store already updated by hook
    },
    onBidStatsUpdated: (data) => {
      console.log('📊 Bid stats updated:', data);
      // Update stats in store if needed
    }
  });

  // Bid placement hook
  const { isPlacing, placeBid } = useBidPlacement({
    placeLiveBid
  });

  // Sync connection status to store
  useEffect(() => {
    setConnectionStatus(auctionHubConnected && bidHubConnected);
  }, [auctionHubConnected, bidHubConnected, setConnectionStatus]);

  // ========================================
  // INITIAL DATA LOADING
  // ========================================

  useEffect(() => {
    const loadInitialData = async () => {
      if (!auctionId) {
        setError('Auction ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Loading auction data for:', auctionId);
        }

        // Set auction ID in store
        setAuctionId(auctionId);

        // Step 1: Get auction details
        const auctionResponse = await apiClient.getAuction(auctionId);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Auction loaded:', auctionResponse);
        }
        setAuction(auctionResponse);

        // Step 2: Get lot queue
        const lotQueueResponse = await apiClient.getAuctionCars(auctionId);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Lot queue loaded:', lotQueueResponse.length, 'cars');
        }
        setLotQueue(lotQueueResponse);

        // Step 3: Get current/active car (with full details and photos)
        let activeCar = null;
        
        try {
          // Strategy 1: Try to get active car
          activeCar = await apiClient.getActiveAuctionCar(auctionId);
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Active car loaded:', activeCar);
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ No active car, loading first from queue');
          }
          
          // Strategy 2 (Fallback): Load first car from queue
          if (lotQueueResponse.length > 0) {
            const firstLot = lotQueueResponse[0];
            activeCar = await apiClient.getAuctionCar(firstLot.id);
            
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Loaded first car from queue:', firstLot.lotNumber);
            }
          }
        }
        
        // Step 3.1: Load full car details and photos (if we have a car)
        if (activeCar && activeCar.car?.id) {
          try {
            // Load full car details
            const fullCarData = await apiClient.getCar(activeCar.car.id);
            activeCar.car = { ...activeCar.car, ...fullCarData };
            
            // Load car photos
            const photos = await apiClient.getCarPhotos(activeCar.car.id);
            if (photos && photos.length > 0) {
              (activeCar.car as any).photoUrls = photos;
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Car photos loaded:', photos.length);
              }
            }
          } catch (carErr) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Failed to load full car details:', carErr);
            }
          }
        }

        // Step 4: Load bid history and highest bid for current car
        if (activeCar) {
          try {
            const [bidHistoryResp, highestBidResp] = await Promise.all([
              apiClient.getRecentBids(activeCar.id, 20).catch(() => []),
              apiClient.getHighestBid(activeCar.id).catch(() => null)
            ]);
            
            // Process bid history
            const bids = Array.isArray(bidHistoryResp) 
              ? bidHistoryResp 
              : (bidHistoryResp as any)?.data || [];
            
            setBidHistory(bids);
            
            // Set highest bid if available
            if (highestBidResp) {
              const highestBid = (highestBidResp as any)?.data || highestBidResp;
              if (highestBid && highestBid.amount) {
                const updateHighestBid = useAuctionStore.getState().updateHighestBid;
                updateHighestBid(highestBid);
              }
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Bid history loaded:', bids.length, 'bids');
            }
          } catch (bidErr) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Failed to load bid history:', bidErr);
            }
          }
          
          // Set current car in store
          setCurrentCar(activeCar);
          
          // Success toast
          toast.success(`📍 Viewing Lot #${activeCar.lotNumber || '?'}`, {
            id: 'car-loaded',
            duration: 3000
          });
        }

        // SignalR groups are automatically joined by hooks
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Initial data loaded, SignalR connections will handle groups');
        }

        setLoading(false);
      } catch (err: any) {
        console.error('❌ Failed to load auction data:', err);
        setError(err.message || 'Failed to load auction');
        setLoading(false);
        
        toast.error(`Failed to load auction: ${err.message || 'Unknown error'}`, {
          id: 'load-error',
          duration: 5000
        });
      }
    };

    loadInitialData();

    // Cleanup
    return () => {
      console.log('🧹 Component unmounting, resetting store');
      reset();
    };
  }, [auctionId, setAuctionId, setAuction, setCurrentCar, setBidHistory, reset]);

  // ========================================
  // BID PLACEMENT
  // ========================================

  const handlePlaceBid = useCallback(async (amount: number) => {
    if (!currentCar) {
      toast.error('No active vehicle to bid on');
      return;
    }

    // useBidPlacement hook handles all validation and logic
    await placeBid(currentCar.id, amount);
  }, [currentCar, placeBid]);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const getCarDisplayName = () => {
    if (!currentCar) return 'No Vehicle';
    if (currentCar.car) {
      return `${currentCar.car.year || ''} ${currentCar.car.make || ''} ${currentCar.car.model || ''}`.trim();
    }
    return 'Vehicle';
  };

  const getImageUrl = useCallback((url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249';
    return `${baseUrl}/${url.replace(/^\//, '')}`;
  }, []);

  const carImages = useMemo(() => {
    if (!currentCar?.car) return [];
    const photoUrls = (currentCar.car as any).photoUrls || [];
    const carImage = (currentCar as any).carImage;
    return photoUrls.length > 0 ? photoUrls : [carImage].filter(Boolean);
  }, [currentCar]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % carImages.length);
  }, [carImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + carImages.length) % carImages.length);
  }, [carImages.length]);

  // Calculate minimum bid
  const minimumBid = useMemo(() => {
    const currentHigh = highestBid?.amount || currentCar?.currentPrice || currentCar?.minPreBid || 0;
    const increment = auction?.minBidIncrement || 100;
    return currentHigh + increment;
  }, [highestBid, currentCar, auction]);

  // ========================================
  // RENDER: LOADING & ERROR STATES
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading auction...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <div className="text-white text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/auctions')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================

  const currentHigh = currentPrice || 0;
  const carDisplayName = getCarDisplayName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* TOP HEADER */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/auctions')}
                className="text-slate-300 hover:text-white transition-colors"
          >
                <ChevronLeft className="h-6 w-6" />
          </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{auction?.name || 'Live Auction'}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
                    <span className="text-sm text-slate-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
                  </div>
                  <span className="text-slate-600">•</span>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    isLive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {isLive ? '🔴 LIVE' : '⏸️ PAUSED'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-slate-400">Total Bids</div>
                <div className="text-2xl font-bold text-white">{totalBids}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">Bidders</div>
                <div className="text-2xl font-bold text-white">{uniqueBidders}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - UPCOMING VEHICLES */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Car className="h-5 w-5 mr-2 text-blue-400" />
                Upcoming Vehicles ({lotQueue.length})
              </h3>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {lotQueue.map((lot, index) => {
                  const isCurrentLot = lot.id === currentCarId;
                  return (
                    <div
                      key={lot.id}
                      className={`p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                        isCurrentLot
                          ? 'bg-blue-500/20 border-2 border-blue-400'
                          : 'bg-slate-700/30 border border-white/10 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`text-xl font-bold ${
                          isCurrentLot ? 'text-blue-400' : 'text-slate-400'
                        }`}>
                          #{lot.lotNumber || index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold truncate">
                            {lot.carYear} {lot.carMake} {lot.carModel}
                          </div>
                          <div className="text-xs text-slate-400">
                            {lot.bidCount || 0} bids • ${(lot.currentPrice || 0).toLocaleString()}
                          </div>
          </div>
        </div>
                      
                      <UpcomingVehicleImage lot={lot} getImageUrl={getImageUrl} />
                      
                      {isCurrentLot && (
                        <div className="mt-2 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-400">
                            🔴 CURRENTLY ACTIVE
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER - VEHICLE DISPLAY */}
          <div className="lg:col-span-5 space-y-6">
            {currentCar ? (
              <>
                {/* Vehicle Images */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                  <div className="relative aspect-video bg-slate-900">
                    {carImages.length > 0 ? (
                      <>
                        <img
                          src={getImageUrl(carImages[currentImageIndex])}
                          alt={carDisplayName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        
                        {carImages.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>
                            
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                              {carImages.map((_img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                        }`}
                      />
                    ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Car className="h-24 w-24 text-slate-700" />
                  </div>
                )}
              </div>
            </div>

                {/* Vehicle Info */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-black text-white">{carDisplayName}</h2>
                    <div className="text-2xl font-bold text-blue-400">Lot #{currentCar.lotNumber}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                      <div className="text-sm text-slate-400">VIN</div>
                      <div className="text-white font-semibold">{currentCar.car?.vin || 'N/A'}</div>
                </div>
                <div>
                      <div className="text-sm text-slate-400">Odometer</div>
                      <div className="text-white font-semibold">
                        {currentCar.car?.odometer ? `${currentCar.car.odometer.toLocaleString()} mi` : 'N/A'}
                      </div>
                </div>
                <div>
                      <div className="text-sm text-slate-400">Condition</div>
                      <div className="text-white font-semibold">
                        {currentCar.car?.condition ? getEnumLabel('Condition', currentCar.car.condition) : 'N/A'}
                      </div>
                </div>
                <div>
                      <div className="text-sm text-slate-400">Damage</div>
                      <div className="text-white font-semibold">
                        {currentCar.car?.damageType ? getEnumLabel('DamageType', currentCar.car.damageType) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
              </>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <Car className="h-24 w-24 text-slate-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">No Active Vehicle</h3>
                <p className="text-slate-400">Waiting for auction to start...</p>
              </div>
            )}
            </div>

          {/* RIGHT SIDEBAR - BIDDING */}
          <div className="lg:col-span-4 space-y-6">

            {/* Current Price */}
            <div className="bg-gradient-to-br from-slate-800/50 to-indigo-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Current High Bid</div>
              <div className="text-5xl font-black text-white mb-4">
                ${currentHigh.toLocaleString()}
              </div>
              {highestBid && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>by {highestBid.user?.firstName || 'Bidder'}</span>
                  {highestBid.timestamp && (
                    <>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      <span>{new Date(highestBid.timestamp).toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              )}
              {!highestBid && currentCar && (
                <div className="text-sm text-slate-400">
                  No bids yet. Minimum: ${(currentCar.minPreBid || 0).toLocaleString()}
                </div>
              )}
            </div>

            {/* Dynamic Bid Button */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <DynamicBidButton
                nextBidAmount={minimumBid}
                remainingSeconds={remainingSeconds}
                timerDuration={auction?.timerSeconds || 60}
                isDisabled={!currentCar || !isLive || !isConnected}
                isPlacing={isPlacing}
                onBid={handlePlaceBid}
                currencySymbol="$"
              />
              
              {/* Status Messages */}
              {!isConnected && (
                <div className="px-6 pb-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                    <WifiOff className="h-5 w-5 text-red-400 mx-auto mb-1" />
                    <p className="text-sm text-red-400 font-medium">Connection Lost</p>
                    <p className="text-xs text-red-300 mt-1">
                      AuctionHub: {auctionHubState} | BidHub: {bidHubState}
                    </p>
                  <button
                      onClick={() => window.location.reload()}
                      className="text-xs text-red-400 underline mt-2"
                    >
                      Refresh Page
                  </button>
              </div>
            </div>
              )}
            </div>

            {/* Bid History */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    <span className="font-bold text-white">Bid History</span>
                </div>
                  <span className="text-sm text-slate-400">{bidHistory.length} bids</span>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                {bidHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No bids yet. Be the first!</p>
            </div>
                ) : (
                  <div className="space-y-2">
                    {bidHistory.map((bid, index) => {
                      const isHighest = index === 0;
                      return (
                  <div
                    key={bid.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isHighest
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-slate-700/30 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-slate-400" />
                              <span className="text-white font-semibold">
                                {bid.user?.firstName || 'Anonymous'}
                              </span>
                              {isHighest && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                                  LEADING
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">
                                ${bid.amount.toLocaleString()}
                              </div>
                              {bid.timestamp && (
                                <div className="text-xs text-slate-400">
                                  {new Date(bid.timestamp).toLocaleTimeString()}
                                </div>
                              )}
                            </div>
                          </div>
                    </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </div>
  );
};

export default LiveAuctionPage;

