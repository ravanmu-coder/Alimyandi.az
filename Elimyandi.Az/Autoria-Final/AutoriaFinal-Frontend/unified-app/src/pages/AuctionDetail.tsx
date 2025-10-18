import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { AuctionDetailDto, AuctionCarGetDto } from '../types/api';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Car, 
  TrendingUp,
  DollarSign,
  Award,
  Activity,
  Eye,
  Play,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AuctionDetail() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<AuctionDetailDto | null>(null);
  const [cars, setCars] = useState<AuctionCarGetDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'sold' | 'unsold'>('all');

  useEffect(() => {
    if (auctionId) {
      loadAuctionData();
    }
  }, [auctionId]);

  const loadAuctionData = async () => {
    if (!auctionId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading auction data for ID:', auctionId);
      
      const [auctionData, carsData] = await Promise.all([
        apiClient.getAuction(auctionId),
        apiClient.getAuctionCars(auctionId)
      ]);
      
      console.log('✅ Auction data loaded:', auctionData);
      console.log('✅ Cars data loaded:', carsData.length, 'cars');
      
      // Log car IDs for debugging photo loading
      if (carsData.length > 0) {
        console.log('🚗 First car data sample:', {
          auctionCarId: carsData[0].id,
          carId: carsData[0].carId,
          make: carsData[0].carMake || carsData[0].make,
          model: carsData[0].carModel || carsData[0].model,
          year: carsData[0].carYear || carsData[0].year,
          vin: carsData[0].carVin || carsData[0].vin
        });
      }
      
      setAuction(auctionData);
      setCars(carsData);
    } catch (error: any) {
      console.error('❌ Error loading auction data:', error);
      setError(error.message || 'Failed to load auction data');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-white text-lg">Hərrac məlumatları yüklənir...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !auction) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Hərrac Tapılmadı</h3>
            <p className="text-red-300 mb-6">{error || 'Hərrac məlumatları yüklənə bilmədi'}</p>
            <button
              onClick={() => navigate('/all-auctions')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Hərraclara Qayıt
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'all', label: 'Hamısı', count: cars.length },
    { key: 'active', label: 'Aktiv', count: cars.filter(car => car.isActive).length },
    { key: 'sold', label: 'Satılıb', count: cars.filter(car => car.winnerStatus === 'sold').length },
    { key: 'unsold', label: 'Satılmayıb', count: cars.filter(car => car.winnerStatus === 'unsold').length },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/all-auctions"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Hərraclara Qayıt
        </Link>

        {/* Auction Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          {/* Title and Status */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{auction.name}</h1>
                
                {auction.isLive && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    CANLI
                  </span>
                )}
                
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  auction.status?.toLowerCase() === 'live' || auction.status?.toLowerCase() === 'active'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : auction.status?.toLowerCase() === 'scheduled'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}>
                  {auction.status}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 lg:mt-0">
              <Link
                to={`/auctions/${auctionId}/join`}
                className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                  auction.isLive
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Play className="h-5 w-5 mr-2" />
                {auction.isLive ? 'Canlı Hərrac' : 'Hərrac Otağı'}
              </Link>
            </div>
          </div>

          {/* Information List */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center py-2 border-b border-slate-700">
              <Calendar className="h-5 w-5 mr-3 text-blue-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm font-medium mr-2">Tarix:</span>
              <span className="text-white">{formatDate(auction.startTimeUtc)}</span>
            </div>
            
            {auction.locationName && (
              <div className="flex items-center py-2 border-b border-slate-700">
                <MapPin className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm font-medium mr-2">Məkan:</span>
                <span className="text-white">{auction.locationName}</span>
              </div>
            )}
            
            {auction.currentCarLotNumber && (
              <div className="flex items-center py-2 border-b border-slate-700">
                <Activity className="h-5 w-5 mr-3 text-orange-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm font-medium mr-2">Cari Lot:</span>
                <span className="text-white font-bold">#{auction.currentCarLotNumber}</span>
              </div>
            )}

            <div className="flex items-center py-2 border-b border-slate-700">
              <Car className="h-5 w-5 mr-3 text-blue-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm font-medium mr-2">Ümumi Maşınlar:</span>
              <span className="text-white font-bold">{auction.totalCarsCount || 0}</span>
            </div>

            <div className="flex items-center py-2 border-b border-slate-700">
              <TrendingUp className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm font-medium mr-2">Pre-Bid Maşınlar:</span>
              <span className="text-white font-bold">{auction.carsWithPreBidsCount || 0}</span>
            </div>

            <div className="flex items-center py-2 border-b border-slate-700">
              <Award className="h-5 w-5 mr-3 text-yellow-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm font-medium mr-2">Satılmış Maşınlar:</span>
              <span className="text-white font-bold">{auction.soldCarsCount || 0}</span>
            </div>

            <div className="flex items-center py-2">
              <DollarSign className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm font-medium mr-2">Ümumi Satış Məbləği:</span>
              <span className="text-white font-bold">{formatCurrency(auction.totalSalesAmount || 0)}</span>
            </div>
          </div>
        </div>

        {/* Cars Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Car className="h-6 w-6 mr-3 text-blue-400" />
              Hərrac Maşınları
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-white/20'
                      : 'bg-slate-600/50'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cars List - Table Format */}
          <div className="p-6">
            {filteredCars.length > 0 ? (
              <>
                {/* Table Header */}
                <div className="flex items-center gap-4 px-4 py-3 mb-3 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="w-16 flex-shrink-0 text-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Lot</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Maşın</span>
                  </div>
                  <div className="w-32 flex-shrink-0 text-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">VIN</span>
                  </div>
                  <div className="w-32 flex-shrink-0 text-right">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Cari Bid</span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Bid Sayı</span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Əməliyyat</span>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {filteredCars.map((car) => (
                    <div
                      key={car.id}
                      className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:bg-slate-600 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Lot Number */}
                        <div className="w-16 flex-shrink-0 text-center">
                          <span className="text-lg font-bold text-white">
                            #{car.lotNumber || 'N/A'}
                          </span>
                        </div>

                        {/* Car Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-white truncate mb-1">
                            {car.carYear || car.year || ''} {car.carMake || car.make || ''} {car.carModel || car.model || ''}
                          </h3>
                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <span className="flex items-center">
                              <Car className="h-3 w-3 mr-1" />
                              {car.carCondition || 'N/A'}
                            </span>
                            {car.carOdometer && (
                              <span>{car.carOdometer.toLocaleString()} km</span>
                            )}
                          </div>
                        </div>

                        {/* VIN */}
                        <div className="w-32 flex-shrink-0 text-center">
                          <span className="text-sm text-slate-300 font-mono">
                            {(car.carVin || car.vin)?.slice(-8) || 'N/A'}
                          </span>
                        </div>

                        {/* Current Bid */}
                        <div className="w-32 flex-shrink-0 text-right">
                          <span className="text-lg font-bold text-green-400">
                            {car.currentPrice ? formatCurrency(car.currentPrice) : '-'}
                          </span>
                          {car.minPreBid > 0 && (
                            <div className="text-xs text-slate-400">
                              Min: {formatCurrency(car.minPreBid)}
                            </div>
                          )}
                        </div>

                        {/* Bid Count */}
                        <div className="w-24 flex-shrink-0 text-center">
                          <span className="text-lg font-bold text-blue-400">
                            {car.bidCount || 0}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="w-24 flex-shrink-0">
                          <div className="flex justify-center">
                            {car.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-semibold">
                                Aktiv
                              </span>
                            ) : car.winnerStatus === 'sold' ? (
                              <span className="inline-flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold">
                                Satılıb
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-full text-xs font-semibold">
                                Gözləyir
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="w-24 flex-shrink-0">
                          <div className="flex justify-center">
                            <Link
                              to={`/auction-car/${car.id}`}
                              className="w-8 h-8 bg-slate-600 hover:bg-slate-500 border border-slate-500 rounded-lg flex items-center justify-center transition-colors"
                              title="Ətraflı Bax"
                            >
                              <Eye className="h-4 w-4 text-blue-400" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Car className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Maşın Tapılmadı</h3>
                <p className="text-slate-400">
                  "{tabs.find(t => t.key === activeTab)?.label}" filtri üçün heç bir maşın tapılmadı
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
