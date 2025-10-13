import React from 'react';
import { BidGetDto } from '../types/api';
import { User, Clock, TrendingUp, Award } from 'lucide-react';

interface BidCardProps {
  bid: BidGetDto;
  showCarInfo?: boolean;
}

export default function BidCard({ bid, showCarInfo = true }: BidCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getBidTypeIcon = (bidType: string) => {
    switch (bidType?.toLowerCase()) {
      case 'proxy':
        return <TrendingUp className="h-4 w-4" />;
      case 'live':
        return <Clock className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getBidStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'winning':
        return 'bg-blue-100 text-blue-800';
      case 'outbid':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${bid.isHighlighted ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getBidTypeIcon(bid.bidType)}
          <div>
            <div className="font-medium text-gray-900">
              {bid.userDisplayName || bid.userName || 'Anonymous'}
            </div>
            {showCarInfo && bid.auctionCarLotNumber && (
              <div className="text-sm text-gray-500">
                Lot #{bid.auctionCarLotNumber}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(bid.amount)}
          </div>
          {bid.proxyMax && (
            <div className="text-sm text-gray-500">
              Max: {formatPrice(bid.proxyMax)}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {bid.isWinning && (
            <div className="flex items-center text-green-600 text-sm">
              <Award className="h-4 w-4 mr-1" />
              Winning
            </div>
          )}
          
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBidStatusColor(bid.status)}`}>
            {bid.status}
          </span>
          
          {bid.isProxy && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Proxy
            </span>
          )}
          
          {bid.isPreBid && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Pre-bid
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          {bid.timeAgo}
        </div>
      </div>

      {bid.distanceFromLeader > 0 && (
        <div className="mt-2 text-sm text-red-600">
          {formatPrice(bid.distanceFromLeader)} behind leader
        </div>
      )}
      
      {bid.remainingProxyAmount && bid.remainingProxyAmount > 0 && (
        <div className="mt-2 text-sm text-blue-600">
          {formatPrice(bid.remainingProxyAmount)} proxy remaining
        </div>
      )}
    </div>
  );
}