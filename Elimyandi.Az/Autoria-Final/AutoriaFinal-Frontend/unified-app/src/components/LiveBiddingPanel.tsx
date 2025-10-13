import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Zap,
  Target,
  Shield
} from 'lucide-react';

interface BidStats {
  totalBids: number;
  bidCount: number;
  averageBid: number;
  soldCount: number;
  totalSalesAmount: number;
}

interface LiveBiddingPanelProps {
  auctionCarId: string;
  currentPrice: number;
  reservePrice?: number;
  minimumBid: number;
  suggestedAmount?: number;
  bidCount: number;
  isActive: boolean;
  isReserveMet: boolean;
  lastBidTime?: string;
  stats: BidStats;
  onPlaceLiveBid: (amount: number) => Promise<boolean>;
  onPlacePreBid: (amount: number) => Promise<boolean>;
  onPlaceProxyBid: (startAmount: number, maxAmount: number) => Promise<boolean>;
  onCancelProxyBid: () => Promise<boolean>;
  bidValidationError?: string;
  isConnected: boolean;
}

type BidType = 'live' | 'pre' | 'proxy';

export const LiveBiddingPanel: React.FC<LiveBiddingPanelProps> = ({
  auctionCarId,
  currentPrice,
  reservePrice,
  minimumBid,
  suggestedAmount,
  bidCount,
  isActive,
  isReserveMet,
  lastBidTime,
  stats,
  onPlaceLiveBid,
  onPlacePreBid,
  onPlaceProxyBid,
  onCancelProxyBid,
  bidValidationError,
  isConnected
}) => {
  const [bidType, setBidType] = useState<BidType>('live');
  const [bidAmount, setBidAmount] = useState<string>('');
  const [proxyStartAmount, setProxyStartAmount] = useState<string>('');
  const [proxyMaxAmount, setProxyMaxAmount] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [lastBidSuccess, setLastBidSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  // Update bid amount when minimum bid changes
  useEffect(() => {
    if (minimumBid > 0 && !bidAmount) {
      setBidAmount(minimumBid.toString());
    }
  }, [minimumBid, bidAmount]);

  // Update suggested amount
  useEffect(() => {
    if (suggestedAmount && suggestedAmount > minimumBid) {
      setBidAmount(suggestedAmount.toString());
    }
  }, [suggestedAmount, minimumBid]);

  // Clear success state after 3 seconds
  useEffect(() => {
    if (lastBidSuccess) {
      const timer = setTimeout(() => setLastBidSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastBidSuccess]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  };

  const handleBidAmountChange = (value: string) => {
    // Only allow numbers and one decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) return; // Only one decimal point allowed
    if (parts[1] && parts[1].length > 2) return; // Max 2 decimal places
    
    setBidAmount(cleanValue);
    setError('');
  };

  const handleProxyAmountChange = (field: 'start' | 'max', value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    
    if (field === 'start') {
      setProxyStartAmount(cleanValue);
    } else {
      setProxyMaxAmount(cleanValue);
    }
    setError('');
  };

  const validateBidAmount = (amount: number): string | null => {
    if (amount < minimumBid) {
      return `Minimum bid is ${formatCurrency(minimumBid)}`;
    }
    if (amount <= currentPrice) {
      return `Bid must be higher than current price of ${formatCurrency(currentPrice)}`;
    }
    if (amount > 1000000) {
      return 'Bid amount seems unusually high. Please verify.';
    }
    return null;
  };

  const handlePlaceBid = async () => {
    console.log('handlePlaceBid');
    if (!isConnected) {
      setError('Not connected to auction. Please refresh the page.');
      return;
    }

    // if (!isActive) {
    //   setError('Auction is not currently active.');
    //   return;
    // }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      setError('Please enter a valid bid amount.');
      return;
    }

    const validationError = validateBidAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPlacingBid(true);
    setError('');

    try {
      let success = false;
      
      switch (bidType) {
        case 'live':
          success = await onPlaceLiveBid(amount);
          break;
        case 'pre':
          success = await onPlacePreBid(amount);
          break;
        case 'proxy':
          const startAmount = parseFloat(proxyStartAmount);
          const maxAmount = parseFloat(proxyMaxAmount);
          
          if (isNaN(startAmount) || isNaN(maxAmount)) {
            setError('Please enter valid proxy bid amounts.');
            setIsPlacingBid(false);
            return;
          }
          
          if (startAmount >= maxAmount) {
            setError('Start amount must be less than maximum amount.');
            setIsPlacingBid(false);
            return;
          }
          
          success = await onPlaceProxyBid(startAmount, maxAmount);
          break;
      }

      if (success) {
        setLastBidSuccess(true);
        setBidAmount('');
        setProxyStartAmount('');
        setProxyMaxAmount('');
      } else {
        setError('Failed to place bid. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleCancelProxyBid = async () => {
    setIsPlacingBid(true);
    setError('');

    try {
      const success = await onCancelProxyBid();
      if (success) {
        setLastBidSuccess(true);
      } else {
        setError('Failed to cancel proxy bid. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel proxy bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const getQuickBidAmounts = (): number[] => {
    const base = Math.max(currentPrice, minimumBid);
    return [
      base + 25,
      base + 50,
      base + 100,
      base + 250,
      base + 500
    ];
  };

  const isBidButtonDisabled = () => {
    if (!isConnected || !isActive || isPlacingBid) return true;
    
    if (bidType === 'proxy') {
      const start = parseFloat(proxyStartAmount);
      const max = parseFloat(proxyMaxAmount);
      return isNaN(start) || isNaN(max) || start >= max;
    }
    
    const amount = parseFloat(bidAmount);
    return isNaN(amount) || amount < minimumBid || amount <= currentPrice;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Live Bidding</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Current Price Display */}
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {formatCurrency(currentPrice)}
        </div>
        <div className="text-sm text-gray-600">
          Current Highest Bid
        </div>
        {reservePrice && (
          <div className={`text-sm mt-1 ${isReserveMet ? 'text-green-600' : 'text-orange-600'}`}>
            Reserve: {formatCurrency(reservePrice)} {isReserveMet ? '✓ Met' : 'Not Met'}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-semibold">{bidCount}</div>
          <div className="text-xs text-gray-600">Bids</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-semibold">{formatCurrency(stats.averageBid)}</div>
          <div className="text-xs text-gray-600">Avg Bid</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <div className="text-lg font-semibold">{formatTime(lastBidTime)}</div>
          <div className="text-xs text-gray-600">Last Bid</div>
        </div>
      </div>

      {/* Bid Type Selection */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setBidType('live')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              bidType === 'live'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Live Bid
          </button>
          <button
            onClick={() => setBidType('pre')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              bidType === 'pre'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Target className="h-4 w-4 inline mr-2" />
            Pre-Bid
          </button>
          <button
            onClick={() => setBidType('proxy')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              bidType === 'proxy'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Proxy Bid
          </button>
        </div>

        {/* Bid Amount Input */}
        {bidType !== 'proxy' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Bid Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={bidAmount}
                onChange={(e) => handleBidAmountChange(e.target.value)}
                placeholder={minimumBid.toString()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isPlacingBid}
              />
            </div>
            <div className="text-xs text-gray-600">
              Minimum: {formatCurrency(minimumBid)}
              {suggestedAmount && suggestedAmount > minimumBid && (
                <span className="ml-2 text-blue-600">
                  Suggested: {formatCurrency(suggestedAmount)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Proxy Bid Inputs */}
        {bidType === 'proxy' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={proxyStartAmount}
                    onChange={(e) => handleProxyAmountChange('start', e.target.value)}
                    placeholder={minimumBid.toString()}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isPlacingBid}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={proxyMaxAmount}
                    onChange={(e) => handleProxyAmountChange('max', e.target.value)}
                    placeholder={(minimumBid + 1000).toString()}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isPlacingBid}
                  />
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Proxy bid will automatically bid up to your maximum amount
            </div>
          </div>
        )}

        {/* Quick Bid Buttons */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Quick Bids</div>
          <div className="grid grid-cols-5 gap-2">
            {getQuickBidAmounts().map((amount, index) => (
              <button
                key={index}
                onClick={() => {
                  if (bidType === 'proxy') {
                    setProxyStartAmount(amount.toString());
                    setProxyMaxAmount((amount + 500).toString());
                  } else {
                    setBidAmount(amount.toString());
                  }
                }}
                className="py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isPlacingBid}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(error || bidValidationError) && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">
            {error || bidValidationError}
          </span>
        </div>
      )}

      {/* Success Display */}
      {lastBidSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700 text-sm">
            Bid placed successfully!
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handlePlaceBid}
          // disabled={isBidButtonDisabled()}
          // className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          //   isBidButtonDisabled()
          //     ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          //     : 'bg-blue-600 text-white hover:bg-blue-700'
          // }`}
        >
          {isPlacingBid ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Placing Bid...
            </div>
          ) : (
            `Place ${bidType === 'live' ? 'Live' : bidType === 'pre' ? 'Pre-' : 'Proxy '}Bid`
          )}
        </button>

        {bidType === 'proxy' && (
          <button
            onClick={handleCancelProxyBid}
            disabled={isPlacingBid}
            className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            Cancel Proxy Bid
          </button>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          Disconnected from auction. Please refresh the page.
        </div>
      )}

      {!isActive && (
        <div className="text-center text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
          <Clock className="h-4 w-4 inline mr-2" />
          Auction is not currently active.
        </div>
      )}
    </div>
  );
};
