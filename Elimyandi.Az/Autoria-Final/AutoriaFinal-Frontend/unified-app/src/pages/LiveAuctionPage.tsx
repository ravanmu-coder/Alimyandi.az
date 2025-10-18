import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Car,
  Wifi,
  WifiOff,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSignalR } from '../hooks/useSignalR';
import { SignalREvents } from '../utils/signalRManager';
import { apiClient } from '../lib/api';
import { getEnumLabel } from '../services/enumService';
import DynamicBidButton from '../components/DynamicBidButton';
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
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [viewDetailsMode, setViewDetailsMode] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedGroupsRef = useRef(false);
  
  // ✅ Refs for SignalR methods to break circular dependencies
  const joinAuctionCarRef = useRef<((auctionCarId: string) => Promise<void>) | null>(null);
  const signalRHookRef = useRef<any>(null);

  // ========================================
  // SIGNALR CONNECTION
  // ========================================

  // ✅ CRITICAL FIX: Memoize events to prevent re-registration on every render
  const signalREvents = useMemo<SignalREvents>(() => ({
      // JoinedAuction - Handle initial auction join
      onJoinedAuction: (data: any) => {
        console.log('✅ [PAGE] JoinedAuction event received:', data);
        
        // ✅ CRITICAL FIX: Use server's authoritative isLive status
        const serverIsLive = data.isLive === true;
        console.log(`🔴 [PAGE] Server says auction isLive: ${serverIsLive}`);
        console.log(`🔴 [PAGE] Full JoinedAuction data:`, JSON.stringify(data, null, 2));
        
        // Set initial timer and state
        if (data.currentTimer && data.currentTimer.remainingSeconds !== undefined) {
          console.log(`⏰ [PAGE] Initial auction timer: ${data.currentTimer.remainingSeconds}s`);
          setState(prev => ({
            ...prev,
            timerSeconds: data.currentTimer.remainingSeconds,
            isLive: serverIsLive, // ✅ Use server's authoritative status
            auctionState: data.auctionState || prev.auctionState
          }));
        } else {
          // Even without timer, set live status from server
          setState(prev => ({
            ...prev,
            isLive: serverIsLive // ✅ Use server's authoritative status
          }));
        }
        
        // ✅ DEBUG: Log current state after update
        setTimeout(() => {
          console.log(`🔍 [DEBUG] State after JoinedAuction:`, {
            isLive: serverIsLive,
            timerSeconds: data.currentTimer?.remainingSeconds,
            auctionStatus: data.auctionState?.status,
            currentCarLotNumber: data.currentCarLotNumber
          });
        }, 100);
      },
      
      // JoinedAuctionCar - Handle initial car join with bid history
      onJoinedAuctionCar: (data: any) => {
        console.log('✅ [PAGE] JoinedAuctionCar event received:', {
          carId: data.auctionCarId,
          highestBid: data.highestBid?.amount,
          bidCount: data.recentBids?.length || data.bidHistory?.length,
          minimumBid: data.minimumBid
        });
        
        // Update bid history with initial data
        if (data.recentBids || data.bidHistory) {
          const bids = data.recentBids || data.bidHistory;
          console.log(`📊 [PAGE] Loading initial bid history: ${bids.length} bids`);
          
          setState(prev => ({
            ...prev,
            bidHistory: bids,
            highestBid: data.highestBid || null
          }));
        }
      },
      
      // Car moved to next lot (from AuctionService.AdvanceToNextCarAsync)
      onCarMoved: (data: any) => {
        console.log('🚗 Car Moved (AuctionService):', data);
        
        // ✅ COPART LOGIC: Use server's authoritative state
        const serverIsLive = data.newState?.isLive === true;
        const nextLotNumber = data.nextLotNumber;
        const nextCarId = data.nextCarId;
        
        console.log(`🔄 Car Move: ${data.previousLotNumber} → ${nextLotNumber}, Live: ${serverIsLive}`);
        
        if (nextCarId && joinAuctionCarRef.current) {
          // Re-join the new car group to get server-authoritative snapshot
          joinAuctionCarRef.current(nextCarId).then(async () => {
            console.log('✅ Joined new car group after move');
            
            // Get fresh snapshot from AuctionCarService
            try {
              const newCarSnapshot = await apiClient.getAuctionCar(nextCarId);
              if (newCarSnapshot) {
                // ✅ Use server's exact timer state and live status
                const serverTimer = (newCarSnapshot as any).remainingTimeSeconds || 
                                  (newCarSnapshot as any).secondsRemaining || 0;
                
                setState(prev => ({
                  ...prev,
                  currentCar: newCarSnapshot,
                  activeLot: prev.lotQueue.find(lot => lot.id === newCarSnapshot.id) || null,
                  isLive: serverIsLive, // ✅ Use server's authoritative live status
                  timerSeconds: serverTimer // Server-authoritative timer
                }));
                
                toast.success(`🔄 Moved to Lot #${nextLotNumber}`, {
                  duration: 4000
                });
              }
            } catch (err) {
              console.error('❌ Failed to get new car snapshot:', err);
            }
          }).catch(err => {
            console.error('❌ Failed to join new car group:', err);
          });
        } else {
          // ✅ Even without car data, update live status from server
          setState(prev => ({
            ...prev,
            isLive: serverIsLive // ✅ Use server's authoritative live status
          }));
          
          toast.success(`🔄 Moved to Lot #${nextLotNumber}`, {
            duration: 4000
          });
        }
      },

      // Auction started (server-authoritative like Copart)
      onAuctionStarted: (data: any) => {
        console.log('🚀 [REAL-TIME] Auction Started (Server-Authoritative):', data);
        
        // ✅ COPART LOGIC: Use server's authoritative state
        const serverIsLive = data.isLive === true || data.newState?.isLive === true;
        console.log(`🚀 Auction Started: Live=${serverIsLive}`);
        
        // Server started auction - all users should see this immediately
        if (data.auctionCarId || data.snapshot) {
          const carId = data.auctionCarId || data.snapshot?.auctionCarId;
          const snapshot = data.snapshot;
          
          if (carId && joinAuctionCarRef.current) {
            // Join the started car group immediately
            joinAuctionCarRef.current(carId).then(async () => {
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
                    isLive: serverIsLive, // ✅ Use server's authoritative live status
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
        console.log('⏰ [REAL-TIME] Timer Tick:', {
          auctionId: data.auctionId,
          remainingSeconds: data.remainingSeconds,
          timerSeconds: data.timerSeconds,
          currentCarLotNumber: data.currentCarLotNumber,
          isExpired: data.isExpired,
          isLive: data.isLive,
          timeDisplay: data.timeDisplay
        });
        
        // ✅ COPART LOGIC: Server sends exact timer value
        const serverTimerValue = data.remainingSeconds ?? 0;
        const serverIsLive = data.isLive === true;
        
        // Track that we're receiving events (connection is working)
        lastEventTimeRef.current = Date.now();
        hasReceivedEventsRef.current = true;
        
        // ✅ Always update timer and live status from server
        setState(prev => {
          console.log(`⏱️ Updating timer: ${prev.timerSeconds}s → ${serverTimerValue}s, Live: ${prev.isLive} → ${serverIsLive}`);
          return {
            ...prev,
            timerSeconds: serverTimerValue,
            isLive: serverIsLive // ✅ Update live status from timer tick
          };
        });
        
        // Stop any client-side timer since server sends every second
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // ✅ Handle timer expiry
        if (serverTimerValue === 0 && serverIsLive) {
          console.log('⏰ [SERVER] Timer expired - will auto-move to next car');
        }
      },

      // Timer reset - when new bid placed
      onAuctionTimerReset: (data: any) => {
        console.log('🔄 [REAL-TIME] Timer Reset:', {
          newTimerSeconds: data.newTimerSeconds,
          secondsRemaining: data.secondsRemaining,
          resetBy: data.resetBy,
          fullData: data
        });
        
        // ✅ Always update timer to FULL duration (30 seconds) - server is authoritative
        const resetTimerValue = data.newTimerSeconds ?? data.secondsRemaining ?? 30;
        
        setState(prev => ({
          ...prev,
          timerSeconds: resetTimerValue
        }));
        
        // Stop any client-side timer since server will send ticks
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        console.log(`✅ Timer reset to ${resetTimerValue}s by ${data.resetBy || 'server'}`);
        toast(`🔄 Timer reset to ${resetTimerValue}s`, { icon: '⏰', duration: 2000 });
      },

      // New live bid - Real-time sync for all users
      onNewLiveBid: (data: any) => {
        console.log('💰 [REAL-TIME] New Live Bid Received:', {
          bidId: data.id || data.Id,
          auctionCarId: data.auctionCarId || data.AuctionCarId,
          userId: data.userId || data.UserId,
          amount: data.amount || data.Amount,
          userName: data.userName || data.UserName,
          placedAt: data.placedAtUtc || data.PlacedAtUtc,
          isHighest: data.isHighestBid || data.IsHighestBid,
          fullData: data
        });
        
        // ✅ Extract bid data - support multiple formats
        const bidData = {
          id: data.id || data.Id || data.bidId,
          auctionCarId: data.auctionCarId || data.AuctionCarId,
          userId: data.userId || data.UserId,
          amount: data.amount || data.Amount,
          userName: data.userName || data.UserName || 'Bidder',
          placedAtUtc: data.placedAtUtc || data.PlacedAtUtc || new Date().toISOString(),
          isHighestBid: data.isHighestBid ?? data.IsHighestBid ?? true
        };
        
        // ✅ Only update if this bid is for current car
        if (bidData.auctionCarId === state.currentCar?.id) {
          console.log('✅ Bid is for current car - updating state');
          
          // Create bid object for history
          const bidForHistory: BidGetDto = {
            id: bidData.id,
            auctionCarId: bidData.auctionCarId,
            userId: bidData.userId,
            amount: bidData.amount,
            bidType: 'Live',
            timestamp: bidData.placedAtUtc,
            isWinning: bidData.isHighestBid,
            isOutbid: false,
            user: {
              id: bidData.userId,
              email: '',
              firstName: bidData.userName,
              lastName: ''
            }
          };
          
          setState(prev => ({
            ...prev,
            // Update bid history
            bidHistory: [bidForHistory, ...prev.bidHistory.slice(0, 19)],
            // Update highest bid if this is highest
            highestBid: bidData.isHighestBid ? bidForHistory : prev.highestBid,
            // Update current price
            currentCar: prev.currentCar ? {
              ...prev.currentCar,
              currentPrice: bidData.amount,
              bidCount: (prev.currentCar.bidCount || 0) + 1
            } : null
          }));
          
          // Show toast notification
          toast.success(`💰 New bid: $${bidData.amount.toLocaleString()} by ${bidData.userName}`, {
            icon: '🎯',
            duration: 3000
          });
          
          console.log(`✅ State updated - New price: $${bidData.amount}`);
        } else {
          console.log('⚠️ Bid is for different car, ignoring');
        }
      },

      // Pre-bid placed
      onPreBidPlaced: (data: any) => {
        console.log('📝 Pre-Bid Placed:', data);
        if (data.bid) {
          handleNewBid(data.bid, false);
        }
      },
      
      // Highest bid updated - Real-time sync
      onHighestBidUpdated: (data: any) => {
        console.log('🏆 [REAL-TIME] Highest Bid Updated:', {
          auctionCarId: data.auctionCarId || data.AuctionCarId,
          amount: data.amount || data.Amount,
          bidderId: data.bidderId || data.BidderId,
          bidderName: data.bidderName || data.BidderName,
          nextMinimum: data.nextMinimum,
          fullData: data
        });
        
        const carId = data.auctionCarId || data.AuctionCarId;
        const amount = data.amount || data.Amount;
        const bidderName = data.bidderName || data.BidderName || 'Bidder';
        
        // ✅ Only update if for current car
        if (carId === state.currentCar?.id) {
          console.log(`✅ Updating highest bid to $${amount} by ${bidderName}`);
          
          setState(prev => ({
            ...prev,
            currentCar: prev.currentCar ? {
              ...prev.currentCar,
              currentPrice: amount
            } : null,
            highestBid: prev.highestBid ? {
              ...prev.highestBid,
              amount: amount,
              user: {
                ...prev.highestBid.user,
                firstName: bidderName
              }
            } : null
          }));
        } else {
          console.log('⚠️ Highest bid update for different car, ignoring');
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
      onConnectionStateChanged: async (state, error) => {
        console.log('🔌 Connection State Changed:', {
          state,
          error,
          isConnected: state === 'Connected',
          timestamp: new Date().toISOString()
        });
        
        if (error) {
          toast.error(`Connection Error: ${error}`);
        }
        
        // When reconnected, re-sync timer state
        if (state === 'Connected' && hasJoinedGroupsRef.current && auctionId) {
          console.log('🔄 Reconnected - re-syncing timer state...');
          try {
            const timerInfo = await apiClient.getAuctionTimer(auctionId);
            if (timerInfo) {
              setState(prev => ({
                ...prev,
                timerSeconds: timerInfo.timerSeconds,
                isLive: timerInfo.isLive
              }));
              console.log(`✅ Re-synced timer: ${timerInfo.timerSeconds}s, Live: ${timerInfo.isLive}`);
            }
          } catch (err) {
            console.warn('⚠️ Failed to re-sync timer on reconnect:', err);
          }
        }
        
        if (state === 'Connected') {
          console.log('✅ Connected - group joining will be handled by useEffect');
        }
      }
    }), []); // ✅ Empty dependency array - events are stable

  // ✅ Create SignalR hook with memoized events
  const signalRHook = useSignalR({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7249',
    token: localStorage.getItem('authToken') || '',
    autoConnect: true,
    events: signalREvents
  });

  // Destructure hook values
  const {
    isConnected,
    isConnecting,
    connectionState,
    lastError,
    joinAuction,
    joinAuctionCar,
    placeLiveBid
  } = signalRHook;
  
  // ✅ Update refs after hook is created
  joinAuctionCarRef.current = joinAuctionCar;
  signalRHookRef.current = signalRHook;

  // Track if we're receiving events (indicates connection is actually working)
  const lastEventTimeRef = useRef<number>(0);
  const hasReceivedEventsRef = useRef(false);
  const reconnectAttemptedRef = useRef(false);
  
  // Force connection check on mount and periodically
  useEffect(() => {
    console.log('🔄 Forcing initial connection state check...');
    
    // Check state immediately
    const checkState = () => {
      console.log('📊 Current SignalR State:', {
        isConnected,
        connectionState,
        isConnecting,
        lastError,
        receivingEvents: hasReceivedEventsRef.current,
        timeSinceLastEvent: Date.now() - lastEventTimeRef.current
      });
    };
    
    checkState();
    
    // Recheck after delays to catch late updates
    const timeout1 = setTimeout(checkState, 2000);
    const timeout2 = setTimeout(checkState, 5000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [isConnected, connectionState, isConnecting, lastError]);

  // Debug connection state and force re-check
  useEffect(() => {
    console.log('🔍 SignalR Status Update:', {
      isConnected,
      isConnecting,
      connectionState,
      lastError,
      timestamp: new Date().toISOString()
    });
    
    // Log the actual state values for debugging
    console.log('🔍 Detailed State:', {
      'isConnected (boolean)': isConnected,
      'isConnecting (boolean)': isConnecting,
      'connectionState (string)': connectionState,
      'hasJoinedGroups': hasJoinedGroupsRef.current,
      'auctionId': auctionId,
      'currentCarId': state.currentCar?.id
    });
    
    // Alert if there's a mismatch between connectionState string and isConnected boolean
    if (connectionState === 'Connected' && !isConnected) {
      console.error('⚠️ STATE MISMATCH: connectionState is "Connected" but isConnected is false!');
      console.error('⚠️ This indicates a problem with the useSignalR hook state management');
    }
    
    if (connectionState !== 'Connected' && isConnected) {
      console.error('⚠️ STATE MISMATCH: isConnected is true but connectionState is not "Connected"!');
      console.error('⚠️ Current connectionState:', connectionState);
    }
  }, [isConnected, isConnecting, connectionState, lastError, auctionId, state.currentCar?.id]);

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
        } else {
          console.log('ℹ️ No photos available from endpoint, using fallback sources');
        }
      } catch (photosError) {
        // ✅ Silently handle photo errors - don't break auction functionality
        console.log('ℹ️ Photos endpoint unavailable, using fallback (this is OK)');
        
        if (photosError instanceof Error) {
          if (photosError.message.includes('404')) {
            console.log(`📷 Photo endpoint not found for carId: ${carId} - using default images`);
          } else {
            console.log(`📷 Photo load failed (${photosError.message}) - using default images`);
          }
        }
        
        // ✅ Fallback to car.photoUrls (already loaded from getCar or existing data)
        // No need to do anything else - UI will use existing photos or show placeholder
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

    // Join car group
    if (isConnected) {
      await joinAuctionCar(carDetails.id);
    }
  }, [isConnected, joinAuctionCar]);

  // Note: Removed periodic health check - rely purely on SignalR events for real-time updates.
  // All state changes (auction started, car moved, timer updates, auction ended) come through
  // SignalR events (onAuctionStarted, onCarMoved, onTimerTick, onAuctionEnded, etc.)

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

      // Note: SignalR group joining is now handled by a separate useEffect
      // that waits for the connection to be established before joining groups.
      // This ensures signals connect properly even if the page loads before
      // the connection is ready.

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
  }, [auctionId]);

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
    console.log('🎯 ========== BID ATTEMPT ==========');
    console.log('🎯 Attempting to place bid:', amount);
    console.log('📊 Current State:', {
      amount,
      hasCurrentCar: !!state.currentCar,
      currentCarId: state.currentCar?.id,
      isLive: state.isLive,
      isActive: state.currentCar?.isActive,
      auctionCompleted: state.auctionCompleted,
      viewDetailsMode: viewDetailsMode,
      isConnected,
      connectionState,
      timerSeconds: state.timerSeconds
    });

    if (!state.currentCar) {
      console.error('❌ No current car');
      toast.error('No active vehicle to bid on');
      return;
    }

    // Business logic validation - Only check critical conditions
    if (state.auctionCompleted || viewDetailsMode) {
      console.error('❌ Bid validation failed:', {
        isLive: state.isLive,
        isActive: state.currentCar.isActive,
        auctionCompleted: state.auctionCompleted,
        viewDetailsMode
      });
      
      if (state.auctionCompleted) {
        toast.error('Auction has completed - bidding is closed');
      } else if (viewDetailsMode) {
        toast.error('You are in details view mode - bidding is disabled');
      }
      return;
    }
    
    // Allow bidding even if isLive is false (backend will validate)
    if (!state.isLive) {
      console.warn('⚠️ State shows not live, but attempting bid anyway (backend will validate)');
    }

    // Calculate minimum bid (BidService logic)
    const currentHigh = state.highestBid?.amount || state.currentCar.currentPrice || (state.currentCar as any).startPrice || 0;
    const increment = state.auction?.minBidIncrement || 50;
    const minimumBid = Math.max(currentHigh + increment, (state.currentCar as any).minimumBid || 0);

    console.log('💰 Bid Validation:', {
      yourBid: amount,
      currentHigh: currentHigh,
      increment: increment,
      minimumRequired: minimumBid,
      isValid: amount >= minimumBid
    });

    if (amount < minimumBid) {
      toast.error(`❌ Minimum bid: $${minimumBid.toLocaleString()}. Your bid ($${amount.toLocaleString()}) is too low!`, {
        duration: 4000
      });
      console.error(`❌ Bid rejected: $${amount} < minimum $${minimumBid}`);
      return;
    }
    
    // Also check if bid is less than or equal to current high
    if (amount <= currentHigh) {
      toast.error(`❌ Your bid must be higher than current bid: $${currentHigh.toLocaleString()}`, {
        duration: 4000
      });
      console.error(`❌ Bid rejected: $${amount} <= current high $${currentHigh}`);
      return;
    }

    // ========================================
    // OPTIMISTIC UI UPDATE
    // ========================================
    // Dərhal UI-ı yenilə (server cavabı gözləmədən)
    console.log('⚡ Applying optimistic UI update...');
    
    const optimisticBid: BidGetDto = {
      id: `temp-${Date.now()}`, // Müvəqqəti ID
      auctionCarId: state.currentCar.id,
      userId: 'current-user', // Cari istifadəçi
      amount: amount,
      bidType: 'Live',
      timestamp: new Date().toISOString(),
      isWinning: true,
      isOutbid: false,
      user: {
        id: 'current-user',
        email: '',
        firstName: 'You',
        lastName: ''
      }
    };

    // UI-ı dərhal yenilə
    setState(prev => ({
      ...prev,
      highestBid: optimisticBid,
      currentCar: prev.currentCar ? {
        ...prev.currentCar,
        currentPrice: amount
      } : null,
      bidHistory: [optimisticBid, ...prev.bidHistory]
    }));

    console.log('✅ Optimistic update applied - UI updated instantly');

    setIsPlacingBid(true);

    try {
      const bidRequest = {
        auctionCarId: state.currentCar.id,
        amount: amount
      };

      if (isConnected && connectionState === 'Connected') {
        // Primary: Use SignalR BidHub.PlaceLiveBid
        console.log('📡 Using SignalR BidHub (calls BidService)');
        
        try {
          await placeLiveBid(state.currentCar.id, amount);
          
          toast.success(`✅ Bid placed: $${amount.toLocaleString()}`, {
            icon: '🎯',
            duration: 3000
          });
          
        } catch (signalRErr: any) {
          console.warn('⚠️ SignalR bid failed, trying REST API:', signalRErr);
          // Try REST API as fallback
          const response = await apiClient.placeLiveBid(bidRequest);
          console.log('✅ REST bid placed successfully:', response);
          
          toast.success(`✅ Bid placed via REST: $${amount.toLocaleString()}`, {
            icon: '🌐',
            duration: 3000
          });
          
          // Refresh data after REST bid
          setTimeout(() => {
            refreshBidHistory();
          }, 1000);
        }
        
      } else {
        // Fallback: Use REST API (BidController → BidService)
        console.log('🌐 Using REST API (not connected to SignalR)');
        
        const response = await apiClient.placeLiveBid(bidRequest);
        console.log('✅ REST bid placed successfully:', response);

        toast.success(`✅ Bid placed via REST: $${amount.toLocaleString()}`, {
          icon: '🌐',
          duration: 3000
        });
      
        // Refresh data after REST bid
        setTimeout(() => {
          refreshBidHistory();
        }, 1000);
      }

    } catch (err: any) {
      console.error('❌ Bid placement failed:', err);
      
      // ========================================
      // REVERT OPTIMISTIC UPDATE
      // ========================================
      // Xəta baş verdiyindən optimistic update-i geri qaytarırıq
      console.log('🔄 Reverting optimistic update due to error...');
      
      // Serverdən real məlumatları yüklə (async, bloklamır)
      setTimeout(async () => {
        if (state.currentCar) {
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
              } else {
                highestBid = highestBidResp as any;
              }
            }

            setState(prev => ({
              ...prev,
              bidHistory,
              highestBid: highestBid || prev.highestBid,
              currentCar: prev.currentCar ? {
                ...prev.currentCar,
                currentPrice: highestBid?.amount || prev.currentCar.currentPrice
              } : null
            }));

            console.log('✅ State reverted to server data');
          } catch (refreshErr) {
            console.error('⚠️ Failed to refresh bid data:', refreshErr);
          }
        }
      }, 100);
      
      // Handle specific BidService validation errors
      if (err.message?.includes('minimum') || err.message?.includes('increment')) {
        toast.error(`❌ Bid rejected - minimum: $${minimumBid.toLocaleString()}`);
      } else if (err.message?.includes('unauthorized') || err.message?.includes('pre-bid')) {
        toast.error('❌ You must place a pre-bid first to participate');
      } else if (err.message?.includes('stale') || err.message?.includes('moved')) {
        toast.error('❌ Bid rejected - auction has moved on');
      } else if (err.message?.includes('not connected') && !isConnected) {
        // Try REST API as final fallback
        try {
          console.log('🔄 Final fallback to REST API');
          const bidRequest = {
            auctionCarId: state.currentCar.id,
            amount: amount
          };
          
          await apiClient.placeLiveBid(bidRequest);
          toast.success(`✅ Bid placed via REST: $${amount.toLocaleString()}`);
          
          // Uğurlu olduğu üçün refresh et
          setTimeout(() => {
            refreshBidHistory();
          }, 500);
          
        } catch (restErr) {
          toast.error('❌ Connection failed - please refresh page');
        }
      } else {
        toast.error(err.message || '❌ Failed to place bid');
      }
    } finally {
      setIsPlacingBid(false);
    }
  }, [state.currentCar, state.highestBid, state.auction, state.isLive, isConnected, connectionState, placeLiveBid, state.auctionCompleted, viewDetailsMode]);

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

  // ========================================
  // CLIENT-SIDE TIMER COMPLETELY DISABLED
  // Server is 100% authoritative - sends TimerTick every second
  // ========================================
  useEffect(() => {
    console.log(`⏰ [SERVER-AUTHORITATIVE] Timer State: ${state.timerSeconds}s`);
    console.log(`🎨 UI Display: ${formatTime(state.timerSeconds)}`);
    
    // ✅ Only handle timer expiry and warnings - NO client-side countdown
    if (state.timerSeconds === 0 && state.isLive && state.currentCar) {
      console.log('⏰ [SERVER] Timer expired - handling expiry');
      setTimeout(() => {
        handleTimerExpired();
      }, 1000);
    }
    
    // Warning sounds based on server timer
    if (state.timerSeconds === 10 || state.timerSeconds === 5) {
      console.log(`⚠️ [SERVER] Timer warning: ${state.timerSeconds}s remaining`);
      playWarningSound();
    }
    
    // ✅ Cleanup any client timer (should never exist but safety check)
    return () => {
      if (timerIntervalRef.current) {
        console.warn('🚨 Client timer found and cleared - should not exist!');
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
  // NEXT BID CALCULATION
  // ========================================

  const minimumBid = useMemo(() => {
    const currentHigh = state.highestBid?.amount || state.currentCar?.currentPrice || state.currentCar?.minPreBid || 0;
    const increment = state.auction?.minBidIncrement || 100;
    const minimum = currentHigh + increment;

    console.log('💰 Next Bid Calculation:', {
      currentHigh,
      increment,
      minimumBid: minimum
    });

    return minimum;
  }, [state.highestBid?.amount, state.currentCar?.currentPrice, state.currentCar?.minPreBid, state.auction?.minBidIncrement]);




  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Reset hasJoinedGroups when disconnected
  useEffect(() => {
    if (!isConnected && hasJoinedGroupsRef.current) {
      console.log('🔄 Disconnected - resetting hasJoinedGroups flag');
      hasJoinedGroupsRef.current = false;
    }
  }, [isConnected]);

  // Join SignalR groups when connection is established (runs once per connection)
  useEffect(() => {
    const joinSignalRGroups = async () => {
      // Only proceed if we have auction ID and connection is ready
      if (!auctionId || !isConnected) {
        console.log('⏸️ Not ready to join groups:', { auctionId, isConnected });
        return;
      }

      // Prevent multiple joins - only join once per page load
      if (hasJoinedGroupsRef.current) {
        console.log('✅ Already joined groups, skipping...');
        return;
      }

      try {
        console.log('🔌 Connection ready, joining SignalR groups...');
        hasJoinedGroupsRef.current = true;
        
        // Join auction group
        await joinAuction(auctionId);
        console.log('✅ Joined auction group:', auctionId);
        
        // Check auction status and join active car if needed
        try {
          // Get both auction status and timer info for perfect sync
          const [auctionStatus, timerInfo] = await Promise.all([
            apiClient.getAuctionStatus(auctionId),
            apiClient.getAuctionTimer(auctionId).catch(() => null)
          ]);
          
          console.log('📊 Auction Status:', auctionStatus);
          console.log('⏱️ Timer Info:', timerInfo);
          
          if (auctionStatus.activeCarId) {
            // Join the active car group
            await joinAuctionCar(auctionStatus.activeCarId);
            console.log('✅ Joined active car group:', auctionStatus.activeCarId);
            
            // Get fresh snapshot to sync state
            try {
              const activeCarSnapshot = await apiClient.getAuctionCar(auctionStatus.activeCarId);
              if (activeCarSnapshot) {
                // Load proper car details and images
                let updatedSnapshot = { ...activeCarSnapshot };
                
                const carId = activeCarSnapshot.car?.id || activeCarSnapshot.carId;
                if (carId) {
                  // Load full car details
                  try {
                    const fullCarData = await apiClient.getCar(carId);
                    if (updatedSnapshot.car) {
                      updatedSnapshot.car = { ...updatedSnapshot.car, ...fullCarData };
                    } else {
                      updatedSnapshot.car = fullCarData;
                    }
                  } catch (carError) {
                    console.warn('⚠️ Failed to load full car details:', carError);
                  }
                  
                  // Load car photos
                  try {
                    const photos = await apiClient.getCarPhotos(carId);
                    if (photos && photos.length > 0) {
                      if (updatedSnapshot.car) {
                        updatedSnapshot.car = { ...updatedSnapshot.car, photoUrls: photos } as any;
                      } else {
                        (updatedSnapshot as any).photoUrls = photos;
                      }
                    }
                  } catch (photosError) {
                    console.warn('⚠️ Photos endpoint failed:', photosError);
                  }
                }
                
                // Use timer info from dedicated endpoint for most accurate sync
                // Backend returns both 'timerSeconds' (duration) and 'remainingSeconds' (current)
                const timerData = timerInfo as any;
                const serverTimer = timerData?.remainingSeconds ??  // Prefer actual remaining time
                                  timerInfo?.timerSeconds ?? 
                                  (activeCarSnapshot as any).remainingTimeSeconds ?? 
                                  (activeCarSnapshot as any).secondsRemaining ?? 0;
                
                // ✅ CRITICAL FIX: Use server's authoritative isLive status
                // Don't override server's decision with complex client-side logic
                const serverIsLive = timerInfo?.isLive === true || activeCarSnapshot.isActive === true;
                console.log(`🔴 [PAGE] Server authoritative isLive: ${serverIsLive} (timerInfo.isLive: ${timerInfo?.isLive}, activeCarSnapshot.isActive: ${activeCarSnapshot.isActive})`);
                
                // Only consider live if server says so AND we have valid timer data
                const hasActiveCar = timerInfo?.currentCarLotNumber != null || activeCarSnapshot.isActive;
                const timerNotExpired = serverTimer > 0 && !(timerData?.isExpired);
                const isAuctionLive = serverIsLive && hasActiveCar && timerNotExpired;
                
                console.log('⏱️ Timer Sync Details:', {
                  remainingSeconds: timerData?.remainingSeconds,
                  timerSeconds: timerInfo?.timerSeconds,
                  isExpired: timerData?.isExpired,
                  currentCarLotNumber: timerInfo?.currentCarLotNumber,
                  timeDisplay: timerData?.timeDisplay,
                  hasActiveCar,
                  calculatedTimer: serverTimer,
                  isLive: isAuctionLive
                });
                
                setState(prev => ({
                  ...prev,
                  currentCar: updatedSnapshot,
                  activeLot: prev.lotQueue.find(lot => lot.id === activeCarSnapshot.id) || null,
                  isLive: isAuctionLive,
                  timerSeconds: serverTimer,
                  auctionCompleted: false,
                  showCompletedModal: false,
                  viewDetailsMode: false
                }));
                
                console.log(`✅ Synced - Timer: ${serverTimer}s, Live: ${isAuctionLive}`);
              }
            } catch (snapshotErr) {
              console.error('❌ Failed to get active car snapshot:', snapshotErr);
            }
          } else if (auctionStatus.allFinished) {
            // Auction completed
            setState(prev => ({
              ...prev,
              auctionCompleted: true,
              currentCar: null,
              activeLot: null,
              isLive: false
            }));
            setShowCompletedModal(true);
          }
        } catch (statusErr: any) {
          console.warn('⚠️ Failed to get auction status:', statusErr);
          // Even if status check fails, we've joined the auction group
          // and will receive events
        }
        
      } catch (error) {
        console.error('❌ Failed to join SignalR groups:', error);
        hasJoinedGroupsRef.current = false; // Allow retry on next connection
      }
    };
    
    joinSignalRGroups();
  }, [auctionId, isConnected, joinAuction, joinAuctionCar]);

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
                {/* Connection Icon based on ACTUAL connectionState string */}
                {connectionState === 'Connected' ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : connectionState === 'Connecting' || connectionState === 'Reconnecting' ? (
                  <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm text-white">
                  {state.auctionCompleted ? 'Auction Completed' : 
                   viewDetailsMode ? 'Details View' :
                   connectionState === 'Connected' ? 'Connected & Synced' : 
                   connectionState === 'Connecting' ? 'Connecting...' : 
                   connectionState === 'Reconnecting' ? 'Reconnecting...' :
                   'Disconnected'}
                </span>
                {/* Debug info - show actual state */}
                <span className="text-xs text-slate-400">
                  ({connectionState})
                  {state.currentCar && ` - Lot #${state.currentCar.lotNumber}`}
                  {hasJoinedGroupsRef.current ? ' - Joined' : ' - Not Joined'}
                </span>
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-slate-500 ml-2">
                    [{isConnected ? '✓' : '✗'}/{isConnecting ? '⟳' : '○'}]
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

            {/* Dynamic Bid Button */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <DynamicBidButton
                nextBidAmount={minimumBid}
                remainingSeconds={state.timerSeconds}
                timerDuration={state.auction?.timerSeconds || 60}
                isDisabled={!state.currentCar || !state.isLive || state.auctionCompleted || viewDetailsMode}
                isPlacing={isPlacingBid}
                onBid={handlePlaceBid}
                currencySymbol="$"
              />
              
              {/* Status Messages */}
              {!state.isLive && state.currentCar && (
                <div className="px-6 pb-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                    <AlertCircle className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-sm text-orange-400 font-medium">Auction Not Live</p>
                    <p className="text-xs text-orange-300 mt-1">Waiting for auctioneer to start this lot</p>
                  </div>
                </div>
              )}
              {!state.currentCar && state.auction && state.auctionCompleted && (
                <div className="px-6 pb-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-1" />
                    <p className="text-sm text-green-400 font-medium">Auction Completed</p>
                    <p className="text-xs text-green-300 mt-1">All lots have been processed</p>
                  </div>
                </div>
              )}
              {!state.currentCar && state.auction && !state.auctionCompleted && (
                <div className="px-6 pb-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                    <AlertCircle className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-sm text-orange-400 font-medium">Auction Not Active</p>
                    <p className="text-xs text-orange-300 mt-1">Waiting for auctioneer to start</p>
                  </div>
                </div>
              )}
              {/* Connection Status */}
              {connectionState !== 'Connected' && connectionState !== 'Connecting' && connectionState !== 'Reconnecting' && (
                <div className="px-6 pb-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                    <WifiOff className="h-5 w-5 text-red-400 mx-auto mb-1" />
                    <p className="text-sm text-red-400 font-medium">Connection Issue: {connectionState}</p>
                    <p className="text-xs text-red-300 mt-1">
                      {lastError || 'Bidding available via REST API fallback'}
                    </p>
                    <div className="flex gap-2 justify-center mt-2">
                      <button
                        onClick={() => {
                          console.log('🔄 Manual reconnect triggered');
                          signalRHook.reconnect().then(() => {
                            console.log('✅ Reconnect complete');
                          }).catch(err => {
                            console.error('❌ Reconnect failed:', err);
                          });
                        }}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Try Reconnect
                      </button>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {(connectionState === 'Connecting' || connectionState === 'Reconnecting') && (
                <div className="px-6 pb-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                    <RefreshCw className="h-5 w-5 text-yellow-400 mx-auto mb-1 animate-spin" />
                    <p className="text-sm text-yellow-400 font-medium">
                      {connectionState === 'Reconnecting' ? 'Reconnecting to server...' : 'Connecting to server...'}
                    </p>
                    <p className="text-xs text-yellow-300 mt-1">Establishing real-time connection</p>
                  </div>
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

