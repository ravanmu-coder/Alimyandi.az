import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  User, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  Shield
} from 'lucide-react';

interface Bid {
  id: string;
  auctionCarId: string;
  userId: string;
  userName: string;
  amount: number;
  placedAtUtc: string;
  bidType: 'live' | 'pre' | 'proxy';
  isHighestBid?: boolean;
  isMyBid?: boolean;
}

interface BidHistoryProps {
  auctionCarId: string;
  bids: Bid[];
  onRefresh: () => void;
  isRefreshing?: boolean;
  isConnected: boolean;
  currentUserId?: string;
}

export const BidHistory: React.FC<BidHistoryProps> = ({
  auctionCarId,
  bids,
  onRefresh,
  isRefreshing = false,
  isConnected,
  currentUserId
}) => {
  const [sortedBids, setSortedBids] = useState<Bid[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sort bids by time (newest first) and update state
  useEffect(() => {
    const sorted = [...bids].sort((a, b) => 
      new Date(b.placedAtUtc).getTime() - new Date(a.placedAtUtc).getTime()
    );
    
    // Mark highest bid
    if (sorted.length > 0) {
      const highestAmount = Math.max(...sorted.map(bid => bid.amount));
      sorted.forEach(bid => {
        bid.isHighestBid = bid.amount === highestAmount;
      });
    }
    
    setSortedBids(sorted);
  }, [bids]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, onRefresh]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Unknown';
    }
  };

  const formatFullTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const getBidTypeIcon = (bidType: string) => {
    switch (bidType) {
      case 'live':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'pre':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'proxy':
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBidTypeColor = (bidType: string): string => {
    switch (bidType) {
      case 'live':
        return 'text-blue-600 bg-blue-100';
      case 'pre':
        return 'text-orange-600 bg-orange-100';
      case 'proxy':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBidTypeLabel = (bidType: string): string => {
    switch (bidType) {
      case 'live':
        return 'Live';
      case 'pre':
        return 'Pre-Bid';
      case 'proxy':
        return 'Proxy';
      default:
        return 'Bid';
    }
  };

  const displayedBids = showAll ? sortedBids : sortedBids.slice(0, 10);

  const getHighestBid = (): Bid | null => {
    return sortedBids.find(bid => bid.isHighestBid) || null;
  };

  const getMyBids = (): Bid[] => {
    if (!currentUserId) return [];
    return sortedBids.filter(bid => bid.userId === currentUserId);
  };

  const getBidStats = () => {
    const totalBids = sortedBids.length;
    const uniqueBidders = new Set(sortedBids.map(bid => bid.userId)).size;
    const averageBid = totalBids > 0 
      ? sortedBids.reduce((sum, bid) => sum + bid.amount, 0) / totalBids 
      : 0;
    const highestBid = getHighestBid();

    return {
      totalBids,
      uniqueBidders,
      averageBid,
      highestBid: highestBid?.amount || 0,
      highestBidder: highestBid?.userName || 'None'
    };
  };

  const stats = getBidStats();
  const myBids = getMyBids();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Bid History</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">
            Disconnected from auction. Bid history may not be up to date.
          </span>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-900">{stats.totalBids}</div>
          <div className="text-xs text-blue-700">Total Bids</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <User className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-900">{stats.uniqueBidders}</div>
          <div className="text-xs text-green-700">Bidders</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <DollarSign className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-purple-900">
            {formatCurrency(stats.averageBid)}
          </div>
          <div className="text-xs text-purple-700">Avg Bid</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <CheckCircle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-orange-900">
            {formatCurrency(stats.highestBid)}
          </div>
          <div className="text-xs text-orange-700">Highest</div>
        </div>
      </div>

      {/* My Bids Summary */}
      {myBids.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Your Bids ({myBids.length})</h4>
          <div className="space-y-1">
            {myBids.slice(0, 3).map((bid) => (
              <div key={bid.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getBidTypeIcon(bid.bidType)}
                  <span className="font-medium">{formatCurrency(bid.amount)}</span>
                  {bid.isHighestBid && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Highest
                    </span>
                  )}
                </div>
                <span className="text-gray-600">{formatTime(bid.placedAtUtc)}</span>
              </div>
            ))}
            {myBids.length > 3 && (
              <div className="text-xs text-blue-700 mt-2">
                +{myBids.length - 3} more bids
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bid List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">
            Recent Bids ({sortedBids.length})
          </h4>
          {sortedBids.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showAll ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>

        {displayedBids.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No bids yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {displayedBids.map((bid, index) => (
              <div
                key={bid.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  bid.isHighestBid 
                    ? 'bg-green-50 border-green-200' 
                    : bid.userId === currentUserId
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getBidTypeIcon(bid.bidType)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBidTypeColor(bid.bidType)}`}>
                      {getBidTypeLabel(bid.bidType)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(bid.amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bid.userName}
                      {bid.userId === currentUserId && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatTime(bid.placedAtUtc)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFullTime(bid.placedAtUtc)}
                  </div>
                  {bid.isHighestBid && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Highest</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Info */}
      <div className="text-center text-xs text-gray-500">
        {autoRefresh ? (
          <span>Auto-refreshing every 30 seconds</span>
        ) : (
          <span>Click refresh to update bid history</span>
        )}
      </div>
    </div>
  );
};
