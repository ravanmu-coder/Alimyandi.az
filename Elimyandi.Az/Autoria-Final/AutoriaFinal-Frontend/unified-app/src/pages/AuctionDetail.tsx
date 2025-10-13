import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { AuctionDetailDto, AuctionCarGetDto } from '../types/api';
import CarCard from '../components/CarCard';
import CountdownTimer from '../components/CountdownTimer';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Car, 
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Activity
} from 'lucide-react';

export default function AuctionDetail() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const [auction, setAuction] = useState<AuctionDetailDto | null>(null);
  const [cars, setCars] = useState<AuctionCarGetDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'sold' | 'unsold'>('all');

  useEffect(() => {
    if (auctionId) {
      loadAuctionData();
    }
  }, [auctionId]);

  const loadAuctionData = async () => {
    if (!auctionId) return;
    
    try {
      const [auctionData, carsData] = await Promise.all([
        apiClient.getAuction(auctionId),
        apiClient.getAuctionCars(auctionId)
      ]);
      
      setAuction(auctionData);
      setCars(carsData);
    } catch (error) {
      console.error('Error loading auction data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterCars = () => {
    switch (activeTab) {
      case 'active':
        return cars.filter(car => car.isActive);
      case 'sold':
        return cars.filter(car => car.winnerStatus === 'sold');
      case 'unsold':
        return cars.filter(car => car.winnerStatus === 'unsold');
      default:
        return cars;
    }
  };

  const filteredCars = filterCars();

  if (isLoading || !auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <div className="space-y-4">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'all', label: 'All Cars', count: cars.length },
    { key: 'active', label: 'Active', count: cars.filter(car => car.isActive).length },
    { key: 'sold', label: 'Sold', count: cars.filter(car => car.winnerStatus === 'sold').length },
    { key: 'unsold', label: 'Unsold', count: cars.filter(car => car.winnerStatus === 'unsold').length },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/all-auctions" className="hover:text-blue-600 transition-colors">
            Auctions
          </Link>
          <span>•</span>
          <span className="text-gray-900 font-medium">{auction.name}</span>
        </div>

        {/* Back Button */}
        <Link
          to="/all-auctions"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Auctions
        </Link>

        {/* Auction Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{auction.name}</h1>
                {auction.isLive && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    LIVE
                  </span>
                )}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(auction.status)}`}>
                  {auction.status}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{new Date(auction.startTimeUtc).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                {auction.currentCarLotNumber && (
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    <span>Current Lot: #{auction.currentCarLotNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown Timer */}
            {new Date(auction.endTimeUtc) > new Date() && (
              <div className="mt-6 lg:mt-0">
                <div className="text-sm text-gray-600 mb-2">Auction ends in:</div>
                <CountdownTimer
                  targetDate={auction.endTimeUtc}
                  size="large"
                />
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Car className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{auction.totalCarsCount}</span>
              </div>
              <div className="text-sm text-gray-600">Total Cars</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{auction.carsWithPreBidsCount}</span>
              </div>
              <div className="text-sm text-gray-600">Pre-Bids</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{auction.soldCarsCount}</span>
              </div>
              <div className="text-sm text-gray-600">Cars Sold</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(auction.totalSalesAmount)}
                </span>
              </div>
              <div className="text-sm text-gray-600">Total Sales</div>
            </div>
          </div>
        </div>

        {/* Cars Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Cars Grid */}
          {filteredCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
              <p className="text-gray-600">
                No cars match the selected filter "{tabs.find(t => t.key === activeTab)?.label}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}