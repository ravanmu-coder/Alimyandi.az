import React from 'react';
import { Link } from 'react-router-dom';
import { AuctionGetDto } from '../types/api';
import { Calendar, MapPin, Car, Clock, TrendingUp } from 'lucide-react';
import { getEnumLabel, getEnumBadgeClasses } from '../services/enumService';

interface AuctionCardProps {
  auction: AuctionGetDto;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const getStatusColor = (status: string) => {
    // Use enum service for consistent styling
    const badgeClasses = getEnumBadgeClasses('AuctionStatus', status)
    return badgeClasses
  };

  const getStatusLabel = (status: string) => {
    // Use enum service for consistent labeling
    return getEnumLabel('AuctionStatus', status)
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  const startDateTime = formatDateTime(auction.startTimeUtc);
  const timeUntilStart = getTimeUntilStart(auction.startTimeUtc);
  const isLive = auction.isLive;

  return (
    <Link 
      to={`/auctions/${auction.id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300 group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {auction.name}
              </h3>
              {isLive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
                  LIVE
                </span>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(auction.status)}`}>
              {getStatusLabel(auction.status)}
            </span>
          </div>
          
          {auction.currentCarLotNumber && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Lot</div>
              <div className="text-lg font-semibold text-blue-600">
                #{auction.currentCarLotNumber}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Car className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Total Cars</div>
              <div className="font-semibold text-gray-900">{auction.totalCarsCount}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Pre-Bids</div>
              <div className="font-semibold text-gray-900">{auction.carsWithPreBidsCount}</div>
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{startDateTime.date} at {startDateTime.time}</span>
          </div>
          
          {auction.locationName && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-32">{auction.locationName}</span>
            </div>
          )}
        </div>

        {/* Time until start or live indicator */}
        {timeUntilStart && !isLive && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Starts in {timeUntilStart}</span>
          </div>
        )}
      </div>
    </Link>
  );
}