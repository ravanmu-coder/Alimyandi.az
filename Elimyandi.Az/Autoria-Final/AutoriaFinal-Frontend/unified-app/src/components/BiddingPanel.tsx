import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Clock, 
  Users, 
  Play, 
  AlertCircle,
  X,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { getEnumLabel } from '../services/enumService';
import { calculateMinimumBid, validateBidAmount, getSuggestedBidAmounts } from '../utils/bidCalculator';

interface AuctionDetails {
  id: string;
  name: string;
  status: number;
  statusText?: string;
  startTimeUtc: string;
  endTimeUtc: string;
  minBidIncrement: number;
}

interface AuctionCar {
  id: string;
  auctionId: string;
  carId: string;
  lotNumber: string;
  currentPrice: number;
  startingPrice: number;
  reservePrice: number;
}

interface Bid {
  id: string;
  amount: number;
  userId: string;
  userName?: string;
  createdAt: string;
  type: string;
  status: string;
}

interface BiddingPanelProps {
  auctionDetails: AuctionDetails | null;
  auctionCar: AuctionCar | null;
  bids: Bid[];
  user: any;
  minimumNextBid: number;
  onPlaceBid: (amount: number) => Promise<void>;
  isPlacingBid: boolean;
  showBidMessage: boolean;
  onCloseBidMessage: () => void;
  bidInputRef: React.RefObject<HTMLInputElement>;
  bidAmount: number;
  setBidAmount: (amount: number) => void;
}

const BiddingPanel: React.FC<BiddingPanelProps> = ({
  auctionDetails,
  auctionCar,
  bids,
  user,
  minimumNextBid,
  onPlaceBid,
  isPlacingBid,
  showBidMessage,
  onCloseBidMessage,
  bidInputRef,
  bidAmount,
  setBidAmount
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Local minimum bid calculation for real-time updates
  const [localMinimumBid, setLocalMinimumBid] = useState<number>(minimumNextBid);
  const [suggestedBids, setSuggestedBids] = useState<number[]>([]);
  const [bidValidation, setBidValidation] = useState<{
    isValid: boolean;
    message: string;
    minimumRequired: number;
  }>({ isValid: true, message: '', minimumRequired: minimumNextBid });

  // Formatting functions
  const formatPrice = (price?: number, currency: string = 'USD') => {
    if (price === null || price === undefined || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: number, statusText?: string) => {
    const statusMap: { [key: number]: { text: string; color: string; bgColor: string } } = {
      0: { text: 'Draft', color: 'text-gray-300', bgColor: 'bg-gray-600' },
      1: { text: 'Scheduled', color: 'text-yellow-300', bgColor: 'bg-yellow-600' },
      2: { text: 'Live', color: 'text-green-300', bgColor: 'bg-green-600' },
      3: { text: 'Ended', color: 'text-red-300', bgColor: 'bg-red-600' },
      4: { text: 'Cancelled', color: 'text-gray-300', bgColor: 'bg-gray-600' }
    };

    const statusInfo = statusMap[status] || statusMap[0];
    const displayText = statusText || statusInfo.text;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
        {status === 2 && <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>}
        {displayText}
      </span>
    );
  };


  const getBidStatus = () => {
    if (!user?.user?.id) return 'Not logged in';
    
    const userBids = bids.filter(bid => bid.userId === user.user.id);
    if (userBids.length === 0) return 'No bids placed';
    
    const highestUserBid = Math.max(...userBids.map(bid => bid.amount));
    const isHighest = highestUserBid >= Math.max(...bids.map(bid => bid.amount));
    
    return isHighest ? 'Highest bidder' : `Bid: ${formatCurrency(highestUserBid)}`;
  };

  const handlePlaceBid = async () => {
    if (bidAmount && bidAmount >= localMinimumBid) {
      await onPlaceBid(bidAmount);
      setBidAmount(0);
    }
  };

  // Real-time minimum bid calculation when auction car data changes
  useEffect(() => {
    if (auctionCar) {
      console.log('BiddingPanel: auction car data changed, recalculating minimum bid', {
        currentPrice: auctionCar.currentPrice,
        startingPrice: auctionCar.startingPrice
      });
      
      // Calculate minimum bid using local calculation
      const calculatedMinBid = calculateMinimumBid(
        auctionCar.currentPrice,
        auctionCar.startingPrice || 0
      );
      
      setLocalMinimumBid(calculatedMinBid);
      
      // Generate suggested bid amounts
      const suggested = getSuggestedBidAmounts(
        auctionCar.currentPrice,
        auctionCar.startingPrice || 0
      );
      setSuggestedBids(suggested);
      
      console.log('BiddingPanel: real-time minimum bid updated:', {
        calculatedMinBid,
        suggestedBids: suggested
      });
    }
  }, [auctionCar?.currentPrice, auctionCar?.startingPrice]);

  // Update local minimum bid when prop changes (from backend)
  useEffect(() => {
    if (minimumNextBid !== localMinimumBid) {
      console.log('BiddingPanel: minimum bid prop updated from backend:', minimumNextBid);
      setLocalMinimumBid(minimumNextBid);
    }
  }, [minimumNextBid]);

  // Real-time bid validation
  useEffect(() => {
    if (bidAmount > 0 && auctionCar) {
      const validation = validateBidAmount(
        bidAmount,
        auctionCar.currentPrice,
        auctionCar.startingPrice || 0
      );
      setBidValidation(validation);
      console.log('BiddingPanel: bid validation updated:', validation);
    } else {
      setBidValidation({ isValid: true, message: '', minimumRequired: localMinimumBid });
    }
  }, [bidAmount, auctionCar?.currentPrice, auctionCar?.startingPrice, localMinimumBid]);

  // Countdown timer effect
  useEffect(() => {
    if (!auctionDetails || auctionDetails.status !== 2) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(auctionDetails.endTimeUtc).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auctionDetails]);

  if (!auctionCar) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">This car is not currently in any auction</p>
        </div>
      </div>
    );
  }

  const bidStatus = getBidStatus();
  const isLive = auctionDetails?.status === 2;

  // Set initial bid amount to minimum bid when component loads or localMinimumBid changes
  useEffect(() => {
    if (localMinimumBid > 0 && bidAmount === 0) {
      setBidAmount(localMinimumBid);
    }
  }, [localMinimumBid, bidAmount]);

  // Debug logging for props
  useEffect(() => {
    console.log('BiddingPanel - Props received:', {
      auctionDetails,
      auctionCar,
      localMinimumBid,
      backendMinimumBid: minimumNextBid,
      bidsCount: bids.length,
      bids: bids.slice(0, 3) // Show first 3 bids for debugging
    });
  }, [auctionDetails, auctionCar, localMinimumBid, minimumNextBid, bids]);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Auction & Bidding
      </h2>

      <div className="space-y-6">
        {/* Auction Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {auctionDetails?.name || 'Auction'}
            </h3>
            <p className="text-white/60 text-sm">Lot #{auctionCar.lotNumber}</p>
          </div>
          {auctionDetails && getStatusBadge(auctionDetails.status, auctionDetails.statusText)}
        </div>

        {/* Countdown Timer */}
        {isLive && (
          <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-semibold">Auction Ending Soon!</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{timeLeft.days}</div>
                <div className="text-xs text-white/60">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{timeLeft.hours}</div>
                <div className="text-xs text-white/60">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{timeLeft.minutes}</div>
                <div className="text-xs text-white/60">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{timeLeft.seconds}</div>
                <div className="text-xs text-white/60">Seconds</div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Information */}
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-sm">Current Bid</span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatPrice(auctionCar.currentPrice)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-white/60 text-xs mb-1">Starting Price</div>
              <div className="text-white font-semibold">
                {formatPrice(auctionCar.startingPrice)}
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-white/60 text-xs mb-1">Reserve Price</div>
              <div className="text-white font-semibold">
                {formatPrice(auctionCar.reservePrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Bid Message from Watchlist */}
        {showBidMessage && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Play className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-100 mb-1">
                  Bid Verin!
                </h3>
                <p className="text-blue-200 text-sm">
                  Bu aracın müzayedesinde teklif vermek için aşağıdaki alanı kullanın.
                </p>
              </div>
              <button
                onClick={onCloseBidMessage}
                className="text-blue-300 hover:text-blue-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Bid Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">
              Bid Amount
            </label>
            <div className="relative">
              <input
                ref={bidInputRef}
                type="number"
                value={bidAmount || ''}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                placeholder={formatPrice(localMinimumBid)}
                min={localMinimumBid}
                className={`w-full bg-gray-700 text-white px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-lg ${
                  bidValidation.isValid 
                    ? 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20' 
                    : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 text-sm">
                USD
              </div>
            </div>
            <div className="mt-1">
              <p className="text-white/60 text-xs">
                Next minimum bid: {formatPrice(localMinimumBid)}
              </p>
              {!bidValidation.isValid && bidAmount > 0 && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {bidValidation.message}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handlePlaceBid}
            disabled={isPlacingBid || !bidAmount || bidAmount < localMinimumBid || !bidValidation.isValid}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
          >
            {isPlacingBid ? 'Placing Bid...' : 
              auctionDetails ? 
                (auctionDetails.status === 2) ? 'Place Live Bid' : 'Place Pre-Bid' : 
                'Place Bid'}
          </button>

          {/* Suggested Bid Amounts */}
          {suggestedBids.length > 0 && (
            <div className="mt-4">
              <p className="text-white/60 text-sm mb-2">Quick Bid Options:</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedBids.slice(0, 4).map((amount, index) => (
                  <button
                    key={index}
                    onClick={() => setBidAmount(amount)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      bidAmount === amount
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white/80 hover:bg-gray-600'
                    }`}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-white/60 text-xs">Bidders</span>
            </div>
            <div className="text-white font-semibold">
              {new Set(bids.map(bid => bid.userId)).size}
            </div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-white/60 text-xs">Total Bids</span>
            </div>
            <div className="text-white font-semibold">
              {bids.length}
            </div>
          </div>
        </div>

        {/* User Bid Status */}
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="text-white/60 text-xs mb-1">Your Status</div>
          <div className="text-white font-semibold">{bidStatus}</div>
        </div>
      </div>
    </div>
  );
};

export default BiddingPanel;
