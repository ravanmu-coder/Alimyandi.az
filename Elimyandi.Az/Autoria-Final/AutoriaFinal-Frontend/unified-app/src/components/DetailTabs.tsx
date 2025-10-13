import React, { useState } from 'react';
import { 
  Car, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  Wrench,
  Fuel,
  Settings,
  FileText,
  Shield
} from 'lucide-react';
import { getEnumLabel } from '../services/enumService';

interface CarDetails {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  odometer: number;
  estRetailValue: number;
  condition: number;
  color: string;
  engine: string;
  transmission: number;
  driveTrain: number;
  titleType: number;
  damageType: number;
  description?: string;
}

interface LocationDetails {
  id: string;
  name: string;
  city: string;
  region: string;
  postalCode: string;
}

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

interface DetailTabsProps {
  carDetails: CarDetails;
  location: LocationDetails | null;
  auctionDetails: AuctionDetails | null;
  auctionCar: AuctionCar | null;
  bids: Bid[];
}

const DetailTabs: React.FC<DetailTabsProps> = ({
  carDetails,
  location,
  auctionDetails,
  auctionCar,
  bids
}) => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'auction' | 'bids'>('vehicle');

  // Formatting functions
  const formatPrice = (price?: number, currency: string = 'USD') => {
    if (price === null || price === undefined || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  };

  const formatMileage = (mileage?: number, unit: string = 'miles') => {
    if (mileage === null || mileage === undefined || isNaN(mileage)) return 'N/A';
    return `${mileage.toLocaleString()} ${unit}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatOdometer = (odometer: number) => {
    return new Intl.NumberFormat('en-US').format(odometer);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const getStatusText = (status: number, statusText?: string) => {
    if (statusText) return statusText;
    
    const statusMap: { [key: number]: string } = {
      0: 'Draft',
      1: 'Scheduled',
      2: 'Live',
      3: 'Ended',
      4: 'Cancelled'
    };
    
    return statusMap[status] || 'Unknown';
  };

  const tabs = [
    { id: 'vehicle', label: 'Vehicle Details', icon: Car },
    { id: 'auction', label: 'Auction & Location', icon: Calendar },
    { id: 'bids', label: 'Bid History', icon: Users }
  ] as const;

  const renderVehicleDetails = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Car className="h-5 w-5" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">Year</p>
            <p className="text-white font-semibold">{carDetails.year}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Make</p>
            <p className="text-white font-semibold">{carDetails.make}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Model</p>
            <p className="text-white font-semibold">{carDetails.model}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">VIN</p>
            <p className="text-white font-semibold font-mono text-sm">{carDetails.vin}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Color</p>
            <p className="text-white font-semibold">{carDetails.color || 'N/A'}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Odometer</p>
            <p className="text-white font-semibold">{formatMileage(carDetails.odometer)}</p>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Technical Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">Condition</p>
            <p className="text-white font-semibold">
              {getEnumLabel('CarCondition', carDetails.condition)}
            </p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Engine</p>
            <p className="text-white font-semibold">{carDetails.engine || 'N/A'}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Transmission</p>
            <p className="text-white font-semibold">{getEnumLabel('Transmission', carDetails.transmission)}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Drive Train</p>
            <p className="text-white font-semibold">{getEnumLabel('DriveTrain', carDetails.driveTrain)}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Title Type</p>
            <p className="text-white font-semibold">{getEnumLabel('TitleType', carDetails.titleType)}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm mb-1">Damage Type</p>
            <p className="text-white font-semibold">{getEnumLabel('DamageType', carDetails.damageType)}</p>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">Estimated Retail Value</p>
            <p className="text-white font-semibold text-lg">{formatPrice(carDetails.estRetailValue)}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {carDetails.description && (
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Description
          </h3>
          <p className="text-white leading-relaxed">{carDetails.description}</p>
        </div>
      )}
    </div>
  );

  const renderAuctionLocation = () => (
    <div className="space-y-6">
      {/* Auction Information */}
      {auctionDetails && (
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Auction Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Auction Name</p>
              <p className="text-white font-semibold">{auctionDetails.name}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Status</p>
              <p className="text-white font-semibold">
                {getStatusText(auctionDetails.status, auctionDetails.statusText)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Start Time</p>
              <p className="text-white font-semibold">{formatDate(auctionDetails.startTimeUtc)}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">End Time</p>
              <p className="text-white font-semibold">{formatDate(auctionDetails.endTimeUtc)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Auction Car Details */}
      {auctionCar && (
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Auction Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Lot Number</p>
              <p className="text-white font-semibold">{auctionCar.lotNumber}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Current Price</p>
              <p className="text-white font-semibold">{formatPrice(auctionCar.currentPrice)}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Starting Price</p>
              <p className="text-white font-semibold">{formatPrice(auctionCar.startingPrice)}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Reserve Price</p>
              <p className="text-white font-semibold">{formatPrice(auctionCar.reservePrice)}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Minimum Bid Increment</p>
              <p className="text-white font-semibold">{formatPrice(auctionDetails?.minBidIncrement || 100)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Information */}
      {location && (
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Location Name</p>
              <p className="text-white font-semibold">{location.name}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">City</p>
              <p className="text-white font-semibold">{location.city}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Region</p>
              <p className="text-white font-semibold">{location.region}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Postal Code</p>
              <p className="text-white font-semibold">{location.postalCode}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBidHistory = () => (
    <div className="space-y-6">
      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bid History ({bids.length} bids)
        </h3>
        
        {bids.length > 0 ? (
          <div className="space-y-3">
            {bids.map((bid, index) => (
              <div key={bid.id} className="bg-gray-600/30 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                        #{bids.length - index}
                      </div>
                      <div className="text-white font-semibold text-lg">
                        {formatPrice(bid.amount)}
                      </div>
                    </div>
                    <div className="text-white/60 text-sm">
                      Bidder: {bid.userName || 'Anonymous'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-sm">
                      {formatDate(bid.createdAt)}
                    </div>
                    <div className="text-white/60 text-xs mt-1">
                      {bid.type} • {bid.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No bids placed yet</p>
            <p className="text-white/40 text-sm mt-1">Be the first to place a bid!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'vehicle' && renderVehicleDetails()}
        {activeTab === 'auction' && renderAuctionLocation()}
        {activeTab === 'bids' && renderBidHistory()}
      </div>
    </div>
  );
};

export default DetailTabs;
