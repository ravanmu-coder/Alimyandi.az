import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import PhotoGallery from '../components/PhotoGallery';
import BiddingPanel from '../components/BiddingPanel';
import DetailTabs from '../components/DetailTabs';
import { ChevronLeft, AlertCircle, Car } from 'lucide-react';
import { calculateMinimumBid } from '../utils/bidCalculator';

// Types
interface CarDetailDto {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  odometer: number;
  estRetailValue: number;
  photoUrls: string[];
  condition: number;
  color: string;
  engine: string;
  transmission: number;
  driveTrain: number;
  titleType: number;
  damageType: number;
  locationId: string;
  description?: string;
}

interface LocationDto {
  id: string;
  name: string;
  city: string;
  region: string;
  postalCode: string;
}

interface AuctionDto {
  id: string;
  name: string;
  status: number;
  statusText?: string;
  startTimeUtc: string;
  endTimeUtc: string;
  minBidIncrement: number;
}

interface AuctionCarDto {
  id: string;
  auctionId: string;
  carId: string;
  lotNumber: string;
  currentPrice: number;
  startingPrice: number;
  reservePrice: number;
}

interface BidDto {
  id: string;
  amount: number;
  userId: string;
  userName?: string;
  createdAt: string;
  type: string;
  status: string;
}

interface BidResponse {
  success: boolean;
  data: BidDto[];
}


const CarDetail: React.FC = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast, removeToast } = useToast();
  const { user } = useAuth();

  // Check if user came from watchlist to place a bid
  const isBidIntent = searchParams.get('bid') === 'true';
  
  // Ref for bid input auto-focus
  const bidInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [carDetails, setCarDetails] = useState<CarDetailDto | null>(null);
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [auctionDetails, setAuctionDetails] = useState<AuctionDto | null>(null);
  const [auctionCar, setAuctionCar] = useState<AuctionCarDto | null>(null);
  const [bids, setBids] = useState<BidDto[]>([]);
  const [minimumNextBid, setMinimumNextBid] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [showBidMessage, setShowBidMessage] = useState(isBidIntent);
  
  // Cache to prevent duplicate requests
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load car details
  const loadCarDetails = async () => {
    if (!carId || dataLoaded || !mounted) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('CarDetail: fetching car', carId);

      // Load car details
      const car = await apiClient.getCar(carId);
      console.log('CarDetail: car loaded', car);
      if (!mounted) return;
      setCarDetails(car);

      // Load car photos (try dedicated endpoint first, fallback to carDto.photoUrls)
      try {
        const photos = await apiClient.getCarPhotos(carId);
        console.log('CarDetail: photos loaded from endpoint', photos);
        if (photos && photos.length > 0 && mounted) {
          setCarDetails(prev => prev ? { ...prev, photoUrls: photos } : null);
        }
      } catch (photosError) {
        console.warn('CarDetail: photos endpoint failed, using carDto.photoUrls', photosError);
        if (photosError instanceof Error && photosError.message.includes('404')) {
          console.warn(`Car photos 404 for carId: ${carId}`);
        }
      }

      // Load location details
      if (car.locationId && mounted) {
        try {
          const locationData = await apiClient.getLocation(car.locationId);
          console.log('CarDetail: location loaded', locationData);
          if (mounted) setLocation(locationData);
        } catch (locationError) {
          console.warn('CarDetail: location failed', locationError);
          if (mounted) setLocation(null);
        }
      }

      // Find auction data
      await findAuctionData(carId);
      
      if (mounted) setDataLoaded(true);
    } catch (error) {
      console.error('CarDetail: failed to load car details', error);
      if (mounted) {
        setError('Failed to load car details. Please try again later.');
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load car details. Please try again later.'
        });
      }
    } finally {
      if (mounted) setLoading(false);
    }
  };

  // Find auction data for this car
  const findAuctionData = async (carId: string) => {
    if (!mounted) return;
    
    try {
      console.log('CarDetail: searching for auction data');
      
      // Try preferred endpoint first: GET /api/AuctionCar/car/{carId}
      try {
        const auctionCarData = await apiClient.getAuctionCarByLot(carId);
        console.log('CarDetail: found auctionCar via direct lookup', auctionCarData);
        
        if (mounted) {
          // Transform AuctionCarDetailDto to AuctionCarDto
          const auctionCarDto: AuctionCarDto = {
            id: auctionCarData.id,
            auctionId: auctionCarData.auctionId,
            carId: auctionCarData.carId,
            lotNumber: auctionCarData.lotNumber || '',
            currentPrice: auctionCarData.currentPrice,
            startingPrice: auctionCarData.minPreBid || 0,
            reservePrice: auctionCarData.reservePrice || 0
          };
          setAuctionCar(auctionCarDto);
          
          // Load auction details
          const auction = await apiClient.getAuction(auctionCarData.auctionId);
          console.log('CarDetail: auction loaded', auction);
          if (mounted) {
            // Transform AuctionDetailDto to AuctionDto
            const auctionDto: AuctionDto = {
              id: auction.id,
              name: auction.name || 'Unknown Auction',
              status: auction.status === 'Live' ? 2 : auction.status === 'Scheduled' ? 1 : auction.status === 'Completed' ? 3 : 0,
              statusText: auction.status,
              startTimeUtc: auction.startTimeUtc,
              endTimeUtc: auction.endTimeUtc,
              minBidIncrement: auction.minBidIncrement
            };
            setAuctionDetails(auctionDto);
          }
          
          // Fetch next minimum bid from backend with fallback calculation
          try {
            console.log(`CarDetail: fetching next minimum bid for auctionCar ${auctionCarData.id}`);
            const response = await apiClient.getNextMinimumBid(auctionCarData.id);
            if (mounted) {
              // Handle both number and object response formats
              const nextMinBid = typeof response === 'number' ? response : response.nextMinimumBid;
              setMinimumNextBid(nextMinBid);
              console.log(`CarDetail: backend minimum bid set to ${nextMinBid}`);
            }
          } catch (minBidError) {
            console.error('CarDetail: failed to fetch next minimum bid, using local calculation', minBidError);
            // Fallback to local calculation using bidCalculator utility
            if (mounted) {
              const fallbackMinBid = calculateMinimumBid(
                auctionCarData.currentPrice, 
                auctionCarData.minPreBid || 0
              );
              setMinimumNextBid(fallbackMinBid);
              console.log(`CarDetail: using local calculation fallback minimum bid ${fallbackMinBid}`, {
                currentPrice: auctionCarData.currentPrice,
                minPreBid: auctionCarData.minPreBid || 0
              });
            }
          }
          
          // Load bid data
          await loadBidData(auctionCarData.id);
        }
        return;
      } catch (directLookupError) {
        console.warn('CarDetail: direct auctionCar lookup failed (endpoint not available), trying fallback', directLookupError);
      }
      
      // Fallback: Get all auctions and search
      const auctions = await apiClient.getAuctions({ limit: 100 });
      console.log('CarDetail: auctions loaded', auctions.length);

      // Search through auctions to find the one containing this car
      for (const auction of auctions) {
        if (!mounted) break;
        
        try {
          const auctionCars = await apiClient.getAuctionCars(auction.id);
          console.log(`CarDetail: checking auction ${auction.id}, cars: ${auctionCars.length}`);
          
          const foundAuctionCar = auctionCars.find(ac => ac.carId === carId);
          if (foundAuctionCar) {
            console.log('CarDetail: found auctionCar', foundAuctionCar);
            if (mounted) {
              // Get detailed auction information to get minBidIncrement
              const auctionDetail = await apiClient.getAuction(auction.id);
              console.log('CarDetail: auction detail loaded', auctionDetail);
              
              // Transform AuctionDetailDto to AuctionDto
              const auctionDto: AuctionDto = {
                id: auction.id,
                name: auctionDetail.name || 'Unknown Auction',
                status: auctionDetail.status === 'Live' ? 2 : auctionDetail.status === 'Scheduled' ? 1 : auctionDetail.status === 'Completed' ? 3 : 0,
                statusText: auctionDetail.status,
                startTimeUtc: auctionDetail.startTimeUtc,
                endTimeUtc: auctionDetail.endTimeUtc,
                minBidIncrement: auctionDetail.minBidIncrement
              };
              setAuctionDetails(auctionDto);
              
              // Transform AuctionCarGetDto to AuctionCarDto
              const auctionCarDto: AuctionCarDto = {
                id: foundAuctionCar.id,
                auctionId: foundAuctionCar.auctionId,
                carId: foundAuctionCar.carId,
                lotNumber: foundAuctionCar.lotNumber || '',
                currentPrice: foundAuctionCar.currentPrice,
                startingPrice: foundAuctionCar.minPreBid || 0,
                reservePrice: foundAuctionCar.reservePrice || 0
              };
              setAuctionCar(auctionCarDto);
              
              // Fetch next minimum bid from backend with fallback calculation
              try {
                console.log(`CarDetail: fetching next minimum bid for auctionCar ${foundAuctionCar.id}`);
                const response = await apiClient.getNextMinimumBid(foundAuctionCar.id);
                if (mounted) {
                  // Handle both number and object response formats
                  const nextMinBid = typeof response === 'number' ? response : response.nextMinimumBid;
                  setMinimumNextBid(nextMinBid);
                  console.log(`CarDetail: backend minimum bid set to ${nextMinBid}`);
                }
              } catch (minBidError) {
                console.error('CarDetail: failed to fetch next minimum bid, using local calculation', minBidError);
                // Fallback to local calculation using bidCalculator utility
                if (mounted) {
                  const fallbackMinBid = calculateMinimumBid(
                    foundAuctionCar.currentPrice, 
                    foundAuctionCar.minPreBid || 0
                  );
                  setMinimumNextBid(fallbackMinBid);
                  console.log(`CarDetail: using local calculation fallback minimum bid ${fallbackMinBid}`, {
                    currentPrice: foundAuctionCar.currentPrice,
                    minPreBid: foundAuctionCar.minPreBid || 0
                  });
                }
              }
              
              // Load bid data
              await loadBidData(foundAuctionCar.id);
            }
            break;
          }
        } catch (error) {
          console.warn(`CarDetail: failed to load cars for auction ${auction.id}`, error);
        }
      }
      
      console.log('CarDetail: finished searching for auction data');
    } catch (error) {
      console.warn('CarDetail: failed to load auctions', error);
    }
  };

  // Load bid data
  const loadBidData = async (auctionCarId: string) => {
    if (!mounted) return;
    
    try {
      console.log('CarDetail: loading bid data for auctionCar', auctionCarId);
      
      // Load recent bids
      const token = user?.token || localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!token) {
        console.warn('CarDetail: no auth token available for bid data');
        if (mounted) setBids([]);
        return;
      }
      
      const response = await fetch(`https://localhost:7249/api/Bid/auction-car/${auctionCarId}/recent?count=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const bidResponse: BidResponse = await response.json();
        console.log('CarDetail: bids loaded', bidResponse.data.length);
        if (mounted) setBids(bidResponse.data || []);
      } else {
        console.warn('CarDetail: failed to load bids', response.status);
        if (mounted) setBids([]);
      }
    } catch (error) {
      console.warn('CarDetail: failed to load bid data', error);
      if (mounted) setBids([]);
    }
  };

  // Handle bid placement with enhanced notification system
  const handlePlaceBid = async (amount?: number) => {
    const bidAmountToUse = amount || bidAmount;
    
    // Pre-validation checks
    if (!auctionCar || !bidAmountToUse || bidAmountToUse <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Bid',
        message: 'Please enter a valid bid amount'
      });
      return;
    }

    // Check minimum bid amount
    if (bidAmountToUse < minimumNextBid) {
      addToast({
        type: 'error',
        title: 'Bid Too Low',
        message: `Your bid is too low. The next minimum bid is ${formatCurrency(minimumNextBid)}.`
      });
      return;
    }
    
    // Step 1: Show loading notification immediately
    const loadingToastId = addToast({
      type: 'info',
      title: 'Placing Your Bid...',
      message: 'Please wait while we process your bid request.',
      duration: 0 // Don't auto-dismiss - we'll close it manually
    });
    
    try {
      setIsPlacingBid(true);
      
      const token = user?.token || localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in to place a bid.');
      }

      // Determine bid type based on auction status
      let isPreBid = false;
      let bidType = 'live';
      
      if (auctionDetails) {
        // Auction status enum: 0=Draft, 1=Scheduled, 2=Live/Running, 3=Completed, 4=Cancelled
        // Pre-bid is only allowed when auction is NOT live (status !== 2)
        if (auctionDetails.status === 2) {
          // Auction is live - place live bid
          isPreBid = false;
          bidType = 'live';
        } else {
          // Auction is not live - place pre-bid
          isPreBid = true;
          bidType = 'prebid';
        }
      } else {
        // If no auction details, default to pre-bid for safety
        isPreBid = true;
        bidType = 'prebid';
      }

      console.log('CarDetail: placing bid', {
        auctionStatus: auctionDetails?.status,
        auctionStatusText: auctionDetails ? getStatusText(auctionDetails.status, auctionDetails.statusText) : 'Unknown',
        isPreBid,
        bidType,
        bidAmount: bidAmountToUse,
        minimumNextBid
      });

      let result;
      
      if (isPreBid) {
        // Use apiClient.placePreBid method for pre-bids
        const preBidRequest = {
          auctionCarId: auctionCar.id,
          amount: bidAmountToUse,
          notes: '' // Optional field
        };
        
        console.log('CarDetail: placing pre-bid with request:', preBidRequest);
        result = await apiClient.placePreBid(preBidRequest);
      } else {
        // Use apiClient.placeLiveBid method for live bids
        const liveBidRequest = {
          auctionCarId: auctionCar.id,
          amount: bidAmountToUse,
          notes: '' // Optional field
        };
        
        console.log('CarDetail: placing live bid with request:', liveBidRequest);
        result = await apiClient.placeLiveBid(liveBidRequest);
      }

      console.log('CarDetail: bid placed successfully', result);

      // Step 2: Close loading notification and show success notification
      if (loadingToastId) {
        removeToast(loadingToastId);
      }
      
      // Show enhanced success notification
      addToast({
        type: 'success',
        title: '🎉 Success!',
        message: `Your ${bidType === 'live' ? 'live' : 'pre'} bid of ${formatCurrency(bidAmountToUse)} has been placed successfully!`
      });
      
      // Clear bid input
      setBidAmount(0);
      
      // Refresh bids to show the new bid
      await loadBidData(auctionCar.id);
      
      // Update minimum next bid with fallback calculation
      try {
        const response = await apiClient.getNextMinimumBid(auctionCar.id);
        // Handle both number and object response formats
        const nextMinBid = typeof response === 'number' ? response : response.nextMinimumBid;
        setMinimumNextBid(nextMinBid);
        console.log('CarDetail: updated minimum bid from backend after placing bid:', nextMinBid);
      } catch (minBidError) {
        console.warn('CarDetail: failed to update minimum bid from backend, using local calculation', minBidError);
        // Fallback to local calculation
        const fallbackMinBid = calculateMinimumBid(
          auctionCar.currentPrice, 
          auctionCar.startingPrice || 0
        );
        setMinimumNextBid(fallbackMinBid);
        console.log('CarDetail: updated minimum bid using local calculation:', fallbackMinBid);
      }
      
    } catch (error) {
      console.error('CarDetail: bid placement failed', error);
      
      // Step 3: Close loading notification and show specific error notification
      if (loadingToastId) {
        removeToast(loadingToastId);
      }
      
      // Enhanced error handling with specific messages
      let errorTitle = 'An Error Occurred';
      let errorMessage = 'We couldn\'t place your bid due to an unexpected error. Please try again later.';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        // Handle specific error cases based on backend response
        if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          errorTitle = 'Authentication Required';
          errorMessage = 'You must be logged in to place a bid. Please log in and try again.';
        } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          errorTitle = 'Access Denied';
          errorMessage = 'You do not have permission to place bids on this auction.';
        } else if (errorMsg.includes('400') || errorMsg.includes('bad request')) {
          if (errorMsg.includes('minimum') || errorMsg.includes('too low')) {
            errorTitle = 'Bid Too Low';
            errorMessage = `Your bid is too low. The next minimum bid is ${formatCurrency(minimumNextBid)}.`;
          } else {
            errorTitle = 'Invalid Bid';
            errorMessage = 'Invalid bid amount or auction not accepting bids.';
          }
        } else if (errorMsg.includes('409') || errorMsg.includes('conflict')) {
          if (errorMsg.includes('closed') || errorMsg.includes('ended')) {
            errorTitle = 'Auction Closed';
            errorMessage = 'This auction is no longer accepting bids.';
          } else {
            errorTitle = 'Bid Conflict';
            errorMessage = 'Your bid conflicts with current auction state. Please refresh and try again.';
          }
        } else if (errorMsg.includes('500') || errorMsg.includes('internal server error')) {
          errorTitle = 'Server Error';
          errorMessage = 'We\'re experiencing technical difficulties. Please try again in a few moments.';
        } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (errorMsg.includes('timeout')) {
          errorTitle = 'Request Timeout';
          errorMessage = 'Your request took too long to process. Please try again.';
        }
      }
      
      addToast({
        type: 'error',
        title: errorTitle,
        message: errorMessage
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  // Formatting functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatVIN = (vin: string) => {
    if (vin.length > 7) {
      return `${vin.substring(0, 3)}...${vin.substring(vin.length - 4)}`;
    }
    return vin;
  };

  const getStatusText = (status: number, statusText?: string) => {
    if (statusText) return statusText;
    
    const statusMap: { [key: number]: string } = {
      0: 'Draft',
      1: 'Scheduled',
      2: 'Live',
      3: 'Completed',
      4: 'Cancelled'
    };
    
    return statusMap[status] || 'Unknown';
  };

  // Photo navigation

  // Effects
  useEffect(() => {
    setMounted(true);
    loadCarDetails();
    
    return () => {
      setMounted(false);
    };
  }, [carId]);

  // Auto-focus bid input when coming from watchlist
  useEffect(() => {
    if (isBidIntent && bidInputRef.current && !loading) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        bidInputRef.current?.focus();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isBidIntent, loading]);

  // Real-time minimum bid calculation when auction car data changes
  useEffect(() => {
    if (auctionCar && auctionDetails) {
      console.log('CarDetail: auction car data changed, recalculating minimum bid', {
        currentPrice: auctionCar.currentPrice,
        startingPrice: auctionCar.startingPrice,
        auctionStatus: auctionDetails.status
      });
      
      // Calculate minimum bid using local calculation for real-time updates
      const calculatedMinBid = calculateMinimumBid(
        auctionCar.currentPrice,
        auctionCar.startingPrice || 0
      );
      
      // Only update if the calculated value is different from current state
      if (calculatedMinBid !== minimumNextBid) {
        setMinimumNextBid(calculatedMinBid);
        console.log('CarDetail: real-time minimum bid updated:', calculatedMinBid);
      }
    }
  }, [auctionCar?.currentPrice, auctionCar?.startingPrice, auctionDetails?.status]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading car details...</p>
                  </div>
                </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">Error Loading Car Details</p>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No car details
  if (!carDetails) {
  return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">Car Not Found</p>
          <p className="text-white/60 mb-6">The requested car could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {carDetails.make} {carDetails.model} ({carDetails.year})
                </h1>
                <p className="text-white/60">
                  VIN: {formatVIN(carDetails.vin)}
                </p>
                <p className="text-white/60">
                  {location ? `${location.city} - ${location.name}` : 'Location TBD'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          {/* Left Side - Photo Gallery (65%) */}
          <div className="lg:col-span-3">
            <PhotoGallery 
              photoUrls={carDetails.photoUrls || []} 
              vehicleName={`${carDetails.year} ${carDetails.make} ${carDetails.model}`}
            />
          </div>

          {/* Right Side - Bidding Panel (35%) */}
          <div className="lg:col-span-2">
            <BiddingPanel
              auctionDetails={auctionDetails}
              auctionCar={auctionCar}
              bids={bids}
              user={user}
              minimumNextBid={minimumNextBid}
              onPlaceBid={handlePlaceBid}
              isPlacingBid={isPlacingBid}
              showBidMessage={showBidMessage}
              onCloseBidMessage={() => setShowBidMessage(false)}
              bidInputRef={bidInputRef}
              bidAmount={bidAmount}
              setBidAmount={setBidAmount}
            />
          </div>
        </div>

        {/* Detailed Information Section - Tabbed Interface */}
        <DetailTabs
          carDetails={carDetails}
          location={location}
          auctionDetails={auctionDetails}
          auctionCar={auctionCar}
          bids={bids}
        />
      </div>
    </div>
  );
};

export default CarDetail;