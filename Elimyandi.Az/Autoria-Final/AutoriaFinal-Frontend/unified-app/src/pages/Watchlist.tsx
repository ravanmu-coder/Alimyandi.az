import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CarPhotos from '../components/CarPhotos';
import Alert from '../components/Alert';
import { 
  Search, 
  Download, 
  Clock, 
  MapPin, 
  Car, 
  Users, 
  Eye, 
  Trash2,
  X,
  Phone,
  Mail,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface WatchlistVehicle {
  id: string;
  auctionCarId: string;
  carId: string;
  auctionId: string;
  lotNumber?: string;
  year: number;
  make?: string;
  model?: string;
  image?: string;
  odometer: number;
  damage?: string;
  estimatedRetailValue: number;
  currentBid: number;
  bidCount: number;
  reservePrice: number;
  isReserveMet: boolean;
  auctionStartTime: string;
  auctionEndTime: string;
  isLive: boolean;
  location: {
    city: string;
    region: string;
    address: string;
    phone: string;
    email: string;
    username: string;
    auctionJoinDate: string;
  };
  condition: {
    titleType: string;
    keysStatus: 'Available' | 'Not Available';
  };
  addedToWatchlistAt: string;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: WatchlistVehicle['location'];
  lotNumber: string;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, location, lotNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-200">Location Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <X className="h-5 w-5 text-slate-400" strokeWidth="1.5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="bg-blue-500/20 border border-blue-500/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Car className="h-5 w-5 text-blue-400" strokeWidth="1.5" />
                <span className="font-semibold text-blue-400">Lot #{lotNumber}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-slate-400" strokeWidth="1.5" />
                <div>
                  <p className="font-medium text-slate-200">{location.city}, {location.region}</p>
                  <p className="text-sm text-slate-400">{location.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" strokeWidth="1.5" />
                <span className="text-slate-200">{location.phone}</span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" strokeWidth="1.5" />
                <span className="text-slate-200">{location.email}</span>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-400" strokeWidth="1.5" />
                <span className="text-slate-200">{location.username}</span>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" strokeWidth="1.5" />
                <span className="text-slate-200">Joined: {new Date(location.auctionJoinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Watchlist: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<WatchlistVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField] = useState<keyof WatchlistVehicle>('addedToWatchlistAt');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedLocation, setSelectedLocation] = useState<WatchlistVehicle['location'] | null>(null);
  const [selectedLotNumber, setSelectedLotNumber] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'removed' } | null>(null);

  // Role-based access control
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const roles = user?.user?.roles;
    const isMember = roles && roles.includes('Member');
    const isSeller = roles && roles.includes('Seller');
    
    if (!isMember && !isSeller) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && (user?.user?.roles?.includes('Member') || user?.user?.roles?.includes('Seller'))) {
      loadWatchlistData();
    }
  }, [isAuthenticated, user]);

  // Refresh watchlist when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadWatchlistData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadWatchlistData = () => {
    setLoading(true);
    try {
      // Load watchlist data from localStorage
      const savedWatchlistData = localStorage.getItem('vehicleWatchlistData');
      if (savedWatchlistData) {
        const watchlistData: WatchlistVehicle[] = JSON.parse(savedWatchlistData);
        setVehicles(watchlistData);
        console.log('Watchlist loaded from localStorage:', watchlistData);
      } else {
        setVehicles([]);
        console.log('No watchlist data found in localStorage');
      }
    } catch (error) {
      console.error('Error loading watchlist from localStorage:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = (vehicleId: string) => {
    try {
      // Remove from detailed data
      const savedWatchlistData = localStorage.getItem('vehicleWatchlistData');
      if (savedWatchlistData) {
        const watchlistData: WatchlistVehicle[] = JSON.parse(savedWatchlistData);
        const filteredData = watchlistData.filter(item => item.id !== vehicleId);
        localStorage.setItem('vehicleWatchlistData', JSON.stringify(filteredData));
      }

      // Remove from IDs list
      const savedWatchlist = localStorage.getItem('vehicleWatchlist');
      if (savedWatchlist) {
        const watchlistArray: string[] = JSON.parse(savedWatchlist);
        const filteredIds = watchlistArray.filter(id => id !== vehicleId);
        localStorage.setItem('vehicleWatchlist', JSON.stringify(filteredIds));
      }

      // Update local state
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
      setAlert({ message: 'Removed from Watchlist', type: 'removed' });
      console.log(`Vehicle ${vehicleId} removed from watchlist`);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setAlert({ message: 'Error removing from watchlist', type: 'error' });
    }
  };

  const handleRemoveFromWatchlist = (vehicleId: string) => {
    removeFromWatchlist(vehicleId);
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatOdometer = (odometer: number) => {
    return new Intl.NumberFormat('en-US').format(odometer) + ' mi';
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { text: 'Auction Ended', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { text: `${days}d ${hours}h`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    } else {
      return { text: `${minutes}m`, color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  const getSaleStatus = (auctionStartTime: string, auctionEndTime: string, isLive: boolean) => {
    const now = new Date();
    const start = new Date(auctionStartTime);
    const end = new Date(auctionEndTime);
    
    if (now < start) {
      return { text: 'Upcoming', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    } else if (now >= start && now <= end && isLive) {
      return { text: 'Live', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else {
      return { text: 'Ended', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const handleLocationClick = (location: WatchlistVehicle['location'], lotNumber: string) => {
    setSelectedLocation(location);
    setSelectedLotNumber(lotNumber);
    setShowLocationModal(true);
  };

  const handleBidNow = (vehicle: WatchlistVehicle) => {
    // Navigate to CarDetail page with bid parameter
    navigate(`/car/${vehicle.carId}?bid=true`);
  };


  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export watchlist to CSV/Excel');
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const query = searchQuery.toLowerCase();
    return (
      (vehicle.make?.toLowerCase() || '').includes(query) ||
      (vehicle.model?.toLowerCase() || '').includes(query) ||
      (vehicle.lotNumber?.toLowerCase() || '').includes(query)
    );
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const paginatedVehicles = sortedVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Toast Notifications */}
      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}
      
      <div className="max-w-7xl mx-auto px-8 sm:px-8 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Watchlist</h1>
            <p className="text-slate-400">Track your favorite vehicles and bid on them</p>
          </div>
          <button
            onClick={loadWatchlistData}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <RefreshCw className="h-4 w-4" strokeWidth="1.5" />
            Refresh
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Filters */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-xl p-4 mb-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by make, model or lot number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-3 pl-12 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:shadow-md hover:scale-105 placeholder-slate-400"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth="1.5" />
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200 hover:shadow-md hover:scale-105 text-sm font-medium"
                >
                  <Download className="h-4 w-4" strokeWidth="1.5" />
                  Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="px-4 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Sale Info
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Bid Status
                          </th>
                          <th className="px-4 py-4 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedVehicles.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <Eye className="h-12 w-12 text-slate-400" strokeWidth="1.5" />
                                <div className="text-center">
                                  <p className="text-lg text-slate-200 mb-2">No vehicles in your watchlist</p>
                                  <p className="text-sm text-slate-400 mb-6">Add vehicles from the Vehicle Finder to get started</p>
                                  <Link 
                                    to="/vehicle-finder"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg hover:scale-105"
                                  >
                                    <Car className="h-4 w-4" strokeWidth="1.5" />
                                    Browse Vehicles
                                  </Link>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedVehicles.map((vehicle) => {
                          const timeRemaining = getTimeRemaining(vehicle.auctionEndTime);
                          const saleStatus = getSaleStatus(vehicle.auctionStartTime, vehicle.auctionEndTime, vehicle.isLive);
                          
                          return (
                            <tr key={vehicle.id} className="hover:bg-slate-800/50 hover:-translate-y-px transition-all duration-200 border-b border-slate-700 active:scale-[0.99] group">
                              {/* Vehicle Column */}
                              <td className="px-4 py-6 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-16 h-12 rounded-lg overflow-hidden">
                                    <CarPhotos 
                                      carId={vehicle.carId} 
                                      showMultiple={false}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-1 left-1">
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-medium rounded-full">
                                        Watch
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors duration-200">
                                      {vehicle.year} {vehicle.make} {vehicle.model}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                      Lot #{vehicle.lotNumber || 'N/A'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {formatOdometer(vehicle.odometer)} • {vehicle.damage || 'No Damage'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Est. Value: {formatPrice(vehicle.estimatedRetailValue)}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Location Column */}
                              <td className="px-4 py-6 whitespace-nowrap">
                                <button
                                  onClick={() => handleLocationClick(vehicle.location, vehicle.lotNumber || 'N/A')}
                                  className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105"
                                >
                                  <MapPin className="h-4 w-4" strokeWidth="1.5" />
                                  <div className="text-left">
                                    <div>{vehicle.location.city}, {vehicle.location.region}</div>
                                    <div className="text-xs text-slate-400">{vehicle.location.address}</div>
                                  </div>
                                </button>
                              </td>

                              {/* Sale Info Column */}
                              <td className="px-4 py-6 whitespace-nowrap">
                                <div className="space-y-2">
                                  <div className="text-sm text-slate-200">
                                    {new Date(vehicle.auctionStartTime).toLocaleDateString()}
                                  </div>
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md hover:scale-105 ${
                                    saleStatus.text === 'Live' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    saleStatus.text === 'Upcoming' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                  }`}>
                                    {saleStatus.text}
                                  </span>
                                </div>
                              </td>

                              {/* Bid Status Column */}
                              <td className="px-4 py-6 whitespace-nowrap">
                                <div className="space-y-2">
                                  <div className="text-lg font-bold text-blue-400">
                                    {formatPrice(vehicle.currentBid)}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Users className="h-4 w-4" strokeWidth="1.5" />
                                    {vehicle.bidCount} bids
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md hover:scale-105 ${
                                      vehicle.isReserveMet 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                      Reserve {vehicle.isReserveMet ? 'Met' : 'Not Met'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" strokeWidth="1.5" />
                                    <span className={`text-sm font-medium ${
                                      timeRemaining.text === 'Auction Ended' ? 'text-red-400' :
                                      timeRemaining.text.includes('d') || timeRemaining.text.includes('h') ? 'text-orange-400' :
                                      'text-red-400'
                                    }`}>
                                      {timeRemaining.text}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Actions Column */}
                              <td className="px-4 py-6 whitespace-nowrap">
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => handleBidNow(vehicle)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg hover:scale-105"
                                  >
                                    Bid Now
                                  </button>
                                  <Link
                                    to={`/auctions/${vehicle.auctionId}/cars/${vehicle.carId}`}
                                    className="px-4 py-2 bg-slate-800/60 border border-slate-600 text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-700/60 transition-all duration-200 hover:shadow-md hover:scale-105 text-center"
                                  >
                                    View Details
                                  </Link>
                                  <button
                                    onClick={() => handleRemoveFromWatchlist(vehicle.id)}
                                    className="px-4 py-2 text-slate-400 hover:text-red-400 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" strokeWidth="1.5" />
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-t border-slate-700">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-400">
                            Showing{' '}
                            <span className="font-medium text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span>
                            {' '}to{' '}
                            <span className="font-medium text-slate-200">
                              {Math.min(currentPage * itemsPerPage, filteredVehicles.length)}
                            </span>
                            {' '}of{' '}
                            <span className="font-medium text-slate-200">{filteredVehicles.length}</span>
                            {' '}results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-600 bg-slate-800/60 text-sm font-medium text-slate-400 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-105 ${
                                    currentPage === pageNum
                                      ? 'z-10 bg-blue-500/20 border-blue-500 text-blue-400 shadow-sm'
                                      : 'bg-slate-800/60 border-slate-600 text-slate-400 hover:bg-slate-700/60'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-600 bg-slate-800/60 text-sm font-medium text-slate-400 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:scale-105"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* About Watchlist Panel */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-5 w-5 text-blue-400" strokeWidth="1.5" />
                <h3 className="text-lg font-semibold text-slate-200">About Watchlist</h3>
              </div>
              
              <div className="space-y-6 text-sm text-slate-400">
                <p className="leading-relaxed">
                  Track vehicles and never miss bidding opportunities. 
                  Real-time updates on prices and auction status.
                </p>
                
                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">Features:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Real-time updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Live bid tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Reserve status monitoring</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Easy management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Export data</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-200 mb-3">Status Colors:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Green:</strong> Reserve Met</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Red:</strong> Reserve Not Met</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Orange:</strong> Time Remaining</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span><strong className="text-slate-200">Blue:</strong> Upcoming Auction</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Modal */}
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          location={selectedLocation!}
          lotNumber={selectedLotNumber}
        />
      </div>
    </div>
  );
};

export default Watchlist;
