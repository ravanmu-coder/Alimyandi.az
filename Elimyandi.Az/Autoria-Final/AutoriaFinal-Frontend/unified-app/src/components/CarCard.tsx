import { Link } from 'react-router-dom';
import { AuctionCarGetDto } from '../types/api';
import { Car, Users, Clock } from 'lucide-react';

interface CarCardProps {
  car: AuctionCarGetDto;
}

export default function CarCard({ car }: CarCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'sold':
        return 'bg-green-100 text-green-800';
      case 'unsold':
        return 'bg-red-100 text-red-800';
      case 'active':
      case 'live':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const timeAgo = (dateString: string | undefined) => {
    if (!dateString) return null;
    
    const now = new Date();
    const bidTime = new Date(dateString);
    const diffMs = now.getTime() - bidTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const carInfo = `${car.carYear || ''} ${car.carMake || ''} ${car.carModel || ''}`.trim();

  return (
    <Link 
      to={`/auctions/${car.auctionId}/cars/${car.id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300 group"
    >
      <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-xl overflow-hidden">
        {car.carImage ? (
          <img 
            src={car.carImage} 
            alt={carInfo}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100">
            <Car className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-medium">
            Lot #{car.lotNumber}
          </span>
        </div>
        
        <div className="absolute top-3 right-3 flex space-x-2">
          {car.isActive && (
            <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium animate-pulse">
              LIVE
            </span>
          )}
          {car.isReserveMet && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
              RESERVE MET
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Car Info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
            {carInfo || 'Car Details'}
          </h3>
          {car.winnerStatus && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(car.winnerStatus)}`}>
              {car.winnerStatus}
            </span>
          )}
        </div>

        {/* Price Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Current Price</div>
            <div className="text-xl font-bold text-green-600">
              {formatPrice(car.currentPrice)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Min Pre-Bid</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(car.minPreBid)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{car.bidCount} bids</span>
          </div>
          
          {car.lastBidTime && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{timeAgo(car.lastBidTime)}</span>
            </div>
          )}
        </div>

        {car.reservePrice && (
          <div className="mt-3 text-xs text-gray-500">
            Reserve: {formatPrice(car.reservePrice)}
          </div>
        )}
      </div>
    </Link>
  );
}