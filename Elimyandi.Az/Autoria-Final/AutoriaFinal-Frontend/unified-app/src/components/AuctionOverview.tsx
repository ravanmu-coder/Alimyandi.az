import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Car, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  city: string;
  country?: string;
  region?: string;
  postalCode?: string;
}

interface AuctionStats {
  totalVehicles: number;
  totalRevenue: number;
  vehiclesSold: number;
  successRate: number;
  averagePrice: number;
  totalBids: number;
}

interface AuctionOverviewProps {
  auctionId: string;
  auctionName: string;
  startTimeUtc?: string;
  endTimeUtc?: string;
  locationId?: string;
  currency?: string;
  isLive: boolean;
  stats: AuctionStats;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const AuctionOverview: React.FC<AuctionOverviewProps> = ({
  auctionId,
  auctionName,
  startTimeUtc,
  endTimeUtc,
  locationId,
  currency = 'USD',
  isLive,
  stats,
  onRefresh,
  isRefreshing = false
}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Load location data
  useEffect(() => {
    if (locationId) {
      loadLocationData();
    }
  }, [locationId]);

  // Update time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (endTimeUtc) {
        const now = new Date();
        const endTime = new Date(endTimeUtc);
        const diff = endTime.getTime() - now.getTime();

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('Ended');
        }
      } else {
        setTimeRemaining('N/A');
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTimeUtc]);

  const loadLocationData = async () => {
    if (!locationId) return;

    setLocationLoading(true);
    setLocationError(null);

    try {
      // Import apiClient dynamically to avoid circular dependencies
      const { apiClient } = await import('../lib/api');
      const locationData = await apiClient.getLocationById(locationId);
      
      setLocation(locationData);
    } catch (error: any) {
      console.error('Failed to load location:', error);
      setLocationError(error.message || 'Failed to load location');
    } finally {
      setLocationLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const getLocationDisplay = (): string => {
    if (locationLoading) return 'Loading...';
    if (locationError) return 'TBD';
    if (!location) return 'TBD';
    
    if (location.city && location.name) {
      return `${location.city} - ${location.name}`;
    }
    return location.name || 'TBD';
  };

  const getStatusColor = (): string => {
    if (isLive) return 'text-green-600 bg-green-100';
    if (timeRemaining === 'Ended') return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getStatusText = (): string => {
    if (isLive) return 'Live';
    if (timeRemaining === 'Ended') return 'Ended';
    return 'Scheduled';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{auctionName}</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {timeRemaining !== 'N/A' && timeRemaining !== 'Ended' && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">{timeRemaining}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Location */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {getLocationDisplay()}
          </div>
          {locationLoading && (
            <div className="text-sm text-gray-500">Loading location details...</div>
          )}
          {locationError && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Location information unavailable
            </div>
          )}
          {location && !locationLoading && !locationError && (
            <div className="text-sm text-gray-600">
              {location.region && `${location.region}, `}
              {location.country}
              {location.postalCode && ` ${location.postalCode}`}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <Car className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{stats.totalVehicles}</div>
          <div className="text-sm text-blue-700">Total Vehicles</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-sm text-green-700">Total Revenue</div>
        </div>

        {/* Vehicles Sold */}
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">{stats.vehiclesSold}</div>
          <div className="text-sm text-purple-700">Vehicles Sold</div>
        </div>

        {/* Success Rate */}
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">
            {stats.successRate.toFixed(1)}%
          </div>
          <div className="text-sm text-orange-700">Success Rate</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Average Price</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.averagePrice)}
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Bids</div>
              <div className="text-xl font-bold text-gray-900">{stats.totalBids}</div>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Auction Details */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Auction Details</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-gray-600">Start Time</div>
              <div className="font-medium">{formatDate(startTimeUtc)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-gray-600">End Time</div>
              <div className="font-medium">{formatDate(endTimeUtc)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details (if available) */}
      {location && !locationLoading && !locationError && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Details</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Name</div>
              <div className="font-medium">{location.name}</div>
            </div>
            <div>
              <div className="text-gray-600">City</div>
              <div className="font-medium">{location.city}</div>
            </div>
            {location.region && (
              <div>
                <div className="text-gray-600">Region</div>
                <div className="font-medium">{location.region}</div>
              </div>
            )}
            {location.country && (
              <div>
                <div className="text-gray-600">Country</div>
                <div className="font-medium">{location.country}</div>
              </div>
            )}
            {location.postalCode && (
              <div>
                <div className="text-gray-600">Postal Code</div>
                <div className="font-medium">{location.postalCode}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
