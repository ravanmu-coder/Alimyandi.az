import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Timer,
  Car,
  Gavel,
  Wifi,
  WifiOff,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSignalR } from '../hooks/useSignalR';
import { apiClient } from '../lib/api';
import { getEnumLabel } from '../services/enumService';
import { 
  AuctionDetailDto, 
  AuctionCarDetailDto, 
  AuctionCarGetDto,
  BidGetDto
} from '../types/api';

// ========================================
// TYPES & INTERFACES
// ========================================

// UpcomingVehicleImage component for better image loading in upcoming vehicle cards
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

      console.log('🖼️ Loading image for upcoming vehicle lot', lot.lotNumber, ':', {
        carImage: lot.carImage,
        carId: lot.carId,
        make: lot.carMake,
        model: lot.carModel
      });

      // Priority 1: Use lot.carImage if available
      if (lot.carImage) {
        console.log('🖼️ Upcoming: Using lot.carImage for', lot.lotNumber);
        setImageSrc(getImageUrl(lot.carImage));
        setIsLoading(false);
        return;
      }

      // Priority 2: Try to load from car details if carId is available
      if (lot.carId) {
        try {
          console.log('🖼️ Upcoming: Loading car details for lot', lot.lotNumber);
          const carDetails = await apiClient.getCar(lot.carId);
          
          // Try to get photos from dedicated endpoint first
          try {
            const photos = await apiClient.getCarPhotos(lot.carId);
            if (photos && photos.length > 0) {
              console.log('🖼️ Upcoming: Using photos from endpoint for lot', lot.lotNumber, '- found', photos.length, 'photos');
              setImageSrc(getImageUrl(photos[0]));
              setIsLoading(false);
              return;
            }
          } catch (photoError) {
            console.warn('🖼️ Upcoming: Photos endpoint failed for lot', lot.lotNumber);
          }

          // Fallback to car details photoUrls
          if ((carDetails as any).photoUrls && (carDetails as any).photoUrls.length > 0) {
            console.log('🖼️ Upcoming: Using car.photoUrls for lot', lot.lotNumber);
            setImageSrc(getImageUrl((carDetails as any).photoUrls[0]));
            setIsLoading(false);
            return;
          }

          // Fallback to car details imageUrls
          if (carDetails.imageUrls && carDetails.imageUrls.length > 0) {
            console.log('🖼️ Upcoming: Using car.imageUrls for lot', lot.lotNumber);
            setImageSrc(getImageUrl(carDetails.imageUrls[0]));
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('🖼️ Upcoming: Failed to load car details for lot', lot.lotNumber, error);
        }
      }

      // Fallback: Use placeholder
      console.log('🖼️ Upcoming: Using placeholder for lot', lot.lotNumber);
      setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzc0MTUxIi8+Cjxzdmcgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iODUiIHk9IjYwIj4KPHBhdGggZD0iTTIxIDE5VjE5QzIxIDIwLjEgMjAuMSAyMSAxOSAyMUg1QzMuOSAyMSAzIDIwLjEgMyAxOVY1QzMgMy45IDMuOSAzIDUgM0gxNEwxNiA1SDE5QzIwLjEgNSAyMSA1LjkgMjEgN1YxOVoiIHN0cm9rZT0iIzlDQTRBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMyIgcj0iMyIgc3Ryb2tlPSIjOUNBNEFGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPHN2Zz4=');
      setIsLoading(false);
    };

    loadImage();
  }, [lot.carImage, lot.carId, lot.lotNumber, getImageUrl]);

  const handleImageError = () => {
    if (!hasError && !imageSrc.startsWith('data:image/svg+xml')) {
      console.error('🖼️ Upcoming: Image failed to load for lot', lot.lotNumber);
      setHasError(true);
      setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzc0MTUxIi8+Cjxzdmcgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iODUiIHk9IjYwIj4KPHBhdGggZD0iTTIxIDE5VjE5QzIxIDIwLjEgMjAuMSAyMSAxOSAyMUg1QzMuOSAyMSAzIDIwLjEgMyAxOVY1QzMgMy45IDMuOSAzIDUgM0gxNEwxNiA1SDE5QzIwLjEgNSAyMSA1LjkgMjEgN1YxOVoiIHN0cm9rZT0iIzlDQTRBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMyIgcj0iMyIgc3Ryb2tlPSIjOUNBNEFGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPHN2Zz4=');
    }
  };

  const handleImageLoad = () => {
    console.log('🖼️ Upcoming: Image loaded successfully for lot', lot.lotNumber);
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={`${lot.carMake} ${lot.carModel}`}
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

interface LiveAuctionState {
  auction: AuctionDetailDto | null;
  currentCar: AuctionCarDetailDto | null;
  activeLot: AuctionCarGetDto | null;
  lotQueue: AuctionCarGetDto[];
  bidHistory: BidGetDto[];
  highestBid: BidGetDto | null;
  timerSeconds: number;
  isLive: boolean;
  auctionCompleted: boolean;
  stats: {
    totalBids: number;
    uniqueBidders: number;
    totalCars: number;
    soldCars: number;
  };
}

// ========================================
// MAIN COMPONENT
// ========================================

const LiveAuctionPage: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [state, setState] = useState<LiveAuctionState>({
    auction: null,
    currentCar: null,
    activeLot: null,
    lotQueue: [],
    bidHistory: [],
    highestBid: null,
    timerSeconds: 10,
    isLive: false,
    auctionCompleted: false,
    stats: {
      totalBids: 0,
      uniqueBidders: 0,
      totalCars: 0,
      soldCars: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [viewDetailsMode, setViewDetailsMode] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // SIGNALR CONNECTION
  // ========================================

  const {
    isConnected,
    isConnecting,
    connectionState,
    lastError,
    joinAuction,
    joinAuctionCar,
    placeLiveBid
  } = useSignalR({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249',
    token: localStorage.getItem('authToken') || '',
    autoConnect: true,
    events: {

      // Car moved to next lot (from AuctionService.AdvanceToNextCarAsync)
      onCarMoved: (data: any) => {
        console.log('🚗 Car Moved (AuctionService):', data);
        if (data.nextCarId) {
          // Re-join the new car group to get server-authoritative snapshot
          joinAuctionCar(data.nextCarId).then(async () => {
            console.log('✅ Joined new car group after move');
            
            // Get fresh snapshot from AuctionCarService
            try {
              const newCarSnapshot = await apiClient.getAuctionCar(data.nextCarId);
              if (newCarSnapshot) {
                // Use server's exact timer state - no restart
                const serverTimer = (newCarSnapshot as any).remainingTimeSeconds || 
                                  (newCarSnapshot as any).secondsRemaining || 0;
                
                setState(prev => ({
                  ...prev,
                  currentCar: newCarSnapshot,
                  activeLot: prev.lotQueue.find(lot => lot.id === newCarSnapshot.id) || null,
                  isLive: newCarSnapshot.isActive,
                  timerSeconds: serverTimer // Server-authoritative timer
                }));
                
                toast.success(`🔄 Moved to Lot #${newCarSnapshot.lotNumber}`, {
                  duration: 4000
                });
              }
            } catch (err) {
              console.error('❌ Failed to get new car snapshot:', err);
            }
          }).catch(err => {
            console.error('❌ Failed to join new car group:', err);
          });
        }
      },

      // Auction started (server-authoritative like Copart)
      onAuctionStarted: (data: any) => {
        console.log('🚀 [REAL-TIME] Auction Started (Server-Authoritative):', data);
        
        // Server started auction - all users should see this immediately
        if (data.auctionCarId || data.snapshot) {
          const carId = data.auctionCarId || data.snapshot?.auctionCarId;
          const snapshot = data.snapshot;
          
          if (carId) {
            // Join the started car group immediately
            joinAuctionCar(carId).then(async () => {
              console.log('✅ Joined live auction car group:', carId);
              
              try {
                // Get server-authoritative snapshot
                const serverSnapshot = snapshot || await apiClient.getAuctionCar(carId);
                
                if (serverSnapshot) {
                  // Update to server state immediately - no timer restart
                  setState(prev => ({
                    ...prev,
                    currentCar: serverSnapshot,
                    activeLot: prev.lotQueue.find(lot => lot.id === serverSnapshot.id) || null,
                    isLive: true,
                    // Use server's current timer - don't restart
                    timerSeconds: (serverSnapshot as any).remainingTimeSeconds || 
                                 (serverSnapshot as any).secondsRemaining || 
                                 data.timerSeconds || 10,
                    auctionCompleted: false,
                    showCompletedModal: false,
                    viewDetailsMode: false
                  }));
                  
                  // Show real-time notification (Copart-style)
                  showAuctionStateNotification(
                    `LIVE: Lot #${serverSnapshot.lotNumber} is now active!`,
                    'live'
                  );
                  
                  // Play sound notification if available
                  try {
                    playBidSound();
                  } catch (err) {
                    // Silent fail
                  }
                }
              } catch (err) {
                console.error('❌ Failed to get auction snapshot:', err);
              }
            }).catch(err => {
              console.error('❌ Failed to join auction car group:', err);
            });
          }
        }
      },

      // Timer tick - server authoritative timer (EVERY SECOND)
      onTimerTick: (data: any) => {
        console.log('⏰ [REAL-TIME] Timer Tick:', data.remainingSeconds + 's');
        
        // Always update timer regardless of car ID - server is authoritative
        setState(prev => ({
          ...prev,
          timerSeconds: data.remainingSeconds
        }));
        
        // Stop any client-side timer since server sends every second
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      },

      // Timer reset - when new bid placed
      onAuctionTimerReset: (data: any) => {
        console.log('🔄 [REAL-TIME] Timer Reset:', data.newTimerSeconds + 's');
        
        // Always update timer - server is authoritative
        setState(prev => ({
          ...prev,
          timerSeconds: data.newTimerSeconds || 10
        }));
        
        // Stop any client-side timer since server will send ticks
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        toast('Timer reset!', { icon: '⏰', duration: 2000 });
      },

      // New live bid
      onNewLiveBid: (data: any) => {
        console.log('💰 New Live Bid:', data);
        if (data.bid) {
          handleNewBid(data.bid, true); // Assume new live bid is highest
        }
      },

      // Pre-bid placed
      onPreBidPlaced: (data: any) => {
        console.log('📝 Pre-Bid Placed:', data);
        if (data.bid) {
          handleNewBid(data.bid, false);
        }
      },
      
      // Highest bid updated
      onHighestBidUpdated: (data: any) => {
        console.log('🏆 Highest Bid Updated:', data);
        if (data.auctionCarId === state.currentCar?.id && data.highestBid) {
          setState(prev => ({
            ...prev,
            highestBid: data.highestBid,
            currentCar: prev.currentCar ? {
              ...prev.currentCar,
              currentPrice: data.highestBid.amount
            } : null
          }));
        }
      },

      // Price updated
      onPriceUpdated: (data: any) => {
        console.log('💲 Price Updated:', data);
        if (data.auctionCarId === state.currentCar?.id) {
          setState(prev => ({
            ...prev,
            currentCar: prev.currentCar ? {
              ...prev.currentCar,
              currentPrice: data.newPrice
            } : null
          }));
        }
      },

      // Auction stopped (server-authoritative)
      onAuctionStopped: (data: any) => {
        console.log('⏸️ [REAL-TIME] Auction Stopped (Server-Authoritative):', data);
        
        // Server stopped auction - all users should see this
        setState(prev => ({
          ...prev,
          isLive: false,
          timerSeconds: 0
        }));
        
        showAuctionStateNotification(
          'Auction paused by auctioneer',
          'paused'
        );
      },

      // Auction ended (server-authoritative)
      onAuctionEnded: (data: any) => {
        console.log('🏁 [REAL-TIME] Auction Ended (Server-Authoritative):', data);
        
        // Server ended auction - show completed modal BUT KEEP CONNECTION
        setState(prev => ({
          ...prev,
          auctionCompleted: true,
          currentCar: null,
          activeLot: null,
          isLive: false,
          timerSeconds: 0
        }));
        
        setShowCompletedModal(true);
        
        showAuctionStateNotification(
          'Auction completed - Connection maintained for updates',
          'completed'
        );
        
        // IMPORTANT: Keep SignalR connection alive for future auction starts
        console.log('✅ Maintaining SignalR connection for future auctions');
      },
      
      // Connection state
      onConnectionStateChanged: (state, error) => {
        console.log('🔌 Connection State Changed:', {
          state,
          error,
          isConnected: state === 'Connected',
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          toast.error(`Connection Error: ${error}`);
        }
        
        // If we just connected/reconnected, sync state after a short delay
        if (state === 'Connected') {
          console.log('🔄 Just connected - syncing state in 2 seconds...');
          setTimeout(async () => {
            try {
              // Re-sync with server state after reconnection
              if (!auctionId) return;
              
              const auctionStatus = await apiClient.getAuctionStatus(auctionId);
              console.log('🔄 Post-reconnect sync:', auctionStatus);
              
              // Check current component state and sync if needed
              if (auctionStatus.allFinished) {
                setState(prev => {
                  if (!prev.auctionCompleted) {
                    console.log('🏁 Post-reconnect: Auction completed');
                    setShowCompletedModal(true);
                    return {
                      ...prev,
                      auctionCompleted: true,
                      currentCar: null,
                      activeLot: null,
                      isLive: false
                    };
                  }
                  return prev;
                });
              } else if (auctionStatus.activeCarId) {
                // Check if we need to sync to a different active car
                const needsSync = await new Promise<boolean>((resolve) => {
                  setState(prev => {
                    const needsUpdate = !prev.currentCar || prev.currentCar.id !== auctionStatus.activeCarId;
                    resolve(needsUpdate);
                    return prev;
                  });
                });
                
                if (needsSync) {
                  console.log('🚀 Post-reconnect: Active car changed, syncing...');
                  // Join the new active car
                  await joinAuctionCar(auctionStatus.activeCarId);
                  const activeCarSnapshot = await apiClient.getAuctionCar(auctionStatus.activeCarId);
                  
                  if (activeCarSnapshot) {
                    // Load proper car details and images using EXACT CarDetail.tsx logic
                    let updatedSnapshot = { ...activeCarSnapshot };
                    
                    const carId = activeCarSnapshot.car?.id || activeCarSnapshot.carId;
                    if (carId) {
                      // STEP 1: Load full car details (like CarDetail.tsx)
                      try {
                        console.log('🚗 CarDetail logic: Loading full car details for reconnected car:', carId);
                        const fullCarData = await apiClient.getCar(carId);
                        console.log('🚗 CarDetail logic: Full car details loaded for reconnected car:', fullCarData);
                        
                        if (updatedSnapshot.car) {
                          updatedSnapshot.car = { ...updatedSnapshot.car, ...fullCarData };
                        } else {
                          updatedSnapshot.car = fullCarData;
                        }
                        
                        console.log('✅ CarDetail logic: Updated reconnected car with full details');
                      } catch (carError) {
                        console.warn('⚠️ CarDetail logic: Failed to load full car details for reconnected car:', carError);
                      }
                      
                      // STEP 2: Load car photos (like CarDetail.tsx)
                      try {
                        console.log('🖼️ CarDetail logic: Loading photos for reconnected car:', carId);
                        const photos = await apiClient.getCarPhotos(carId);
                        console.log('🖼️ CarDetail logic: Photos loaded for reconnected car:', photos?.length || 0);
                        
                        if (photos && photos.length > 0) {
                          if (updatedSnapshot.car) {
                            updatedSnapshot.car = { ...updatedSnapshot.car, photoUrls: photos } as any;
                          } else {
                            (updatedSnapshot as any).photoUrls = photos;
                          }
                          console.log('✅ CarDetail logic: Updated reconnected car photos');
                        }
                      } catch (photosError) {
                        console.warn('⚠️ CarDetail logic: Photos endpoint failed for reconnected car:', photosError);
                        if (photosError instanceof Error && photosError.message.includes('404')) {
                          console.warn(`🖼️ CarDetail logic: Car photos 404 for reconnected carId: ${carId}`);
                        }
                      }
                    }
                    
                    const serverTimer = (activeCarSnapshot as any).remainingTimeSeconds || 
                                      (activeCarSnapshot as any).secondsRemaining || 0;
                    
                    setState(prev => ({
                      ...prev,
                      currentCar: updatedSnapshot, // Use updated snapshot with proper photos
                      activeLot: prev.lotQueue.find(lot => lot.id === activeCarSnapshot.id) || null,
                      isLive: activeCarSnapshot.isActive,
                      timerSeconds: serverTimer,
                      auctionCompleted: false,
                      showCompletedModal: false,
                      viewDetailsMode: false
                    }));
                    
                    toast.success(`🔄 Reconnected to lot: #${activeCarSnapshot.lotNumber}`, {
                      duration: 3000
                    });
                  }
                }
              }
            } catch (syncError) {
              console.error('❌ Post-reconnect sync failed:', syncError);
            }
          }, 2000);
        }
      }
    }
  });

  // Debug connection state
  useEffect(() => {
    const token = localStorage.getItem('authToken') || 'anonymous';
    const instanceKey = `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249'}_${token.substring(0, 10)}`;
    
    console.log('🔍 SignalR Debug Info:', {
      instanceKey,
      isConnected,
      isConnecting,
      connectionState,
      lastError,
      timestamp: new Date().toISOString(),
      userToken: token.substring(0, 20) + '...'
    });
  }, [isConnected, isConnecting, connectionState, lastError]);

  // Real-time auction state notification (like Copart) - moved here for dependency order
  const showAuctionStateNotification = useCallback((message: string, type: 'live' | 'paused' | 'completed') => {
    const icons = {
      live: '🔴',
      paused: '⏸️', 
      completed: '🏁'
    };
    
    // Show prominent notification
    toast(message, {
      icon: icons[type],
      duration: type === 'live' ? 8000 : 6000,
      style: {
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600'
      }
    });
  }, []);

  // Handle whole auction completed (moved here for dependency order)
  const handleAuctionCompleted = useCallback(() => {
    console.log('🏁 Whole auction completed - KEEPING CONNECTION ALIVE');
    
    setState(prev => ({
      ...prev,
      currentCar: null,
      activeLot: null,
      isLive: false,
      timerSeconds: 0,
      auctionCompleted: true
    }));

    setShowCompletedModal(true);

    // Show notification but emphasize connection is maintained
    showAuctionStateNotification(
      'All auctions completed - Connection active for new auctions',
      'completed'
    );
    
    // CRITICAL: Do NOT disconnect SignalR - keep listening for new auctions
    console.log('✅ SignalR connection maintained for future auction notifications');
  }, [showAuctionStateNotification]);

  // Helper function to load car data with proper image loading (EXACT CarDetail.tsx logic)
  const loadCarData = useCallback(async (carDetails: any, serverState?: any, lot?: AuctionCarGetDto) => {
    console.log('🖼️ Loading car data with images for:', carDetails.id);
    
    // STEP 1: First load the complete car details using getCar (like CarDetail.tsx)
    let finalCarDetails = { ...carDetails };
    let fullCarData = null;
    
    const carId = carDetails.car?.id || carDetails.carId;
    if (carId) {
      try {
        console.log('🚗 Loading full car details from getCar endpoint for:', carId);
        fullCarData = await apiClient.getCar(carId);
        console.log('🚗 Full car details loaded:', fullCarData);
        
        // Update car object with full details
        if (finalCarDetails.car) {
          finalCarDetails.car = { ...finalCarDetails.car, ...fullCarData };
        } else {
          finalCarDetails.car = fullCarData;
        }
        
        console.log('✅ Updated car with full details from getCar');
      } catch (carError) {
        console.warn('⚠️ Failed to load full car details, using existing:', carError);
      }
    }
    
    // STEP 2: Load car photos using EXACT CarDetail.tsx logic
    if (carId) {
      try {
        console.log('🖼️ CarDetail logic: Loading photos from dedicated endpoint for car:', carId);
        const photos = await apiClient.getCarPhotos(carId);
        console.log('🖼️ CarDetail logic: Photos loaded from endpoint:', photos?.length || 0);
        
        if (photos && photos.length > 0) {
          // Update car photos EXACTLY like CarDetail.tsx
          if (finalCarDetails.car) {
            finalCarDetails.car = { ...finalCarDetails.car, photoUrls: photos };
          } else {
            finalCarDetails.photoUrls = photos;
          }
          console.log('✅ CarDetail logic: Updated car photos from dedicated endpoint');
        }
      } catch (photosError) {
        console.warn('⚠️ CarDetail logic: Photos endpoint failed, using car.photoUrls fallback:', photosError);
        if (photosError instanceof Error && photosError.message.includes('404')) {
          console.warn(`🖼️ CarDetail logic: Car photos 404 for carId: ${carId}`);
        }
        // Fallback to car.photoUrls (already loaded from getCar or existing data)
      }
    }
    
    // Load bid data
    const bidHistoryResp = await apiClient.getRecentBids(carDetails.id, 20).catch(() => ({ data: [] }));
    const highestBidResp = await apiClient.getHighestBid(carDetails.id).catch(() => ({ data: null }));

    let bidHistory: BidGetDto[] = [];
    if (Array.isArray(bidHistoryResp)) {
      bidHistory = bidHistoryResp;
    } else if (bidHistoryResp && typeof bidHistoryResp === 'object' && 'data' in bidHistoryResp) {
      const respData = (bidHistoryResp as any).data;
      bidHistory = Array.isArray(respData) ? respData : (respData?.bids || []);
    }

    let highestBid: BidGetDto | null = null;
    if (highestBidResp && typeof highestBidResp === 'object') {
      if ('data' in highestBidResp) {
        highestBid = (highestBidResp as any).data;
      } else if ('amount' in highestBidResp) {
        highestBid = highestBidResp as any;
      }
    }

    setState(prev => ({
      ...prev,
      currentCar: finalCarDetails, // Use updated car details with proper photos
      activeLot: lot || prev.lotQueue.find(l => l.id === carDetails.id) || null,
      bidHistory,
      highestBid,
      timerSeconds: serverState?.timerSeconds || prev.timerSeconds,
      isLive: serverState?.isLive !== undefined ? serverState.isLive : prev.isLive
    }));

    setCurrentImageIndex(0);
    setBidAmount('');

    // Join car group
    if (isConnected) {
      await joinAuctionCar(carDetails.id);
    }
  }, [isConnected, joinAuctionCar]);

  // Periodic health check - check auction status regardless of connection
  useEffect(() => {
    if (!auctionId) return;

    const healthCheck = setInterval(async () => {
      try {
        const auctionStatus = await apiClient.getAuctionStatus(auctionId);
        console.log('✅ Health Check Success:', auctionStatus);
        
        // Check if auction completed - KEEP CONNECTION ALIVE
        if (auctionStatus.allFinished) {
          console.log('🏁 Auction completed detected via health check - MAINTAINING CONNECTION');
          setState(prev => ({
            ...prev,
            auctionCompleted: true,
            currentCar: null,
            activeLot: null,
            isLive: false
          }));
          setShowCompletedModal(true);
          
          // CRITICAL: Do NOT disconnect SignalR - keep listening for new auctions
          console.log('✅ Health Check: SignalR connection preserved for future auctions');
          return;
        }
        
        // Check if auction became active (has activeCarId now)
        if (auctionStatus.activeCarId && !state.currentCar && !state.auctionCompleted) {
          console.log('🚀 [REAL-TIME] Auction became active - syncing without reload');
          
          try {
              // Get server snapshot and sync without page reload
              const newActiveSnapshot = await apiClient.getAuctionCar(auctionStatus.activeCarId);
              if (newActiveSnapshot) {
                // Load proper car details and images using EXACT CarDetail.tsx logic
                let updatedSnapshot = { ...newActiveSnapshot };
                
                const carId = newActiveSnapshot.car?.id || newActiveSnapshot.carId;
                if (carId) {
                  // STEP 1: Load full car details (like CarDetail.tsx)
                  try {
                    console.log('🚗 CarDetail logic: Loading full car details for active car:', carId);
                    const fullCarData = await apiClient.getCar(carId);
                    console.log('🚗 CarDetail logic: Full car details loaded for active car:', fullCarData);
                    
                    if (updatedSnapshot.car) {
                      updatedSnapshot.car = { ...updatedSnapshot.car, ...fullCarData };
                    } else {
                      updatedSnapshot.car = fullCarData;
                    }
                    
                    console.log('✅ CarDetail logic: Updated active car with full details');
                  } catch (carError) {
                    console.warn('⚠️ CarDetail logic: Failed to load full car details for active car:', carError);
                  }
                  
                  // STEP 2: Load car photos (like CarDetail.tsx)
                  try {
                    console.log('🖼️ CarDetail logic: Loading photos for active car:', carId);
                    const photos = await apiClient.getCarPhotos(carId);
                    console.log('🖼️ CarDetail logic: Photos loaded for active car:', photos?.length || 0);
                    
                    if (photos && photos.length > 0) {
                      if (updatedSnapshot.car) {
                        updatedSnapshot.car = { ...updatedSnapshot.car, photoUrls: photos } as any;
                      } else {
                        (updatedSnapshot as any).photoUrls = photos;
                      }
                      console.log('✅ CarDetail logic: Updated active car photos');
                    }
                  } catch (photosError) {
                    console.warn('⚠️ CarDetail logic: Photos endpoint failed for active car:', photosError);
                    if (photosError instanceof Error && photosError.message.includes('404')) {
                      console.warn(`🖼️ CarDetail logic: Car photos 404 for active carId: ${carId}`);
                    }
                  }
                }
                
                const serverTimer = (newActiveSnapshot as any).remainingTimeSeconds || 
                                  (newActiveSnapshot as any).secondsRemaining || 0;
                
                setState(prev => ({
                  ...prev,
                  currentCar: updatedSnapshot, // Use updated snapshot with proper photos
                  activeLot: prev.lotQueue.find(lot => lot.id === newActiveSnapshot.id) || null,
                  isLive: newActiveSnapshot.isActive,
                  timerSeconds: serverTimer, // Use server timer exactly
                  auctionCompleted: false,
                  showCompletedModal: false,
                  viewDetailsMode: false
                }));
              
              // Join the new active car group
              await joinAuctionCar(auctionStatus.activeCarId);
              
              toast(`🔴 LIVE: Lot #${newActiveSnapshot.lotNumber} started!`, {
                icon: '🚀',
                duration: 6000
              });
            }
          } catch (err) {
            console.error('❌ Failed to sync to new active auction:', err);
            // Fallback to reload if sync fails
            window.location.reload();
          }
          return;
        }
        
        // Check if we're out of sync with active car
        if (auctionStatus.activeCarId && 
            state.currentCar && 
            auctionStatus.activeCarId !== state.currentCar.id) {
          
          console.log(`⚠️ Out of sync - server active car: ${auctionStatus.activeCarId}, local: ${state.currentCar.id}`);
          
          // Re-join the correct car group to get snapshot
          if (isConnected) {
            try {
              await joinAuctionCar(auctionStatus.activeCarId);
              console.log('🔄 Re-joined correct car group for sync');
            } catch (err) {
              console.error('Error re-joining car group:', err);
            }
          }
        }
        
        // If no active car but we have one, auction might have ended
        if (!auctionStatus.activeCarId && state.currentCar && state.lotQueue.length > 0) {
          console.log('🏁 No active car detected, auction may have completed');
          setState(prev => ({
            ...prev,
            auctionCompleted: true,
            currentCar: null,
            activeLot: null,
            isLive: false
          }));
          setShowCompletedModal(true);
        }
        
      } catch (err: any) {
        console.warn('❌ Health check failed:', err);
        
        // Handle specific 404 errors gracefully
        if (err?.message?.includes('404') || err?.status === 404) {
          console.log('📊 Health Check: 404 - Auction may be inactive or completed');
          
          // If we have cars in queue but getting 404, auction might be completed
          if (state.lotQueue && state.lotQueue.length > 0) {
            console.log('🏁 Health Check: Assuming auction completed based on 404 + existing queue');
            setState(prev => ({
              ...prev,
              auctionCompleted: true,
              currentCar: null,
              activeLot: null,
              isLive: false
            }));
            setShowCompletedModal(true);
          }
        } else {
          // For other errors, just log and continue
          console.log('🔄 Health Check: Non-404 error, continuing...');
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(healthCheck);
  }, [auctionId, state.currentCar, state.auctionCompleted, state.lotQueue.length, isConnected, joinAuctionCar]);

  // ========================================
  // DATA LOADING FUNCTIONS
  // ========================================

  const loadInitialData = useCallback(async () => {
    if (!auctionId) {
      setError('Auction ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading auction data for:', auctionId);

      // Step 1: Get auction details
      const auctionResponse = await apiClient.getAuction(auctionId);
      console.log('✅ Auction loaded:', auctionResponse);

      // Step 2: Get current state
      const currentState = await apiClient.getAuctionCurrentState(auctionId);
      console.log('✅ Current state:', currentState);

      // Step 3: Get lot queue (all cars in auction)
      const lotQueue = await apiClient.getAuctionCars(auctionId);
      console.log('✅ Lot queue loaded:', lotQueue.length, 'cars');

      // Step 4: Get statistics (optional, may fail due to permissions)
      let stats = {
        totalBids: 0,
        uniqueBidders: 0,
        totalCars: lotQueue.length,
        soldCars: auctionResponse.soldCarsCount || 0
      };

      try {
        const statisticsResponse = await apiClient.getAuctionStatistics(auctionId);
        if (statisticsResponse) {
          stats = {
            totalBids: statisticsResponse.totalBids || 0,
            uniqueBidders: statisticsResponse.uniqueBidders || 0,
            totalCars: statisticsResponse.totalCars || lotQueue.length,
            soldCars: statisticsResponse.soldCars || 0
          };
          console.log('✅ Statistics loaded:', stats);
        }
      } catch (statErr: any) {
        console.warn('⚠️ Statistics endpoint failed (using defaults):', statErr.message);
        // Use default stats - not critical
      }

      // Step 5: Load current/active car
      let currentCar: AuctionCarDetailDto | null = null;
      let activeLot: AuctionCarGetDto | null = null;

      // Try multiple strategies to get current car
      if (currentState.currentCarLotNumber) {
        // Strategy 1: Get current car by lot number
        try {
          currentCar = await apiClient.getAuctionCarByLot(currentState.currentCarLotNumber);
          console.log('✅ Current car loaded by lot number:', currentCar);
        } catch (err) {
          console.warn('⚠️ Could not load current car by lot number');
        }
      }
      
      if (!currentCar && auctionResponse.isLive) {
        // Strategy 2: Try to get active car
        try {
          currentCar = await apiClient.getActiveAuctionCar(auctionId);
          console.log('✅ Active car loaded:', currentCar);
        } catch (err) {
          console.warn('⚠️ No active car found');
        }
      }

      // Strategy 3: Always show first car if no current car is found
      if (!currentCar && lotQueue.length > 0) {
        console.log('📌 No current car found, loading first lot from queue as default');
        try {
          const firstLot = lotQueue[0];
          console.log('📋 First lot details:', firstLot);
          
          // Load car data with proper image loading (like loadCarData function)
          currentCar = await apiClient.getAuctionCar(firstLot.id);
          
          // Load full car details and photos (matching our image loading strategy)
          if (currentCar.car?.id) {
            try {
              console.log('🚗 Loading full car details for first lot:', currentCar.car.id);
              const fullCarData = await apiClient.getCar(currentCar.car.id);
              currentCar.car = { ...currentCar.car, ...fullCarData };
              
              // Load car photos
              try {
                console.log('🖼️ Loading photos for first lot car:', currentCar.car.id);
                const photos = await apiClient.getCarPhotos(currentCar.car.id);
                if (photos && photos.length > 0) {
                  (currentCar.car as any).photoUrls = photos;
                  console.log('✅ Photos loaded for first lot:', photos.length);
                }
              } catch (photosError) {
                console.warn('⚠️ Photos endpoint failed for first lot, using fallback');
              }
            } catch (carError) {
              console.warn('⚠️ Failed to load full car details for first lot:', carError);
            }
          }
          
          activeLot = firstLot;
          console.log('✅ Default first lot loaded as current car:', {
            id: currentCar.id,
            lotNumber: currentCar.lotNumber,
            make: currentCar.car?.make,
            model: currentCar.car?.model,
            hasPhotos: !!(currentCar.car as any)?.photoUrls?.length
          });
          
          toast(`Showing first lot: #${firstLot.lotNumber} ${currentCar.car?.make} ${currentCar.car?.model}`, { 
            icon: '🚗', 
            duration: 4000 
          });
        } catch (err: any) {
          console.error('⚠️ Could not load first lot as default:', err?.message);
          toast.error('Failed to load default vehicle');
        }
      }

      console.log('🔍 Final car loading result:', {
        hasCurrent: !!currentCar,
        hasActiveLot: !!activeLot,
        lotQueueSize: lotQueue.length,
        currentLotFromState: currentState.currentCarLotNumber,
        firstLotNumber: lotQueue[0]?.lotNumber
      });

      // If we have current car, load its details
      if (currentCar) {
        // Set activeLot if not already set
        if (!activeLot) {
          activeLot = lotQueue.find(lot => lot.id === currentCar!.id) || null;
        }
        
        // Load bid history and highest bid for current car
        try {
          const bidHistoryResp = await apiClient.getRecentBids(currentCar.id, 20).catch(() => ({ data: [] }));
          const highestBidResp = await apiClient.getHighestBid(currentCar.id).catch(() => ({ data: null }));

          // Process bid history response
          let bidHistory: BidGetDto[] = [];
          if (Array.isArray(bidHistoryResp)) {
            bidHistory = bidHistoryResp;
          } else if (bidHistoryResp && typeof bidHistoryResp === 'object' && 'data' in bidHistoryResp) {
            const respData = (bidHistoryResp as any).data;
            if (Array.isArray(respData)) {
              bidHistory = respData;
            } else if (respData && Array.isArray(respData.bids)) {
              bidHistory = respData.bids;
            }
          }

          // Process highest bid response
          let highestBid: BidGetDto | null = null;
          if (highestBidResp && typeof highestBidResp === 'object') {
            if ('data' in highestBidResp && highestBidResp.data) {
              highestBid = (highestBidResp as any).data;
            } else if ('amount' in highestBidResp) {
              highestBid = highestBidResp as any;
            }
          }

          // Single state update with all data
          setState(prev => ({
            ...prev,
            auction: auctionResponse,
            lotQueue,
            isLive: currentState.isLive || auctionResponse.isLive,
            timerSeconds: currentState.timerSeconds || auctionResponse.timerSeconds || 10,
            stats,
            currentCar,
            activeLot,
            bidHistory,
            highestBid
          }));

          console.log('✅ Bid data loaded:', {
            historyCount: bidHistory.length,
            hasHighestBid: !!highestBid
          });
        } catch (bidErr) {
          console.warn('⚠️ Could not load bid data:', bidErr);
          // Update state without bid data
          setState(prev => ({
            ...prev,
            auction: auctionResponse,
            lotQueue,
            isLive: currentState.isLive || auctionResponse.isLive,
            timerSeconds: currentState.timerSeconds || auctionResponse.timerSeconds || 10,
            stats,
            currentCar,
            activeLot,
            bidHistory: [],
            highestBid: null
          }));
        }
      } else {
        console.log('⚠️ No current car found - showing empty state');
        // Update state without current car
        setState(prev => ({
          ...prev,
          auction: auctionResponse,
          lotQueue,
          isLive: currentState.isLive || auctionResponse.isLive,
          timerSeconds: currentState.timerSeconds || auctionResponse.timerSeconds || 10,
          stats,
          currentCar: null,
          activeLot: null,
          bidHistory: [],
          highestBid: null
        }));
        
        // Show info message if queue has cars but no current
        if (lotQueue.length > 0) {
          toast('No active car found. Showing available vehicles.', { icon: 'ℹ️', duration: 3000 });
        }
      }

      // Step 6: Join SignalR groups
      if (isConnected) {
        try {
          console.log('🔌 Attempting to join SignalR groups...');
          await joinAuction(auctionId);
          console.log('✅ Joined auction group:', auctionId);
          
          // Check auction status with proper error handling
          try {
            const auctionStatus = await apiClient.getAuctionStatus(auctionId);
            console.log('📊 Auction Status:', auctionStatus);
            
            if (auctionStatus.allFinished) {
              // All auctions completed - KEEP CONNECTION ALIVE
              console.log('🏁 Initial Load: All auctions completed - MAINTAINING CONNECTION');
              setState(prev => ({
                ...prev,
                currentCar: null,
                activeLot: null,
                isLive: false,
                auctionCompleted: true
              }));
              
              setShowCompletedModal(true);
              
              // IMPORTANT: Connection stays alive for future auction starts
              console.log('✅ Initial Load: SignalR connection preserved for new auctions');
              
              showAuctionStateNotification(
                'All auctions completed - Connection active for new auctions',
                'completed'
              );
              
              setLoading(false);
              return;
            }
            
            if (auctionStatus.activeCarId) {
              // Join the active car and get complete snapshot
              await joinAuctionCar(auctionStatus.activeCarId);
              console.log('✅ Joined active car group:', auctionStatus.activeCarId);
              
              // Get current state from AuctionCarService
              try {
                const activeCarSnapshot = await apiClient.getAuctionCar(auctionStatus.activeCarId);
                console.log('📸 Active car snapshot:', activeCarSnapshot);
                
                // Process server-authoritative snapshot (NO TIMER RESTART)
                if (activeCarSnapshot) {
                  const serverTimer = (activeCarSnapshot as any).remainingTimeSeconds || 
                                    (activeCarSnapshot as any).secondsRemaining || 0;
                  
                  setState(prev => ({
                    ...prev,
                    currentCar: activeCarSnapshot,
                    activeLot: prev.lotQueue.find(lot => lot.id === activeCarSnapshot.id) || null,
                    isLive: activeCarSnapshot.isActive,
                    // Use server's EXACT timer - don't restart
                    timerSeconds: serverTimer,
                    // Reset modal states if auction is active
                    auctionCompleted: !activeCarSnapshot.isActive,
                    showCompletedModal: false,
                    viewDetailsMode: false
                  }));
                  
                  console.log(`🔄 Synced to server state - Timer: ${serverTimer}s, Live: ${activeCarSnapshot.isActive}`);
                  
                  toast.success(`🔄 Synced to ${activeCarSnapshot.isActive ? 'LIVE' : 'inactive'} lot: #${activeCarSnapshot.lotNumber}`, {
                    duration: 3000
                  });
                }
              } catch (snapshotErr) {
                console.error('❌ Failed to get active car snapshot:', snapshotErr);
                toast.error('Failed to load active auction car');
              }
              
            } else {
              // No active car - auction is not live or completed
              console.log('⚠️ No active car in auction - checking if completed');
              
              // Check if auction has any cars at all
              const hasAnyCars = lotQueue && lotQueue.length > 0;
              const isAuctionCompleted = hasAnyCars && !auctionStatus.activeCarId;
              
              setState(prev => ({
                ...prev,
                currentCar: null,
                activeLot: null,
                isLive: false,
                auctionCompleted: isAuctionCompleted
              }));
              
              if (isAuctionCompleted) {
                // Show modal for completed auction
                setShowCompletedModal(true);
                toast('🏁 Auction has completed - All lots have been sold', {
                  icon: '🏁',
                  duration: 8000
                });
              } else {
                toast('⏸️ Auction is not currently active', {
                  icon: '⏸️',
                  duration: 5000
                });
              }
              
              // Still join auction group for updates
              await joinAuction(auctionId);
            }
            
          } catch (statusErr: any) {
            console.error('❌ Failed to get auction status:', statusErr);
            
            // Handle specific 404 case - no active car
            if (statusErr.message?.includes('No active car found')) {
              // Check if we have cars in queue to determine if auction is completed
              const hasAnyCars = state.lotQueue && state.lotQueue.length > 0;
              const isAuctionCompleted = hasAnyCars; // If we have cars but no active car, auction is likely completed
              
              setState(prev => ({
                ...prev,
                currentCar: null,
                activeLot: null,
                isLive: false,
                auctionCompleted: isAuctionCompleted
              }));
              
              if (isAuctionCompleted) {
                // Show modal for completed auction
                setShowCompletedModal(true);
                toast('🏁 Auction has completed - All lots have been processed', {
                  icon: '🏁',
                  duration: 8000
                });
              } else {
                toast('⏸️ Auction is not currently active', {
                  icon: '⏸️',
                  duration: 5000
                });
              }
              
              // Still join auction group for future updates
              try {
                await joinAuction(auctionId);
                console.log('✅ Joined auction group for updates');
              } catch (joinErr) {
                console.error('❌ Failed to join auction group:', joinErr);
              }
            } else {
              toast.error('Failed to check auction status');
            }
          }
          
        } catch (signalRErr: any) {
          console.warn('⚠️ SignalR group join failed:', signalRErr?.message);
          // Not critical - user can still view auction
        }
      } else {
        console.log('⚠️ SignalR not connected, skipping group join');
      }

      setLoading(false);
      console.log('🎉 Initial data loading complete', {
        auctionName: auctionResponse.name,
        isLive: currentState.isLive || auctionResponse.isLive,
        hasCurrent: !!currentCar,
        queueSize: lotQueue.length
      });

    } catch (err: any) {
      console.error('❌ Error loading auction data:', err);
      setError(err?.message || 'Failed to load auction data');
      setLoading(false);
    }
  }, [auctionId, isConnected, joinAuction, joinAuctionCar]);

  // ========================================
  // SOUND EFFECTS (defined early for use in callbacks)
  // ========================================

  const playBidSound = useCallback(() => {
    if (isMuted) return;
    
    try {
      const audio = new Audio('/sounds/bid.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch {
      // Silently fail
    }
  }, [isMuted]);

  const playWarningSound = useCallback(() => {
    if (isMuted) return;
    
    try {
      const audio = new Audio('/sounds/warning.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch {
      // Silently fail
    }
  }, [isMuted]);


  // ========================================
  // LOT NAVIGATION
  // ========================================

  const handleSelectLot = useCallback(async (lot: AuctionCarGetDto) => {
    console.log('Selected lot:', lot);
    
    // Check if this is the server's current active car
    try {
      const serverState = await apiClient.getAuctionCurrentState(auctionId!);
      
      if (serverState.currentCarLotNumber && 
          serverState.currentCarLotNumber !== lot.lotNumber &&
          serverState.isLive) {
        
        // Warn user they're viewing a different car than the live one
        toast(`⚠️ Live auction is on Lot #${serverState.currentCarLotNumber}. You're viewing Lot #${lot.lotNumber}`, {
          icon: '⚠️',
          duration: 5000
        });
        
        // Ask if they want to sync to live auction
        const shouldSync = confirm(`Live auction is currently on Lot #${serverState.currentCarLotNumber}. Do you want to join the live auction instead?`);
        
        if (shouldSync) {
          try {
            const liveCurrentCar = await apiClient.getAuctionCarByLot(serverState.currentCarLotNumber);
            if (liveCurrentCar) {
              // Load the live car instead
              await loadCarData(liveCurrentCar, serverState);
              toast.success(`Joined live auction: Lot #${serverState.currentCarLotNumber}`, {
                icon: '🔴',
                duration: 3000
              });
              return;
            }
          } catch (err) {
            console.error('Error loading live car:', err);
          }
        }
      }
      
      // Load the selected car (either it's the live one or user chose to view different)
      const carDetails = await apiClient.getAuctionCar(lot.id);
      await loadCarData(carDetails, null, lot);
      
      const isLiveCar = serverState.currentCarLotNumber === lot.lotNumber;
      toast.success(`${isLiveCar ? 'Viewing LIVE' : 'Viewing'} Lot #${lot.lotNumber}`, {
        icon: isLiveCar ? '🔴' : '👁️',
        duration: 3000
      });
      
    } catch (err) {
      console.error('Error loading lot:', err);
      toast.error('Failed to load lot details');
    }
  }, [isConnected, joinAuctionCar, auctionId]);

  // ========================================
  // SIGNALR EVENT HANDLERS
  // ========================================

  // Handle complete snapshot update from server with proper image loading
  const handleSnapshotUpdate = useCallback(async (snapshot: any) => {
    console.log('📸 Snapshot Update:', snapshot);
    
    try {
      // Update state with complete server snapshot
      setState(prev => ({
        ...prev,
        currentCar: {
          id: snapshot.auctionCarId,
          auctionId: snapshot.auctionId,
          carId: snapshot.carId || '',
          lotNumber: snapshot.runOrder,
          title: snapshot.title,
          startPrice: snapshot.startPrice,
          minPreBid: snapshot.minPreBid || 0,
          currentPrice: snapshot.currentPrice,
          minimumBid: snapshot.minimumBid,
          isActive: snapshot.isActive,
          status: snapshot.status,
          winnerUserId: snapshot.winnerUserId,
          winnerUserName: snapshot.winnerUserName,
          soldPrice: snapshot.soldPrice,
          remainingTimeSeconds: snapshot.secondsRemaining || 0,
          // Car details from snapshot or previous state
          car: prev.currentCar?.car || {
            id: snapshot.carId || '',
            make: snapshot.make || '',
            model: snapshot.model || '',
            year: snapshot.year || 0,
            mileage: snapshot.mileage || 0,
            fuelType: snapshot.fuelType || '',
            transmission: snapshot.transmission || '',
            bodyType: snapshot.bodyType || '',
            color: snapshot.color || '',
            engineSize: snapshot.engineSize || 0,
            description: snapshot.description || '',
            images: snapshot.images || [],
            photoUrls: snapshot.images || [] // Fallback to snapshot images
          },
          // Auction details
          auction: prev.currentCar?.auction || {
            id: snapshot.auctionId,
            name: prev.auction?.name || '',
            description: '',
            startDate: '',
            endDate: '',
            isLive: snapshot.isActive,
            timerSeconds: snapshot.secondsRemaining || 10
          }
        } as AuctionCarDetailDto,
        timerSeconds: snapshot.secondsRemaining || 0,
        isLive: snapshot.isActive && snapshot.status === 'Live',
        bidHistory: snapshot.recentBids || [],
        highestBid: snapshot.recentBids?.find((bid: any) => bid.type === 'Live') || null
      }));

      // Load proper car details and images using EXACT CarDetail.tsx logic
      if (snapshot.carId) {
        // STEP 1: Load full car details (like CarDetail.tsx)
        try {
          console.log('🚗 CarDetail logic: Loading full car details for snapshot car:', snapshot.carId);
          const fullCarData = await apiClient.getCar(snapshot.carId);
          console.log('🚗 CarDetail logic: Full car details loaded for snapshot car:', fullCarData);
          
          setState(prev => ({
            ...prev,
            currentCar: prev.currentCar ? {
              ...prev.currentCar,
              car: { ...prev.currentCar.car, ...fullCarData }
            } : prev.currentCar
          }));
          
          console.log('✅ CarDetail logic: Updated snapshot car with full details');
        } catch (carError) {
          console.warn('⚠️ CarDetail logic: Failed to load full car details for snapshot car:', carError);
        }
        
        // STEP 2: Load car photos (like CarDetail.tsx)
        try {
          console.log('🖼️ CarDetail logic: Loading photos for snapshot car:', snapshot.carId);
          const photos = await apiClient.getCarPhotos(snapshot.carId);
          console.log('🖼️ CarDetail logic: Photos loaded for snapshot car:', photos?.length || 0);
          
          if (photos && photos.length > 0) {
            setState(prev => ({
              ...prev,
              currentCar: prev.currentCar ? {
                ...prev.currentCar,
                car: prev.currentCar.car ? {
                  ...prev.currentCar.car,
                  photoUrls: photos
                } : prev.currentCar.car
              } : prev.currentCar
            }));
            console.log('✅ CarDetail logic: Updated snapshot car photos');
          }
        } catch (photosError) {
          console.warn('⚠️ CarDetail logic: Photos endpoint failed for snapshot car:', photosError);
          if (photosError instanceof Error && photosError.message.includes('404')) {
            console.warn(`🖼️ CarDetail logic: Car photos 404 for snapshot carId: ${snapshot.carId}`);
          }
        }
      }

      // Update active lot in queue
      setState(prev => ({
        ...prev,
        activeLot: prev.lotQueue.find(lot => lot.id === snapshot.auctionCarId) || null
      }));

      toast.success(`🔄 Synced to Lot #${snapshot.runOrder}`, {
        icon: '🔄',
        duration: 3000
      });

    } catch (error) {
      console.error('Error processing snapshot:', error);
      toast.error('Failed to sync with server');
    }
  }, []);

  // Handle new bid (live or pre-bid)
  const handleNewBid = useCallback((bid: any, isHighest?: boolean) => {
    console.log('💰 Processing new bid:', bid, 'isHighest:', isHighest);
    
    setState(prev => ({
      ...prev,
      bidHistory: [bid, ...prev.bidHistory.slice(0, 19)], // Keep last 20 bids
      highestBid: isHighest ? {
        id: bid.bidId,
        auctionCarId: bid.auctionCarId,
        userId: bid.userId,
        amount: bid.amount,
        placedAtUtc: bid.placedAtUtc,
        bidType: bid.type,
        user: {
          id: bid.userId,
          name: bid.userName,
          email: ''
        }
      } as any : prev.highestBid,
      currentCar: prev.currentCar ? {
        ...prev.currentCar,
        currentPrice: isHighest ? bid.amount : prev.currentCar.currentPrice
      } : null
    }));

    if (isHighest) {
      toast.success(`New highest bid: $${bid.amount.toLocaleString()}`, {
        icon: '🏆',
        duration: 3000
      });
    }
  }, []);

  // Handle auction car completed
  const handleAuctionCarCompleted = useCallback((data: any) => {
    console.log('✅ Auction car completed:', data);
    
    setState(prev => ({
      ...prev,
      currentCar: prev.currentCar ? {
        ...prev.currentCar,
        status: data.status,
        isActive: false,
        winnerUserId: data.winnerUserId,
        winnerUserName: data.winnerUserName,
        soldPrice: data.soldPrice
      } : null,
      isLive: false,
      timerSeconds: 0
    }));

    const statusMessage = data.status === 'Sold' 
      ? `Sold for $${data.soldPrice?.toLocaleString()} to ${data.winnerUserName}`
      : 'No sale - reserve not met';

    toast(statusMessage, {
      icon: data.status === 'Sold' ? '✅' : '❌',
      duration: 5000
    });
  }, []);


  const handleMoveToNextCar = useCallback(async (data: any) => {
    console.log('🚗 [SignalR] Moving to next car:', data);
    
    try {
      const newLotNumber = data.lotNumber || data.newLotNumber || data.nextLot;
      
      if (newLotNumber) {
        // Show transition overlay
        setIsTransitioning(true);
        setTransitionMessage('Moving to next vehicle...');

        // Show transition message
        toast('Moving to next vehicle...', {
          icon: '🔄',
          duration: 2000
        });

        // Mark current car as completed
        setState(prev => ({
          ...prev,
          currentCar: prev.currentCar ? {
            ...prev.currentCar,
            isActive: false
          } : null,
          isLive: false
        }));

        // Wait a moment for transition
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Load new car data
        const newCurrentCar = await apiClient.getAuctionCarByLot(newLotNumber);
        
        if (newCurrentCar) {
          // Load bid data for new car
          const bidHistoryResp = await apiClient.getRecentBids(newCurrentCar.id, 20).catch(() => ({ data: [] }));
          const highestBidResp = await apiClient.getHighestBid(newCurrentCar.id).catch(() => ({ data: null }));

          let bidHistory: BidGetDto[] = [];
          if (Array.isArray(bidHistoryResp)) {
            bidHistory = bidHistoryResp;
          } else if (bidHistoryResp && typeof bidHistoryResp === 'object' && 'data' in bidHistoryResp) {
            const respData = (bidHistoryResp as any).data;
            bidHistory = Array.isArray(respData) ? respData : (respData?.bids || []);
          }

          let highestBid: BidGetDto | null = null;
          if (highestBidResp && typeof highestBidResp === 'object') {
            if ('data' in highestBidResp) {
              highestBid = (highestBidResp as any).data;
            } else if ('amount' in highestBidResp) {
              highestBid = highestBidResp as any;
            }
          }

          const activeLot = state.lotQueue.find(lot => lot.id === newCurrentCar.id) || null;

          setState(prev => ({
            ...prev,
            currentCar: newCurrentCar,
            activeLot,
            bidHistory,
            highestBid,
            timerSeconds: prev.auction?.timerSeconds || 10,
            isLive: true // Restart live status
          }));

          // Join new car group
          if (isConnected) {
            await joinAuctionCar(newCurrentCar.id);
          }

          setCurrentImageIndex(0);
          setBidAmount(''); // Clear bid input
          
          setTransitionMessage(`Now Live: Lot #${newLotNumber}`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          toast.success(`🔄 All users synced to Lot #${newLotNumber}`, {
            icon: '🚗',
            duration: 3000
          });
        }
      } else {
        console.warn('No lot number provided in move to next car event');
        // Fallback: try to move to next car in queue manually
        const currentIndex = state.lotQueue.findIndex(lot => lot.id === state.currentCar?.id);
        const nextLot = state.lotQueue[currentIndex + 1];
        
        if (nextLot) {
          await handleSelectLot(nextLot);
          toast.success(`Moved to Lot #${nextLot.lotNumber}`);
        } else {
          toast('No more vehicles in auction', { icon: '🏁' });
        }
      }
    } catch (err) {
      console.error('Error moving to next car:', err);
      setTransitionMessage('Error loading next vehicle');
      toast.error('Failed to load next car');
      
      // Fallback: try manual next car logic
      setTimeout(async () => {
        const currentIndex = state.lotQueue.findIndex(lot => lot.id === state.currentCar?.id);
        const nextLot = state.lotQueue[currentIndex + 1];
        
        if (nextLot) {
          await handleSelectLot(nextLot);
          toast.success(`Moved to Lot #${nextLot.lotNumber}`);
        } else {
          toast('No more vehicles in auction', { icon: '🏁' });
        }
      }, 2000);
    } finally {
      // Hide transition overlay
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionMessage('');
      }, 500);
    }
  }, [state.lotQueue, state.currentCar, isConnected, joinAuctionCar, handleSelectLot]);

  const refreshHighestBid = useCallback(async () => {
    if (!state.currentCar) return;
    
    try {
      const highestBidResp = await apiClient.getHighestBid(state.currentCar.id);
      
      let highestBid: BidGetDto | null = null;
      if (highestBidResp && typeof highestBidResp === 'object') {
        if ('data' in highestBidResp) {
          highestBid = (highestBidResp as any).data;
        } else if ('amount' in highestBidResp) {
          highestBid = highestBidResp as any;
        }
      }
      
      if (highestBid) {
        setState(prev => ({ ...prev, highestBid }));
      }
    } catch (err) {
      console.warn('Could not refresh highest bid:', err);
    }
  }, [state.currentCar]);

  // ========================================
  // NETWORK CONNECTION TEST
  // ========================================

  const testNetworkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Test if we can reach the API server
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249'}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      return response.ok;
    } catch (error) {
      console.error('Network test failed:', error);
      return false;
    }
  }, []);

  // ========================================
  // BID PLACEMENT
  // ========================================

  const handlePlaceBid = useCallback(async (amount: number) => {
    console.log('🎯 Attempting to place bid (BidService logic):', {
      amount,
      hasCurrentCar: !!state.currentCar,
      isLive: state.isLive,
      isActive: state.currentCar?.isActive,
      isConnected,
      connectionState
    });

    if (!state.currentCar) {
      toast.error('No active vehicle to bid on');
      return;
    }

    // Business logic validation (from BidService.ValidateBidAsync)
    if (!state.isLive || !state.currentCar.isActive || state.auctionCompleted || viewDetailsMode) {
      if (state.auctionCompleted) {
        toast.error('Auction has completed - bidding is closed');
      } else if (viewDetailsMode) {
        toast.error('You are in details view mode - bidding is disabled');
      } else {
        toast.error('Auction is not currently live');
      }
      return;
    }

    // Calculate minimum bid (BidService logic)
    const currentHigh = state.highestBid?.amount || state.currentCar.currentPrice || (state.currentCar as any).startPrice || 0;
    const increment = state.auction?.minBidIncrement || 50;
    const minimumBid = Math.max(currentHigh + increment, (state.currentCar as any).minimumBid || 0);

    if (amount < minimumBid) {
      toast.error(`Minimum bid is $${minimumBid.toLocaleString()}`);
      return;
    }

    setIsPlacingBid(true);

    try {
      if (isConnected) {
        // Primary: Use SignalR BidHub.PlaceLiveBid
        console.log('📡 Using SignalR BidHub (calls BidService)');
        
        try {
          await placeLiveBid(state.currentCar.id, amount);
          
          toast.success(`Live bid placed: $${amount.toLocaleString()}`, {
            icon: '🔥',
            duration: 3000
          });
          setBidAmount('');
          
        } catch (signalRErr: any) {
          console.warn('⚠️ SignalR bid failed, trying REST API:', signalRErr);
          throw signalRErr; // Will be caught by outer catch
        }
        
      } else {
        // Fallback: Use REST API (BidController → BidService)
        console.log('🌐 Using REST API fallback (BidController → BidService)');
        
      const bidRequest = {
        auctionCarId: state.currentCar.id,
        amount: amount
      };

      const response = await apiClient.placeLiveBid(bidRequest);
        console.log('✅ REST bid placed successfully:', response);

        toast.success(`Bid placed via REST: $${amount.toLocaleString()}`, {
          icon: '⚠️',
          duration: 4000
        });
      setBidAmount('');
      
        // Refresh data after REST bid
      setTimeout(() => {
        refreshBidHistory();
        }, 1000);
      }

    } catch (err: any) {
      console.error('❌ Bid placement failed:', err);
      
      // Handle specific BidService validation errors
      if (err.message?.includes('minimum') || err.message?.includes('increment')) {
        toast.error(`Bid too low - minimum: $${minimumBid.toLocaleString()}`);
      } else if (err.message?.includes('unauthorized') || err.message?.includes('pre-bid')) {
        toast.error('You must place a pre-bid first to participate in live bidding');
      } else if (err.message?.includes('stale') || err.message?.includes('moved')) {
        toast.error('Bid rejected - auction has moved on');
      } else if (err.message?.includes('not connected') && !isConnected) {
        // Try REST API as final fallback
        try {
          console.log('🔄 Final fallback to REST API');
          const bidRequest = {
            auctionCarId: state.currentCar.id,
            amount: amount
          };
          
          await apiClient.placeLiveBid(bidRequest);
          toast.success(`Bid placed via REST fallback: $${amount.toLocaleString()}`);
          setBidAmount('');
          
        } catch (restErr) {
          toast.error('Both SignalR and REST API failed - please refresh page');
        }
      } else {
        toast.error(err.message || 'Failed to place bid');
      }
    } finally {
      setIsPlacingBid(false);
    }
  }, [state.currentCar, state.highestBid, state.auction, state.isLive, isConnected, connectionState, placeLiveBid]);

  const refreshBidHistory = useCallback(async () => {
    if (!state.currentCar) return;

    try {
      const bidHistoryResp = await apiClient.getRecentBids(state.currentCar.id, 20).catch(() => ({ data: [] }));
      const highestBidResp = await apiClient.getHighestBid(state.currentCar.id).catch(() => ({ data: null }));

      let bidHistory: BidGetDto[] = [];
      if (Array.isArray(bidHistoryResp)) {
        bidHistory = bidHistoryResp;
      } else if (bidHistoryResp && typeof bidHistoryResp === 'object' && 'data' in bidHistoryResp) {
        const respData = (bidHistoryResp as any).data;
        bidHistory = Array.isArray(respData) ? respData : (respData?.bids || []);
      }

      let highestBid: BidGetDto | null = null;
      if (highestBidResp && typeof highestBidResp === 'object') {
        if ('data' in highestBidResp) {
          highestBid = (highestBidResp as any).data;
        } else if ('amount' in highestBidResp) {
          highestBid = highestBidResp as any;
        }
      }

      setState(prev => ({
        ...prev,
        bidHistory,
        highestBid
      }));
    } catch (err) {
      console.warn('Could not refresh bid history:', err);
    }
  }, [state.currentCar]);

  // ========================================
  // TIMER MANAGEMENT
  // ========================================

  // CLIENT-SIDE TIMER DISABLED - Server sends timer ticks every second via SignalR
  useEffect(() => {
    // No client-side timer needed - server is authoritative and sends onTimerTick every second
    if (state.timerSeconds > 0) {
      console.log(`⏰ [REAL-TIME] Server Timer: ${state.timerSeconds}s (Client timer disabled)`);
    }
    
    // Only handle timer expiry logic when server timer reaches 0
    if (state.timerSeconds === 0 && state.isLive && state.currentCar) {
      console.log('⏰ [REAL-TIME] Server timer expired - handling expiry');
      setTimeout(() => {
            handleTimerExpired();
      }, 1000);
    }
    
    // Warning sounds based on server timer
    if (state.timerSeconds === 10 || state.timerSeconds === 5) {
      console.log(`⚠️ [REAL-TIME] Timer warning: ${state.timerSeconds}s remaining`);
      playWarningSound();
    }
    
    // Cleanup any existing client timer
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        }
      };
  }, [state.timerSeconds, state.isLive, state.currentCar]);


  const handleTimerExpired = useCallback(async () => {
    console.log('⏰ Timer expired - attempting to move to next car');
    
    if (!state.currentCar || !auctionId) {
      console.warn('No current car or auction ID for timer expiry');
      return;
    }

    try {
      // Show transition overlay
      setIsTransitioning(true);
      setTransitionMessage('Time Expired! No bids received.');

      // Show immediate feedback
      toast('Time expired! Moving to next vehicle...', {
      icon: '⏰',
        duration: 3000
      });

      // Mark current car as completed (no sale)
      setState(prev => ({
        ...prev,
        currentCar: prev.currentCar ? {
          ...prev.currentCar,
          isActive: false,
          winnerStatus: 'NoSale'
        } : null,
        isLive: false
      }));

      // Wait a moment for user to see the message
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setTransitionMessage('Loading next vehicle...');

      // Try to get next car from lot queue
      const currentIndex = state.lotQueue.findIndex(lot => lot.id === state.currentCar?.id);
      const nextLot = state.lotQueue[currentIndex + 1];

      if (nextLot) {
        console.log('🚗 Moving to next car:', nextLot);
        await handleSelectLot(nextLot);
        
        setTransitionMessage(`Now Live: Lot #${nextLot.lotNumber}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast.success(`Now viewing: Lot #${nextLot.lotNumber}`, {
          icon: '🚗',
          duration: 3000
        });
      } else {
        // No more cars in queue
        console.log('🏁 No more cars in auction');
        setTransitionMessage('Auction Completed - No more vehicles');
        
        toast('Auction completed - no more vehicles', {
          icon: '🏁',
          duration: 5000
        });
        
        setState(prev => ({
          ...prev,
          currentCar: null,
          activeLot: null,
          isLive: false
        }));
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error('Error handling timer expiry:', error);
      setTransitionMessage('Error loading next vehicle');
      toast.error('Failed to move to next vehicle');
      
      // Fallback: refresh the page data
      setTimeout(() => {
        loadInitialData();
      }, 3000);
    } finally {
      // Hide transition overlay
      setIsTransitioning(false);
      setTransitionMessage('');
    }
  }, [state.currentCar, state.lotQueue, auctionId, handleSelectLot, loadInitialData]);

  // ========================================
  // IMAGE NAVIGATION
  // ========================================

  // Image URL formatter (like PhotoGallery component)
  const getImageUrl = useCallback((url: string) => {
    if (!url) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM2Mzc0OEEiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIzODAiIHk9IjI4MCI+CjxwYXRoIGQ9Ik0yMSAxOVYxOUMyMSAyMC4xIDIwLjEgMjEgMTkgMjFINUMzLjkgMjEgMyAyMC4xIDMgMTlWNUMzIDMuOSAzLjkgMyA1IDNIMTRMMTYgNUgxOUMyMC4xIDUgMjEgNS45IDIxIDdWMTlaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTMiIHI9IjMiIHN0cm9rZT0iIzlDQTRBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHN2Zz4KPHR4dCB4PSI0MDAiIHk9IjM4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOUNBNEFGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZSBBdmFpbGFibGU8L3R4dD4KPHN2Zz4=';
    if (url.startsWith('http')) return url;
    return `https://localhost:7249${url}`;
  }, []);

  const carImages = useMemo(() => {
    const images: string[] = [];
    
    console.log('🖼️ Building carImages array from:', {
      currentCar: state.currentCar?.car,
      photoUrls: (state.currentCar?.car as any)?.photoUrls,
      imageUrls: state.currentCar?.car?.imageUrls,
      activeLot: state.activeLot?.carImage
    });
    
    // Get images from car object - check multiple sources (like CarDetail.tsx)
    if (state.currentCar?.car) {
      // Priority 1: photoUrls (loaded from getCarPhotos endpoint - like CarDetail.tsx)
      if ((state.currentCar.car as any).photoUrls && Array.isArray((state.currentCar.car as any).photoUrls)) {
        console.log('🖼️ Using photoUrls from car:', (state.currentCar.car as any).photoUrls.length);
        const formattedUrls = (state.currentCar.car as any).photoUrls.map((url: string) => getImageUrl(url));
        images.push(...formattedUrls);
      }
      // Priority 2: imageUrls (fallback)
      else if (state.currentCar.car.imageUrls && Array.isArray(state.currentCar.car.imageUrls)) {
        console.log('🖼️ Using imageUrls from car:', state.currentCar.car.imageUrls.length);
        const formattedUrls = state.currentCar.car.imageUrls.map(url => getImageUrl(url));
        images.push(...formattedUrls);
      }
      // Priority 3: images array (fallback)
      else if ((state.currentCar.car as any).images && Array.isArray((state.currentCar.car as any).images)) {
        console.log('🖼️ Using images from car:', (state.currentCar.car as any).images.length);
        const formattedUrls = (state.currentCar.car as any).images.map((url: string) => getImageUrl(url));
        images.push(...formattedUrls);
      }
    }
    
    // Get image from lot (additional source)
    if (state.activeLot?.carImage) {
      const formattedUrl = getImageUrl(state.activeLot.carImage);
      if (!images.includes(formattedUrl)) {
        console.log('🖼️ Adding carImage from activeLot');
        images.push(formattedUrl);
      }
    }
    
    console.log('🖼️ Final carImages array:', images.length, 'images');
    
    // Default placeholder if no images - use inline SVG to prevent 404 errors
    if (images.length === 0) {
      console.log('🖼️ No images found, using default placeholder');
      return ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM2Mzc0OEEiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIzODAiIHk9IjI4MCI+CjxwYXRoIGQ9Ik0yMSAxOVYxOUMyMSAyMC4xIDIwLjEgMjEgMTkgMjFINUMzLjkgMjEgMyAyMC4xIDMgMTlWNUMzIDMuOSAzLjkgMyA1IDNIMTRMMTYgNUgxOUMyMC4xIDUgMjEgNS45IDIxIDdWMTlaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTMiIHI9IjMiIHN0cm9rZT0iIzlDQTRBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHN2Zz4KPHR4dCB4PSI0MDAiIHk9IjM4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOUNBNEFGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZSBBdmFpbGFibGU8L3R4dD4KPHN2Zz4='];
    }
    
    return images;
  }, [state.currentCar, state.activeLot, getImageUrl]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % carImages.length);
  }, [carImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + carImages.length) % carImages.length);
  }, [carImages.length]);

  // ========================================
  // QUICK BID CALCULATIONS
  // ========================================

  const { minimumBid, quickBidAmounts } = useMemo(() => {
    const currentHigh = state.highestBid?.amount || state.currentCar?.currentPrice || state.currentCar?.minPreBid || 0;
    const increment = state.auction?.minBidIncrement || 100;
    const minimum = currentHigh + increment;

    const amounts = [
      minimum,
      minimum + increment,
      minimum + increment * 2,
      minimum + increment * 5,
      minimum + increment * 10,
      minimum + increment * 25
    ];

    return { minimumBid: minimum, quickBidAmounts: amounts };
  }, [state.highestBid, state.currentCar, state.auction]);




  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerUrgency = () => {
    if (state.timerSeconds <= 5) return 'critical';
    if (state.timerSeconds <= 10) return 'warning';
    if (state.timerSeconds <= 30) return 'caution';
    return 'normal';
  };

  const getTimerColor = () => {
    const urgency = getTimerUrgency();
    switch (urgency) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'caution': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const getTimerBgColor = () => {
    const urgency = getTimerUrgency();
    switch (urgency) {
      case 'critical': return 'from-red-600/30 to-red-700/30';
      case 'warning': return 'from-orange-600/30 to-orange-700/30';
      case 'caution': return 'from-yellow-600/30 to-yellow-700/30';
      default: return 'from-green-600/30 to-green-700/30';
    }
  };

  // Get car display name
  const getCarDisplayName = () => {
    if (!state.currentCar) return 'No Vehicle';
    
    // Try to get from car object
    if (state.currentCar.car) {
      return `${state.currentCar.car.year || ''} ${state.currentCar.car.make || ''} ${state.currentCar.car.model || ''}`.trim();
    }
    
    // Fall back to activeLot
    if (state.activeLot) {
      return `${state.activeLot.carYear || ''} ${state.activeLot.carMake || ''} ${state.activeLot.carModel || ''}`.trim();
    }
    
    return 'Vehicle';
  };

  // Get car properties safely with enum translation (like CarDetail.tsx)
  const getCarProperty = (prop: string): string | number => {
    if (!state.currentCar) return 'N/A';
    
    let value: any = null;
    
    // Try from car object first
    if (state.currentCar.car && prop in state.currentCar.car) {
      value = (state.currentCar.car as any)[prop];
    }
    // Try from activeLot as fallback
    else if (state.activeLot && prop in state.activeLot) {
      value = (state.activeLot as any)[prop];
    }
    
    if (value === null || value === undefined) {
    return 'N/A';
    }
    
    // Apply enum translations (like DetailTabs.tsx)
    switch (prop) {
      case 'condition':
        return getEnumLabel('CarCondition', value);
      case 'transmission':
        return getEnumLabel('Transmission', value);
      case 'driveTrain':
        return getEnumLabel('DriveTrain', value);
      case 'titleType':
        return getEnumLabel('TitleType', value);
      case 'damageType':
        return getEnumLabel('DamageType', value);
      case 'fuelType':
        return getEnumLabel('FuelType', value);
      case 'bodyType':
        return getEnumLabel('BodyType', value);
      case 'engineType':
        return getEnumLabel('EngineType', value);
      default:
        return value || 'N/A';
    }
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
          <p className="text-slate-400">Connecting to auction server...</p>
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
          <div className="flex space-x-4 justify-center">
            <button
              onClick={loadInitialData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => navigate('/all-auctions')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              Back to Auctions
            </button>
            </div>
            </div>
          </div>
    );
  }

  // ========================================
  // NO DATA STATE
  // ========================================

  if (!state.auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 text-slate-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">No Auction Data</h2>
          <p className="text-slate-400 mb-6">Unable to load auction information</p>
            <button
            onClick={() => navigate('/all-auctions')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
            >
            Back to Auctions
            </button>
        </div>
      </div>
    );
  }

  // ========================================
  // AUCTION COMPLETED MODAL
  // ========================================

  const handleModalClose = async () => {
    setShowCompletedModal(false);
    setViewDetailsMode(true); // Switch to details view mode
    
    // Load first car as default when viewing auction details
    if (state.lotQueue.length > 0 && !state.currentCar) {
      console.log('📌 View Details: Loading first car as default');
      try {
        const firstLot = state.lotQueue[0];
        await handleSelectLot(firstLot);
        toast(`Viewing details: Lot #${firstLot.lotNumber} ${firstLot.carMake} ${firstLot.carModel}`, { 
          icon: '👁️', 
          duration: 3000 
        });
      } catch (error) {
        console.error('⚠️ Failed to load first car in view details mode:', error);
      }
    }
  };

  const handleGoToAllAuctions = () => {
    navigate('/all-auctions');
  };

  // ========================================
  // AUCTION INACTIVE STATE (No current car but auction exists)
  // ========================================

  if (state.auction && !state.currentCar && !state.auctionCompleted && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-lg mx-auto">
            <div className="text-6xl mb-6">⏸️</div>
            <h2 className="text-3xl font-bold text-white mb-4">Auction Not Active</h2>
            <p className="text-slate-300 mb-6 text-lg">
              <span className="text-blue-400 font-semibold">{state.auction.name}</span> is currently inactive.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-3">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse mr-3"></div>
                <span className="text-orange-400 font-medium">Waiting for Auctioneer</span>
              </div>
              <p className="text-orange-300 text-sm">
                The auction may start soon. Please wait or check back later.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300"
              >
                Refresh Page
              </button>
              <button
                onClick={() => navigate('/all-auctions')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300"
              >
                Browse Other Auctions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================

  const urgency = getTimerUrgency();
  const currentHigh = state.highestBid?.amount || state.currentCar?.currentPrice || state.currentCar?.minPreBid || 0;
  const carDisplayName = getCarDisplayName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* ========================================
          TOP HEADER BAR
          ======================================== */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/all-auctions')}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{state.auction.name}</h1>
                <div className="flex items-center space-x-3 text-sm text-slate-400">
                  <span>{state.auction.locationName || 'Location'}</span>
                  <span>•</span>
                  <span>{state.stats.totalCars} vehicles</span>
                  <span>•</span>
                  <span>{state.stats.totalBids} bids</span>
          </div>
        </div>
      </div>

            {/* Center: Live indicator */}
            {state.isLive && (
              <div className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Live Auction</span>
                </div>
              )}

            {/* Right: Controls */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 bg-slate-700/50 border border-white/10 px-3 py-2 rounded-xl">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : isConnecting ? (
                  <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm text-white">
                  {state.auctionCompleted ? 'Auction Completed - Connected' : 
                   viewDetailsMode ? 'Details View - Connected' :
                   isConnected ? 'Connected & Synced' : isConnecting ? 'Connecting...' : 'Disconnected'}
                </span>
                {/* Debug info */}
                <span className="text-xs text-slate-400">
                  {state.auctionCompleted ? '(Completed - SignalR Active)' : 
                   viewDetailsMode ? '(Read-Only - SignalR Active)' :
                   `(${connectionState})`}
                  {state.currentCar && ` - Lot #${state.currentCar.lotNumber}`}
                  {!state.isLive && !state.auctionCompleted && ' - Not Live'}
                </span>
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-slate-500 ml-2">
                    ID: {localStorage.getItem('authToken')?.substring(0, 8) || 'anon'}
                  </span>
                )}
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-200"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 rounded-xl text-white transition-all duration-200"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          MAIN CONTENT - COPART STYLE LAYOUT
          ======================================== */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ========================================
              LEFT PANEL - CAR DISPLAY (70%)
              ======================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Car Image Gallery */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {state.currentCar ? (
                <>
                  {/* Main Image */}
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src={carImages[currentImageIndex]}
                      alt={carDisplayName}
                      className="w-full h-full object-contain"
                      onLoad={() => {
                        console.log('🖼️ Image loaded successfully:', carImages[currentImageIndex]);
                      }}
                      onError={(e) => {
                        const currentSrc = e.currentTarget.src;
                        console.error('🖼️ Image failed to load:', currentSrc);
                        
                        // Prevent infinite loop - only set fallback if not already a fallback
                        if (!currentSrc.startsWith('data:image/svg+xml')) {
                          console.log('🖼️ Setting fallback placeholder image');
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM2Mzc0OEEiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIzODAiIHk9IjI4MCI+CjxwYXRoIGQ9Ik0yMSAxOVYxOUMyMSAyMC4xIDIwLjEgMjEgMTkgMjFINUMzLjkgMjEgMyAyMC4xIDMgMTlWNUMzIDMuOSAzLjkgMyA1IDNIMTRMMTYgNUgxOUMyMC4xIDUgMjEgNS45IDIxIDdWMTlaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTMiIHI9IjMiIHN0cm9rZT0iIzlDQTRBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHN2Zz4KPHR4dCB4PSI0MDAiIHk9IjM4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOUNBNEFGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZSBBdmFpbGFibGU8L3R4dD4KPHN2Zz4=';
                        } else {
                          console.warn('🖼️ Fallback image also failed, keeping current');
                        }
                      }}
                    />
                    
                    {/* Image Navigation Arrows */}
                    {carImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full text-white transition-all duration-200"
                  >
                          <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full text-white transition-all duration-200"
                  >
                          <ChevronRight className="h-6 w-6" />
                  </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {carImages.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                        {currentImageIndex + 1} / {carImages.length}
                      </div>
                    )}

                    {/* Lot Number Badge */}
                    {state.currentCar.lotNumber && (
                      <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <div className="text-xs text-blue-200 font-medium">LOT NUMBER</div>
                        <div className="text-2xl font-black text-white">#{state.currentCar.lotNumber}</div>
                      </div>
                    )}

                    {/* Reserve Met Badge */}
                    {state.currentCar.isReserveMet && (
                      <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm font-bold">
                        <CheckCircle className="inline h-4 w-4 mr-1" />
                        RESERVE MET
                      </div>
                    )}
                  </div>

                  {/* Image Thumbnails */}
                  {carImages.length > 1 && (
                    <div className="bg-slate-900/50 border-t border-white/10 p-4">
                      <div className="flex space-x-2 overflow-x-auto">
                        {carImages.map((img, idx) => (
                      <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              idx === currentImageIndex
                                ? 'border-blue-500 ring-2 ring-blue-500/50'
                                : 'border-white/20 hover:border-blue-400/50'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const currentSrc = e.currentTarget.src;
                                console.error('🖼️ Thumbnail failed to load:', currentSrc);
                                
                                // Prevent infinite loop - only set fallback if not already a fallback
                                if (!currentSrc.startsWith('data:image/svg+xml')) {
                                  console.log('🖼️ Setting fallback thumbnail placeholder');
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzc0MTUxIi8+Cjxzdmcgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeD0iNDAiIHk9IjMwIj4KPHBhdGggZD0iTTIxIDE5VjE5QzIxIDIwLjEgMjAuMSAyMSAxOSAyMUg1QzMuOSAyMSAzIDIwLjEgMyAxOVY1QzMgMy45IDMuOSAzIDUgM0gxNEwxNiA1SDE5QzIwLjEgNSAyMSA1LjkgMjEgN1YxOVoiIHN0cm9rZT0iIzlDQTRBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMyIgcj0iMyIgc3Ryb2tlPSIjOUNBNEFGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPHN2Zz4=';
                                }
                              }}
                            />
                          </button>
                    ))}
                  </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-slate-900 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <Car className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No vehicle active</p>
                    <p className="text-sm mt-2">Waiting for auction to start...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Car Details */}
            {state.currentCar && (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Make/Model</div>
                    <div className="text-lg font-bold text-white">
                      {getCarProperty('make')} {getCarProperty('model')}
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Year</div>
                    <div className="text-lg font-bold text-white">{getCarProperty('year')}</div>
                </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">VIN</div>
                    <div className="text-sm font-mono text-white">{getCarProperty('vin')}</div>
              </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Odometer</div>
                    <div className="text-lg font-bold text-white">
                      {typeof getCarProperty('odometer') === 'number' 
                        ? getCarProperty('odometer').toLocaleString() 
                        : getCarProperty('odometer')} mi
            </div>
          </div>
            <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Condition</div>
                    <div className="text-sm text-white">{getCarProperty('condition')}</div>
                      </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Damage</div>
                    <div className="text-sm text-white">{getCarProperty('damageType')}</div>
                        </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Transmission</div>
                    <div className="text-sm text-white">{getCarProperty('transmission')}</div>
                        </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Fuel Type</div>
                    <div className="text-sm text-white">{getCarProperty('fuelType')}</div>
                      </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Drive Train</div>
                    <div className="text-sm text-white">{getCarProperty('driveTrain')}</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Title Type</div>
                    <div className="text-sm text-white">{getCarProperty('titleType')}</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Body Type</div>
                    <div className="text-sm text-white">{getCarProperty('bodyType')}</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Engine</div>
                    <div className="text-sm text-white">{getCarProperty('engine')}</div>
                  </div>
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Color</div>
                    <div className="text-sm text-white">{getCarProperty('color')}</div>
                  </div>
                      </div>

                {/* Additional Info Row */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Current Price</div>
                    <div className="text-2xl font-bold text-white">
                      ${state.currentCar.currentPrice?.toLocaleString() || '0'}
                    </div>
              </div>
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1 uppercase">Current Bids</div>
                    <div className="text-2xl font-bold text-white">
                      {state.currentCar.bidCount || 0}
            </div>
          </div>
        </div>
      </div>
            )}

            {/* Lot Queue - Horizontal Scroll */}
            {state.lotQueue.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-blue-400" />
                  Upcoming Vehicles ({state.lotQueue.length})
                </h3>
                <div className="flex space-x-3 overflow-x-auto pb-2 custom-scrollbar">
                  {state.lotQueue.map((lot) => (
                    <button
                      key={lot.id}
                      onClick={() => handleSelectLot(lot)}
                      className={`flex-shrink-0 w-48 bg-slate-700/30 hover:bg-slate-600/40 border rounded-xl p-3 transition-all duration-200 ${
                        lot.id === state.activeLot?.id
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-white/10 hover:border-blue-400/30'
                      }`}
                    >
                      <div className="aspect-video bg-slate-800 rounded-lg mb-2 overflow-hidden">
                        <UpcomingVehicleImage 
                          lot={lot}
                          getImageUrl={getImageUrl}
                        />
              </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-blue-400 mb-1">LOT #{lot.lotNumber}</div>
                        <div className="text-sm font-semibold text-white truncate">
                          {lot.carMake} {lot.carModel}
              </div>
                        <div className="text-xs text-slate-400">{lot.carYear}</div>
                        {lot.bidCount && lot.bidCount > 0 && (
                          <div className="text-xs text-green-400 mt-1">
                            {lot.bidCount} bid{lot.bidCount > 1 ? 's' : ''}
            </div>
                        )}
                      </div>
              </button>
                  ))}
            </div>
          </div>
            )}
        </div>

          {/* ========================================
              RIGHT PANEL - BIDDING (30%)
              ======================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Timer Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className={`bg-gradient-to-r ${getTimerBgColor()} backdrop-blur-sm border-b border-white/10 px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Timer className={`h-5 w-5 ${getTimerColor()}`} />
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Time Remaining</span>
            </div>
                  {urgency === 'critical' && (
                    <span className="text-xs font-bold text-red-400 animate-pulse">FINAL CALL!</span>
                  )}
            </div>
          </div>
              <div className="p-8">
                <div className={`text-7xl font-black text-center ${getTimerColor()} tabular-nums`}>
                  {state.timerSeconds === 0 ? "TIME'S UP!" : formatTime(state.timerSeconds)}
        </div>
                {/* Real-time indicator */}
                <div className="text-center mt-2 text-xs text-slate-400">
                  🔴 LIVE SERVER TIMER
                </div>
                {urgency === 'critical' && state.timerSeconds === 0 && (
                  <div className="text-center mt-3 text-red-400 text-lg font-bold animate-bounce">
                    🚨 NO BIDS RECEIVED 🚨
                  </div>
                )}
                {urgency === 'warning' && state.timerSeconds > 0 && (
                  <div className="text-center mt-3 text-orange-400 text-sm font-semibold animate-pulse">
                    ⚠️ Hurry! Time running out
      </div>
                )}
                {urgency === 'critical' && state.timerSeconds > 0 && state.timerSeconds <= 5 && (
                  <div className="text-center mt-3 text-red-400 text-base font-bold animate-pulse">
                    🔥 FINAL SECONDS! 🔥
                  </div>
                )}
            </div>
            </div>

            {/* Current Price Card */}
            <div className="bg-gradient-to-br from-slate-800/50 to-indigo-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Current High Bid</div>
              <div className="text-5xl font-black text-white mb-4">
                ${currentHigh.toLocaleString()}
          </div>
              {state.highestBid && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>by {state.highestBid.user?.firstName || 'Bidder'}</span>
                  {state.highestBid.timestamp && (
                    <>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      <span>{new Date(state.highestBid.timestamp).toLocaleTimeString()}</span>
                    </>
                  )}
        </div>
              )}
              {!state.highestBid && state.currentCar && (
                <div className="text-sm text-slate-400">
                  No bids yet. Minimum bid: ${state.currentCar.minPreBid?.toLocaleString() || '0'}
                </div>
              )}
          </div>

            {/* Bid Placement Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Gavel className="h-5 w-5 mr-2 text-blue-400" />
                Place Your Bid
              </h3>
              
              {/* Bid Input */}
              <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bid Amount
              </label>
              <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={minimumBid.toLocaleString()}
                    disabled={!state.currentCar || !isConnected || !state.isLive || state.auctionCompleted || viewDetailsMode}
                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-white/20 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
                <p className="text-xs text-slate-400 mt-2">
                  Minimum bid: ${minimumBid.toLocaleString()}
              </p>
            </div>

            {/* Quick Bid Buttons */}
              <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quick Bid
              </label>
              <div className="grid grid-cols-2 gap-2">
                  {quickBidAmounts.slice(0, 6).map((amount) => (
                  <button
                    key={amount}
                      onClick={() => handlePlaceBid(amount)}
                      disabled={isPlacingBid || !state.currentCar || !state.isLive || !state.currentCar?.isActive || state.auctionCompleted || viewDetailsMode}
                      className="py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-white/20 hover:border-blue-400/30 rounded-lg text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Place Bid Button */}
            <button
                onClick={() => {
                  const amount = parseFloat(bidAmount);
                  if (!isNaN(amount)) {
                    handlePlaceBid(amount);
                  }
                }}
                disabled={isPlacingBid || !bidAmount || !state.currentCar || !state.isLive || !state.currentCar?.isActive || state.auctionCompleted || viewDetailsMode}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg shadow-lg hover:shadow-xl"
            >
              {isPlacingBid ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Placing Bid...</span>
                  </>
              ) : (
                  <>
                    <Gavel className="h-5 w-5" />
                    <span>Place Bid</span>
                  </>
              )}
            </button>

              {/* Status Messages */}
              {!state.isLive && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                  <p className="text-sm text-yellow-400 font-medium">Auction not live yet</p>
          </div>
              )}
              {/* Auction Status Messages */}
              {!state.isLive && state.currentCar && (
                <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                  <div className="h-5 w-5 text-orange-400 mx-auto mb-1">⏸️</div>
                  <p className="text-sm text-orange-400 font-medium">Auction Not Live</p>
                  <p className="text-xs text-orange-300 mt-1">Waiting for auctioneer to start this lot</p>
                </div>
              )}
              {!state.currentCar && state.auction && state.auctionCompleted && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                  <div className="h-5 w-5 text-green-400 mx-auto mb-1">🏁</div>
                  <p className="text-sm text-green-400 font-medium">Auction Completed</p>
                  <p className="text-xs text-green-300 mt-1">All lots have been processed</p>
                </div>
              )}
              {!state.currentCar && state.auction && !state.auctionCompleted && (
                <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                  <div className="h-5 w-5 text-orange-400 mx-auto mb-1">⏸️</div>
                  <p className="text-sm text-orange-400 font-medium">Auction Not Active</p>
                  <p className="text-xs text-orange-300 mt-1">Waiting for auctioneer to start</p>
                </div>
              )}
              {!isConnected && !isConnecting && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                  <WifiOff className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <p className="text-sm text-red-400 font-medium">SignalR disconnected ({connectionState})</p>
                  <p className="text-xs text-red-300 mt-1">Bidding available via REST API fallback</p>
                </div>
              )}
              {isConnecting && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                  <RefreshCw className="h-5 w-5 text-yellow-400 mx-auto mb-1 animate-spin" />
                  <p className="text-sm text-yellow-400 font-medium">Connecting to server...</p>
                  <p className="text-xs text-yellow-300 mt-1">Establishing real-time connection</p>
        </div>
              )}
      </div>

      {/* ========================================
          AUCTION COMPLETED MODAL
          ======================================== */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-white/20 max-w-md w-full mx-auto shadow-2xl">
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="text-6xl mb-6">🏁</div>
              
              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-4">Auction Completed!</h2>
              
              {/* Message */}
              <p className="text-slate-300 mb-4 text-lg leading-relaxed">
                <span className="text-blue-400 font-semibold">{state.auction?.name}</span> has finished.
                All lots have been processed.
              </p>
              
              {/* Connection Status */}
              <div className="flex items-center justify-center space-x-2 text-sm mb-6">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Connection Active - Ready for New Auctions</span>
              </div>
              
              {/* Stats */}
              {state.stats.totalCars > 0 && (
                <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-400">{state.stats.soldCars}</div>
                      <div className="text-xs text-slate-400">Lots Sold</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-400">{state.stats.totalCars}</div>
                      <div className="text-xs text-slate-400">Total Lots</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message */}
              <p className="text-slate-400 mb-8 text-sm">
                You can browse other available auctions or view this auction's details.
              </p>
              
              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGoToAllAuctions}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Browse Other Auctions
                </button>
                <button
                  onClick={handleModalClose}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  View Auction Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Bid History Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    <span className="font-bold text-white">Bid History</span>
            </div>
                  <span className="text-sm text-slate-400">{state.bidHistory.length} bids</span>
            </div>
          </div>
              <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                {state.bidHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No bids yet. Be the first!</p>
              </div>
            ) : (
                  <div className="space-y-2">
                    {state.bidHistory.map((bid, index) => {
                      const isHighest = index === 0;
                      const isUser = bid.userId === state.auction?.createdByUserId;
                      
                      return (
                <div
                  key={bid.id}
                          className={`p-3 rounded-xl border transition-all duration-200 ${
                            isHighest
                              ? 'bg-green-500/10 border-green-500/40 ring-1 ring-green-500/20'
                              : isUser
                      ? 'bg-blue-500/10 border-blue-500/30'
                              : 'bg-slate-700/20 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                isHighest
                                  ? 'bg-green-500 text-white'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {index + 1}
                      </div>
                      <div>
                                <div className="text-lg font-bold text-white">
                          ${bid.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400">
                                  {bid.user?.firstName || 'Bidder'} {bid.user?.lastName?.[0] || ''}
                                  {isUser && <span className="ml-1 text-blue-400">(You)</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                                {new Date(bid.timestamp).toLocaleTimeString()}
                      </div>
                              {isHighest && (
                                <div className="text-xs font-bold text-green-400 flex items-center mt-1">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  LEADING
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

            {/* Statistics Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Auction Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{state.stats.totalBids}</div>
                  <div className="text-xs text-slate-400 mt-1">Total Bids</div>
        </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{state.stats.uniqueBidders}</div>
                  <div className="text-xs text-slate-400 mt-1">Bidders</div>
      </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{state.stats.totalCars}</div>
                  <div className="text-xs text-slate-400 mt-1">Total Cars</div>
            </div>
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">{state.stats.soldCars}</div>
                  <div className="text-xs text-slate-400 mt-1">Sold</div>
          </div>
            </div>
          </div>
        </div>
      </div>
          </div>

      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md mx-4 text-center">
            <div className="mb-6">
              <RefreshCw className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Auction Update</h2>
              <p className="text-slate-300 text-lg">{transitionMessage}</p>
            </div>
            
            {/* Progress indicator */}
            <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
            
            <p className="text-slate-400 text-sm">Please wait...</p>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default LiveAuctionPage;

