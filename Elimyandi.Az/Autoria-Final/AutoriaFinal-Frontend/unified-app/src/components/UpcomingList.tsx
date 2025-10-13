import React from 'react';
import { Eye, Clock } from 'lucide-react';
import { AuctionCarListItem } from '../api/auctions';
import { LiveIndicator } from './LiveIndicator';

interface UpcomingListProps {
  items: AuctionCarListItem[];
  currentItemId?: string;
  onItemClick: (item: AuctionCarListItem) => void;
  className?: string;
}

export const UpcomingList: React.FC<UpcomingListProps> = ({
  items,
  currentItemId,
  onItemClick,
  className = ''
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Lots</h3>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No upcoming lots</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Lots</h3>
        <p className="text-sm text-gray-500">{items.length} items</p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`
              p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors
              ${item.id === currentItemId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
            `}
            onClick={() => onItemClick(item)}
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded-lg overflow-hidden">
                {item.photoUrls.length > 0 ? (
                  <img
                    src={item.photoUrls[0]}
                    alt={`Lot ${item.lotNumber}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-xs">📷</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    Lot #{item.lotNumber}
                  </h4>
                  <LiveIndicator isLive={item.isActive} size="sm" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    Item #{item.itemNumber}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.currentPrice)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {item.bidCount} bid{item.bidCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {item.lastBidTime && (
                    <p className="text-xs text-gray-500">
                      Last bid: {formatTime(item.lastBidTime)}
                    </p>
                  )}

                  {item.isReserveMet !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.isReserveMet 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        Reserve {item.isReserveMet ? 'Met' : 'Not Met'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label={`View lot ${item.lotNumber}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
