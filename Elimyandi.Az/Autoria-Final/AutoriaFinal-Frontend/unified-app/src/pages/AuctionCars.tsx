import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  Calendar, 
  MapPin, 
  Gauge, 
  Eye, 
  Clock,
  DollarSign,
  Users,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { AuctionCarGetDto } from '../types/api';

const AuctionCars: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [auctionCars, setAuctionCars] = useState<AuctionCarGetDto[]>([]);
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (auctionId) {
      loadAuctionCars();
      loadAuctionDetails();
    }
  }, [auctionId]);

  const loadAuctionCars = async () => {
    if (!auctionId) return;
    
    setLoading(true);
    try {
      const cars = await apiClient.getAuctionCars(auctionId);
      setAuctionCars(cars);
    } catch (error) {
      console.error('Error loading auction cars:', error);
      setAuctionCars([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAuctionDetails = async () => {
    if (!auctionId) return;
    
    try {
      const auctionData = await apiClient.getAuction(auctionId);
      setAuction(auctionData);
    } catch (error) {
      console.error('Error loading auction details:', error);
      setAuction(null);
    }
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-800';
      case 'Sold': return 'bg-green-100 text-green-800';
      case 'Unsold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCars = auctionCars.filter(car => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return car.isActive;
    if (filterStatus === 'sold') return car.winnerStatus === 'Sold';
    if (filterStatus === 'unsold') return car.winnerStatus === 'Unsold';
    return true;
  });

  const CarCard: React.FC<{ car: AuctionCarGetDto; viewMode: 'grid' | 'list' }> = ({ car, viewMode }) => {
    if (viewMode === 'list') {
      return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="flex">
            <div className="relative w-48 h-32 flex-shrink-0">
              <img 
                src={car.carImage || '/placeholder-car.jpg'} 
                alt={`${car.carMake} ${car.carModel}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-car.jpg';
                }}
              />
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(car.winnerStatus || 'Active')}`}>
                  {car.winnerStatus || 'Active'}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                  {car.lotNumber}
                </span>
              </div>
            </div>
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {car.carYear} {car.carMake} {car.carModel}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Gauge className="h-4 w-4" />
                      Lot {car.lotNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {car.bidCount} bids
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600 mb-1">{formatPrice(car.currentPrice)}</p>
                  <p className="text-sm text-gray-600">
                    {car.isReserveMet ? 'Reserve Met' : 'Reserve Not Met'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {car.reservePrice && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      Reserve: {formatPrice(car.reservePrice)}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                    Min Bid: {formatPrice(car.minPreBid)}
                  </span>
                </div>
                <Link 
                  to={`/auctions/${car.auctionId}/cars/${car.carId}`}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img 
            src={car.carImage || '/placeholder-car.jpg'} 
            alt={`${car.carMake} ${car.carModel}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-car.jpg';
            }}
          />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(car.winnerStatus || 'Active')}`}>
              {car.winnerStatus || 'Active'}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
              {car.lotNumber}
            </span>
          </div>
          <div className="absolute bottom-3 right-3">
            <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">
              {formatPrice(car.currentPrice)}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {car.carYear} {car.carMake} {car.carModel}
          </h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{car.bidCount} bids</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Min: {formatPrice(car.minPreBid)}</span>
            </div>
            {car.reservePrice && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Reserve: {formatPrice(car.reservePrice)}</span>
                <span className={`px-2 py-1 rounded text-xs ${car.isReserveMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {car.isReserveMet ? 'Met' : 'Not Met'}
                </span>
              </div>
            )}
          </div>
          <Link 
            to={`/auctions/${car.auctionId}/cars/${car.carId}`}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/sales-list')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales List
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {auction?.name || 'Auction Cars'}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{auction?.locationName || 'Location TBD'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(auction?.startTimeUtc || '')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(auction?.startTimeUtc || '')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Cars</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="unsold">Unsold</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredCars.length} of {auctionCars.length} cars
              </div>
            </div>
          </div>
        </div>

        {/* Cars Grid/List */}
        {filteredCars.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }>
            {filteredCars.map((car) => (
              <CarCard 
                key={car.id} 
                car={car} 
                viewMode={viewMode} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionCars;
